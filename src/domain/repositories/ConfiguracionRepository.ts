export interface ConfiguracionRepository {
  // Obtener el valor de una clave. Retorna null si no existe.
  get(clave: string): Promise<string | null>;

  // Guardar o actualizar el valor de una clave.
  set(clave: string, valor: string): Promise<void>;
}
