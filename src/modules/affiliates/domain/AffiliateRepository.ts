import type { Affiliate } from "./Affiliate"

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
}
