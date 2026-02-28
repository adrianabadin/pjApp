import type { AffiliateRepository } from "../domain/AffiliateRepository"

export class UnassignAffiliateUseCase {
  constructor(private readonly repo: AffiliateRepository) {}

  async execute(affiliateId: number, userId: string): Promise<void> {
    const affiliate = await this.repo.findById(affiliateId)
    if (!affiliate) throw new Error(`Affiliate ${affiliateId} not found`)
    if (affiliate.assigned_user_id !== userId)
      throw new Error("Not authorized to unassign this affiliate")
    await this.repo.unassignFromUser(affiliateId)
  }
}
