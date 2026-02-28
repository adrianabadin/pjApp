import type { Affiliate } from "./Affiliate"

export interface AffiliateContactData {
  telefono?: string | null
  mail?: string | null
  calle?: string | null
  altura?: string | null
  fecha_nacimiento?: Date | null
}

export interface AffiliateRepository {
  findUnseenByUserId(userId: string): Promise<Affiliate[]>
  findConfirmedToday(): Promise<Affiliate[]>
  findAllConfirmed(): Promise<Affiliate[]>
  markAsSeen(affiliateId: number): Promise<Affiliate>
  assignToUser(affiliateIds: number[], userId: string): Promise<number>
  findById(id: number): Promise<Affiliate | null>
  findByDni(dni: string): Promise<Affiliate | null>
  countUnassigned(): Promise<number>
  assignNextBatch(count: number, userId: string): Promise<number>
  findUnassigned(limit?: number): Promise<Affiliate[]>
  updateContactInfo(id: number, data: AffiliateContactData): Promise<Affiliate>
  unassignFromUser(id: number): Promise<void>
}
