import { Cliente } from "../../domain/entities/Cliente";
import { ClienteRepository } from "../../domain/repositories/ClienteRepository";
import db from "../database/database";

export class ClienteRepositoryImpl implements ClienteRepository {
  async getAll(): Promise<Cliente[]> {
    return db.getAllSync<Cliente>(
      "SELECT * FROM clientes ORDER BY rowid DESC;",
    );
  }

  async create(data: Omit<Cliente, "id">): Promise<Cliente> {
    const id = String(Date.now());
    db.runSync(
      `INSERT INTO clientes (id, nombre, telefono, direccion)
       VALUES (?, ?, ?, ?);`,
      [id, data.nombre, data.telefono, data.direccion ?? null],
    );
    return { id, ...data };
  }

  async update(cliente: Cliente): Promise<void> {
    db.runSync(
      `UPDATE clientes
       SET nombre = ?, telefono = ?, direccion = ?
       WHERE id = ?;`,
      [cliente.nombre, cliente.telefono, cliente.direccion ?? null, cliente.id],
    );
  }

  async delete(id: string): Promise<void> {
    db.runSync("DELETE FROM clientes WHERE id = ?;", [id]);
  }
}
