import { Cliente } from "../entities/Cliente";

export interface ClienteRepository {
  getAll(): Promise<Cliente[]>;
  create(cliente: Omit<Cliente, "id">): Promise<Cliente>;
  update(cliente: Cliente): Promise<void>;
  delete(id: string): Promise<void>;
}
