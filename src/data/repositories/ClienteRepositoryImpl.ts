import { Cliente } from "../../domain/entities/Cliente";
import { ClienteRepository } from "../../domain/repositories/ClienteRepository";
import db from "../database/database";

export class ClienteRepositoryImpl implements ClienteRepository {
  // Solo trae los activos
  async getAll(): Promise<Cliente[]> {
    return db.getAllSync<Cliente>(
      "SELECT * FROM clientes WHERE activo = 1 ORDER BY rowid DESC;",
    );
  }

  // Trae los archivados (para la pantalla de recuperar)
  async getArchivados(): Promise<Cliente[]> {
    return db.getAllSync<Cliente>(
      "SELECT * FROM clientes WHERE activo = 0 ORDER BY rowid DESC;",
    );
  }

  async create(data: Omit<Cliente, "id">): Promise<Cliente> {
    const id = String(Date.now());
    db.runSync(
      `INSERT INTO clientes (id, nombre, telefono, direccion, activo)
       VALUES (?, ?, ?, ?, 1);`,
      [id, data.nombre, data.telefono, data.direccion ?? null],
    );
    return { id, ...data };
  }

  async update(cliente: Cliente): Promise<void> {
    db.runSync(
      `UPDATE clientes SET nombre = ?, telefono = ?, direccion = ? WHERE id = ?;`,
      [cliente.nombre, cliente.telefono, cliente.direccion ?? null, cliente.id],
    );
  }

  // DELETE activa el trigger: si tiene ventas → activo=0, si no → borra real
  async delete(id: string): Promise<void> {
    db.runSync("DELETE FROM clientes WHERE id = ?;", [id]);
  }

  // Recuperar un cliente archivado
  async reactivar(id: string): Promise<void> {
    db.runSync("UPDATE clientes SET activo = 1 WHERE id = ?;", [id]);
  }
}
