import type { AffiliateRepository, AffiliateContactData } from "../domain/AffiliateRepository"
import type { Affiliate } from "../domain/Affiliate"

export class UpdateAffiliateContactUseCase {
  constructor(private readonly repo: AffiliateRepository) {}

  async execute(affiliateId: number, userId: string, data: AffiliateContactData): Promise<Affiliate> {
    const affiliate = await this.repo.findById(affiliateId)
    if (!affiliate) throw new Error(`Affiliate ${affiliateId} not found`)
    if (affiliate.assigned_user_id !== userId)
      throw new Error("Not authorized to edit this affiliate")
    return this.repo.updateContactInfo(affiliateId, data)
  }
}
