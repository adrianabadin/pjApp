import crypto from "crypto"
import type { InvitationRepository } from "../domain/InvitationRepository"
import type { Invitation } from "../domain/Invitation"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

export class PrismaInvitationRepository implements InvitationRepository {
  async create(data: {
    email: string
    token: string
    invitedById: string
    expiresAt: Date
  }): Promise<Invitation> {
    const id = crypto.randomUUID()
    const rows = await prisma.$queryRaw<Invitation[]>(Prisma.sql`
      INSERT INTO invitations (id, email, token, invited_by_id, expires_at, created_at)
      VALUES (${id}, ${data.email}, ${data.token}, ${data.invitedById}, ${data.expiresAt}, NOW())
      RETURNING id, email, token, invited_by_id, expires_at, accepted_at, created_at
    `)
    return rows[0]
  }

  async findByToken(token: string): Promise<Invitation | null> {
    const rows = await prisma.$queryRaw<Invitation[]>(Prisma.sql`
      SELECT id, email, token, invited_by_id, expires_at, accepted_at, created_at
      FROM invitations WHERE token = ${token} LIMIT 1
    `)
    return rows[0] ?? null
  }

  async markAccepted(id: string): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE invitations SET accepted_at = NOW() WHERE id = ${id}
    `)
  }

  async findAllByInviter(userId: string): Promise<Invitation[]> {
    return prisma.$queryRaw<Invitation[]>(Prisma.sql`
      SELECT id, email, token, invited_by_id, expires_at, accepted_at, created_at
      FROM invitations WHERE invited_by_id = ${userId}
      ORDER BY created_at DESC
    `)
  }
}
