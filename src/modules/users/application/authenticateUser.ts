import type { UserRepository } from "../domain/UserRepository"
import type { User } from "../domain/User"
import bcrypt from "bcryptjs"

export class AuthenticateUserUseCase {
  constructor(private readonly repo: UserRepository) {}

  async execute(email: string, password: string): Promise<User> {
    const user = await this.repo.findByEmail(email)
    if (!user) throw new Error("Invalid credentials")
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) throw new Error("Invalid credentials")
    return user
  }
}
