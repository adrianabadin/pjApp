import type { User } from "./User"

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  create(data: { email: string; password_hash: string; name?: string }): Promise<User>
  saveResetToken(userId: string, token: string, expiresAt: Date): Promise<void>
  findByResetToken(token: string): Promise<User | null>
  updatePassword(userId: string, passwordHash: string): Promise<void>
  findAll(): Promise<User[]>
  updateRole(userId: string, role: string): Promise<void>
}
