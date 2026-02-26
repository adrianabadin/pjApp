import type { AffiliateRepository } from "../domain/AffiliateRepository"
import type { Affiliate } from "../domain/Affiliate"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

const SELECT_COLS = Prisma.sql`
  a.id, a.distrito, a.codigo, a.apellido, a.nombres,
  a.genero, a.dni_tipo, a.dni_numero, a.fecha_nacimiento,
  a.is_seen, a.seen_at, a.assigned_user_id,
  p.telefono, p.mail
`

export class PrismaAffiliateRepository implements AffiliateRepository {
  async findUnseenByUserId(userId: string): Promise<Affiliate[]> {
    return prisma.$queryRaw<Affiliate[]>(Prisma.sql`
      SELECT ${SELECT_COLS}
      FROM afiliados a
      LEFT JOIN padron_saladillo p ON a.dni_numero = p.documento
      WHERE a.assigned_user_id = ${userId}
        AND a.is_seen = false
      ORDER BY a.apellido NULLS LAST
    `)
  }

  async findConfirmedToday(): Promise<Affiliate[]> {
    return prisma.$queryRaw<Affiliate[]>(Prisma.sql`
      SELECT ${SELECT_COLS}
      FROM afiliados a
      LEFT JOIN padron_saladillo p ON a.dni_numero = p.documento
      WHERE a.is_seen = true
        AND a.seen_at::date = CURRENT_DATE
      ORDER BY a.seen_at DESC
    `)
  }

  async markAsSeen(affiliateId: number): Promise<Affiliate> {
    const updated = await prisma.afiliado.update({
      where: { id: affiliateId },
      data: { is_seen: true, seen_at: new Date() },
    })
    return { ...updated, telefono: null, mail: null }
  }

  async assignToUser(affiliateIds: number[], userId: string): Promise<number> {
    const result = await prisma.afiliado.updateMany({
      where: { id: { in: affiliateIds } },
      data: { assigned_user_id: userId, is_seen: false, seen_at: null },
    })
    return result.count
  }

  async findById(id: number): Promise<Affiliate | null> {
    const rows = await prisma.$queryRaw<Affiliate[]>(Prisma.sql`
      SELECT ${SELECT_COLS}
      FROM afiliados a
      LEFT JOIN padron_saladillo p ON a.dni_numero = p.documento
      WHERE a.id = ${id}
    `)
    return rows[0] ?? null
  }

  async findByDni(dni: string): Promise<Affiliate | null> {
    const rows = await prisma.$queryRaw<Affiliate[]>(Prisma.sql`
      SELECT ${SELECT_COLS}
      FROM afiliados a
      LEFT JOIN padron_saladillo p ON a.dni_numero = p.documento
      WHERE a.dni_numero = ${dni}
      LIMIT 1
    `)
    return rows[0] ?? null
  }

  async countUnassigned(): Promise<number> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
      SELECT COUNT(*) as count FROM afiliados WHERE assigned_user_id IS NULL
    `)
    return Number(result[0].count)
  }

  async assignNextBatch(count: number, userId: string): Promise<number> {
    // Assigns the next `count` unassigned affiliates to the user
    const result = await prisma.$executeRaw(Prisma.sql`
      UPDATE afiliados
      SET assigned_user_id = ${userId}, is_seen = false, seen_at = NULL
      WHERE id IN (
        SELECT id FROM afiliados
        WHERE assigned_user_id IS NULL
        ORDER BY id
        LIMIT ${count}
      )
    `)
    return result
  }
}
