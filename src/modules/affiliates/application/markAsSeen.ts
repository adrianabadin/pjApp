import type { AffiliateRepository } from "../domain/AffiliateRepository"
import type { Affiliate } from "../domain/Affiliate"

export class MarkAsSeenUseCase {
  constructor(private readonly repo: AffiliateRepository) {}

  async execute(affiliateId: number, userId: string): Promise<Affiliate> {
    const affiliate = await this.repo.findById(affiliateId)
    if (!affiliate) throw new Error(`Affiliate ${affiliateId} not found`)
    if (affiliate.assigned_user_id !== userId) {
      throw new Error("Not authorized to mark this affiliate as seen")
    }
    if (affiliate.is_seen) return affiliate  // idempotent
    return this.repo.markAsSeen(affiliateId)
  }
}
