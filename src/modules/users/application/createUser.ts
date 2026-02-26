import type { UserRepository } from "../domain/UserRepository"
import type { User } from "../domain/User"
import bcrypt from "bcryptjs"

export class CreateUserUseCase {
  constructor(private readonly repo: UserRepository) {}

  async execute(data: { email: string; password: string; name?: string }): Promise<User> {
    const existing = await this.repo.findByEmail(data.email)
    if (existing) throw new Error("Email already registered")
    const password_hash = await bcrypt.hash(data.password, 12)
    return this.repo.create({ email: data.email, password_hash, name: data.name })
  }
}
