import type { UserRepository } from "../domain/UserRepository"
import type { User } from "../domain/User"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  }

  async create(data: { email: string; password_hash: string; name?: string }): Promise<User> {
    return prisma.user.create({ data })
  }

  async saveResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE users SET reset_token = ${token}, reset_token_expires_at = ${expiresAt}
      WHERE id = ${userId}
    `)
  }

  async findByResetToken(token: string): Promise<User | null> {
    const rows = await prisma.$queryRaw<User[]>(Prisma.sql`
      SELECT id, email, password_hash, name, role, created_at,
             reset_token, reset_token_expires_at
      FROM users WHERE reset_token = ${token} LIMIT 1
    `)
    return rows[0] ?? null
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE users
      SET password_hash = ${passwordHash},
          reset_token = NULL,
          reset_token_expires_at = NULL
      WHERE id = ${userId}
    `)
  }
}
