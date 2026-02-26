import type { UserRepository } from "../domain/UserRepository"
import type { User } from "../domain/User"
import { prisma } from "@/lib/prisma"

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
}
