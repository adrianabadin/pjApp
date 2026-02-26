import type { AffiliateRepository } from "../domain/AffiliateRepository"
import type { Affiliate } from "../domain/Affiliate"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

export class PrismaAffiliateRepository implements AffiliateRepository {
  async findUnseenByUserId(userId: string): Promise<Affiliate[]> {
    const rows = await prisma.$queryRaw<Affiliate[]>(Prisma.sql`
      SELECT
        a.id,
        a.distrito,
        a.codigo,
        a.apellido,
        a.nombres,
        a.genero,
        a.dni_tipo,
        a.dni_numero,
        a.fecha_nacimiento,
        a.is_seen,
        a.assigned_user_id,
        p.telefono,
        p.mail
      FROM afiliados a
      LEFT JOIN padron_saladillo p ON a.dni_numero = p.documento
      WHERE a.assigned_user_id = ${userId}
        AND a.is_seen = false
      ORDER BY a.apellido NULLS LAST
    `)
    return rows
  }

  async markAsSeen(affiliateId: number): Promise<Affiliate> {
    const updated = await prisma.afiliado.update({
      where: { id: affiliateId },
      data: { is_seen: true },
    })
    return {
      ...updated,
      telefono: null,
      mail: null,
    }
  }

  async assignToUser(affiliateIds: number[], userId: string): Promise<number> {
    const result = await prisma.afiliado.updateMany({
      where: { id: { in: affiliateIds } },
      data: { assigned_user_id: userId, is_seen: false },
    })
    return result.count
  }

  async findById(id: number): Promise<Affiliate | null> {
    const rows = await prisma.$queryRaw<Affiliate[]>(Prisma.sql`
      SELECT
        a.id, a.distrito, a.codigo, a.apellido, a.nombres,
        a.genero, a.dni_tipo, a.dni_numero, a.fecha_nacimiento,
        a.is_seen, a.assigned_user_id,
        p.telefono, p.mail
      FROM afiliados a
      LEFT JOIN padron_saladillo p ON a.dni_numero = p.documento
      WHERE a.id = ${id}
    `)
    return rows[0] ?? null
  }
}
