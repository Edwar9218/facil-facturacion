import { ConfiguracionRepository } from "../../domain/repositories/ConfiguracionRepository";
import db from "../database/database";

export class ConfiguracionRepositoryImpl implements ConfiguracionRepository {
  // Obtener el valor de una clave. Retorna null si no existe.
  async get(clave: string): Promise<string | null> {
    const row = db.getFirstSync<{ valor: string }>(
      `SELECT valor FROM configuracion WHERE clave = ?;`,
      [clave],
    );
    return row ? row.valor : null;
  }

  // Guardar o actualizar el valor de una clave.
  // INSERT OR REPLACE reemplaza si ya existe, inserta si no.
  async set(clave: string, valor: string): Promise<void> {
    db.runSync(
      `INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?, ?);`,
      [clave, valor],
    );
  }
}
