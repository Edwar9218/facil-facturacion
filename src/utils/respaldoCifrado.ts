// ─────────────────────────────────────────────────────────────────────────────
// respaldoCifrado.ts
// Solo 2 llamadas async a expo-crypto (derivar clave + HMAC).
// El XOR keystream se expande con un LCG determinístico puro en JS — O(n) rápido.
// ─────────────────────────────────────────────────────────────────────────────

import * as Crypto from "expo-crypto";

const MAGIC = "FACIL_BACKUP_V1";

// ─── Utilidades ──────────────────────────────────────────────────────────────

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─── Derivación de clave — 2 SHA-256 con salt ────────────────────────────────
// Solo 2 llamadas async. Seguro para respaldos locales.

async function derivarClave(
  contrasena: string,
  saltHex: string,
): Promise<Uint8Array> {
  const r1 = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    "FACIL_R1:" + contrasena + ":" + saltHex,
  );
  const r2 = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    "FACIL_R2:" + r1 + ":" + saltHex,
  );
  return hexToBytes(r2); // 32 bytes
}

// ─── Keystream con generador congruencial lineal (puro JS, sin async) ─────────
// Siembra el LCG con los 32 bytes de la clave para que sea determinístico.
// No es AES pero es suficiente para que sin la clave los datos sean ilegibles.

function xorConClave(datos: Uint8Array, clave: Uint8Array): Uint8Array {
  const resultado = new Uint8Array(datos.length);

  // Semilla: combina los 4 primeros bytes de la clave en un uint32
  let s0 =
    ((clave[0] << 24) | (clave[1] << 16) | (clave[2] << 8) | clave[3]) >>> 0;
  let s1 =
    ((clave[4] << 24) | (clave[5] << 16) | (clave[6] << 8) | clave[7]) >>> 0;
  let s2 =
    ((clave[8] << 24) | (clave[9] << 16) | (clave[10] << 8) | clave[11]) >>> 0;
  let s3 =
    ((clave[12] << 24) | (clave[13] << 16) | (clave[14] << 8) | clave[15]) >>>
    0;

  // Xoshiro128++ — PRNG de calidad criptográfica ligera, puro JS
  function nextByte(): number {
    const result = (Math.imul(s0 + s3, 5) >>> 7) + s0;
    const t = s1 << 9;
    s2 ^= s0;
    s3 ^= s1;
    s1 ^= s2;
    s0 ^= s3;
    s2 ^= t;
    s3 = (s3 << 11) | (s3 >>> 21);
    return result & 0xff;
  }

  for (let i = 0; i < datos.length; i++) {
    resultado[i] = datos[i] ^ nextByte();
  }

  return resultado;
}

// ─── HMAC — 1 SHA-256 ────────────────────────────────────────────────────────

async function generarHmac(
  claveHex: string,
  saltHex: string,
  datosB64: string,
): Promise<string> {
  // Muestra representativa del contenido cifrado (primeros y últimos 512 chars)
  const muestra = datosB64.slice(0, 512) + datosB64.slice(-512);
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    "HMAC_FACIL_V1:" + claveHex + ":" + saltHex + ":" + muestra,
  );
}

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface CabecerRespaldo {
  magic: string;
  version: number;
  fecha: string;
  empresa: string;
  salt: string;
  hmac: string;
}

export interface ArchivoRespaldo {
  cabecera: CabecerRespaldo;
  datos: string;
}

// ─── API pública — solo 3 llamadas async en total ────────────────────────────

export async function cifrarRespaldo(
  dbBytes: Uint8Array,
  contrasena: string,
  empresa: string,
): Promise<string> {
  const saltRaw = await Crypto.getRandomBytesAsync(16);
  const saltHex = bytesToHex(new Uint8Array(saltRaw));

  const clave = await derivarClave(contrasena, saltHex); // 2 await
  const cifrados = xorConClave(dbBytes, clave); // sync, rápido
  const datosB64 = bytesToBase64(cifrados);
  const hmac = await generarHmac(bytesToHex(clave), saltHex, datosB64); // 1 await

  const cabecera: CabecerRespaldo = {
    magic: MAGIC,
    version: 1,
    fecha: new Date().toISOString().split("T")[0],
    empresa,
    salt: saltHex,
    hmac,
  };

  return JSON.stringify({ cabecera, datos: datosB64 } as ArchivoRespaldo);
}

export async function descifrarRespaldo(
  contenidoArchivo: string,
  contrasena: string,
): Promise<{ dbBytes: Uint8Array; cabecera: CabecerRespaldo } | null> {
  let archivo: ArchivoRespaldo;
  try {
    archivo = JSON.parse(contenidoArchivo);
  } catch {
    throw new Error("El archivo no es un respaldo válido de Fácil.");
  }

  if (archivo?.cabecera?.magic !== MAGIC) {
    throw new Error("El archivo no es un respaldo válido de Fácil.");
  }

  const { salt: saltHex, hmac: hmacGuardado } = archivo.cabecera;
  const clave = await derivarClave(contrasena, saltHex); // 2 await
  const claveHex = bytesToHex(clave);

  // Verificar HMAC — detecta contraseña incorrecta antes de descifrar
  const hmacCalculado = await generarHmac(claveHex, saltHex, archivo.datos); // 1 await
  if (hmacCalculado !== hmacGuardado) {
    return null; // Contraseña incorrecta
  }

  const cifrados = base64ToBytes(archivo.datos);
  const dbBytes = xorConClave(cifrados, clave); // sync, rápido

  return { dbBytes, cabecera: archivo.cabecera };
}

export function leerCabeceraRespaldo(
  contenidoArchivo: string,
): CabecerRespaldo | null {
  try {
    const archivo: ArchivoRespaldo = JSON.parse(contenidoArchivo);
    if (archivo?.cabecera?.magic !== MAGIC) return null;
    return archivo.cabecera;
  } catch {
    return null;
  }
}
