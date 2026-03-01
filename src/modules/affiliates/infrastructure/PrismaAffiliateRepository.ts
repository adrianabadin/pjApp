import type { AffiliateRepository, AffiliateContactData } from "../domain/AffiliateRepository"
import type { Affiliate } from "../domain/Affiliate"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

const SELECT_COLS = Prisma.sql`
  a.id, a.distrito, a.codigo, a.apellido, a.nombres,
  a.genero, a.dni_tipo, a.dni_numero, a.fecha_nacimiento,
  a.is_seen, a.seen_at, a.assigned_user_id,
  COALESCE(a.telefono, p.telefono) AS telefono,
  COALESCE(a.mail, p.mail) AS mail,
  a.calle, a.altura
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

  async findAllConfirmed(): Promise<Affiliate[]> {
    return prisma.$queryRaw<Affiliate[]>(Prisma.sql`
      SELECT ${SELECT_COLS}
      FROM afiliados a
      LEFT JOIN padron_saladillo p ON a.dni_numero = p.documento
      WHERE a.is_seen = true
      ORDER BY a.seen_at DESC
    `)
  }

  async markAsSeen(affiliateId: number): Promise<Affiliate> {
    const rows = await prisma.$queryRaw<Affiliate[]>(Prisma.sql`
      UPDATE afiliados
      SET is_seen = true, seen_at = NOW()
      WHERE id = ${affiliateId}
      RETURNING id, distrito, codigo, apellido, nombres, genero, dni_tipo,
                dni_numero, fecha_nacimiento, is_seen, seen_at, assigned_user_id,
                telefono, mail, calle, altura
    `)
    return rows[0]
  }

  async assignToUser(affiliateIds: number[], userId: string): Promise<number> {
    const result = await prisma.$executeRaw(Prisma.sql`
      UPDATE afiliados
      SET assigned_user_id = ${userId}, is_seen = false, seen_at = NULL
      WHERE id = ANY(${affiliateIds}::int[])
    `)
    return result
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

  async findUnassigned(limit = 500): Promise<Affiliate[]> {
    return prisma.$queryRaw<Affiliate[]>(Prisma.sql`
      SELECT ${SELECT_COLS}
      FROM afiliados a
      LEFT JOIN padron_saladillo p ON a.dni_numero = p.documento
      WHERE a.assigned_user_id IS NULL
      ORDER BY a.apellido NULLS LAST
      LIMIT ${limit}
    `)
  }

  async updateContactInfo(id: number, data: AffiliateContactData): Promise<Affiliate> {
    const setClauses: Prisma.Sql[] = []

    if (data.telefono !== undefined)
      setClauses.push(Prisma.sql`telefono = ${data.telefono}`)
    if (data.mail !== undefined)
      setClauses.push(Prisma.sql`mail = ${data.mail}`)
    if (data.calle !== undefined)
      setClauses.push(Prisma.sql`calle = ${data.calle}`)
    if (data.altura !== undefined)
      setClauses.push(Prisma.sql`altura = ${data.altura}`)
    if (data.fecha_nacimiento !== undefined)
      setClauses.push(Prisma.sql`fecha_nacimiento = ${data.fecha_nacimiento}`)

    if (setClauses.length === 0) {
      const existing = await this.findById(id)
      return existing!
    }

    const rows = await prisma.$queryRaw<Affiliate[]>(Prisma.sql`
      UPDATE afiliados a
      SET ${Prisma.join(setClauses, ", ")}
      WHERE a.id = ${id}
      RETURNING a.id, a.distrito, a.codigo, a.apellido, a.nombres,
                a.genero, a.dni_tipo, a.dni_numero, a.fecha_nacimiento,
                a.is_seen, a.seen_at, a.assigned_user_id,
                a.telefono, a.mail, a.calle, a.altura
    `)
    return rows[0]
  }

  async unassignFromUser(id: number): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE afiliados
      SET assigned_user_id = NULL, is_seen = false, seen_at = NULL
      WHERE id = ${id}
    `)
  }

  async unmarkAsSeen(id: number): Promise<Affiliate> {
    const rows = await prisma.$queryRaw<Affiliate[]>(Prisma.sql`
      UPDATE afiliados a
      SET is_seen = false, seen_at = NULL
      WHERE a.id = ${id}
      RETURNING a.id, a.distrito, a.codigo, a.apellido, a.nombres,
                a.genero, a.dni_tipo, a.dni_numero, a.fecha_nacimiento,
                a.is_seen, a.seen_at, a.assigned_user_id,
                a.telefono, a.mail, a.calle, a.altura
    `)
    return rows[0]
  }

  async findAll(): Promise<Affiliate[]> {
    return prisma.$queryRaw<Affiliate[]>(Prisma.sql`
      SELECT ${SELECT_COLS}
      FROM afiliados a
      LEFT JOIN padron_saladillo p ON a.dni_numero = p.documento
      ORDER BY a.apellido NULLS LAST
    `)
  }
}
