import type { AffiliateRepository } from "../domain/AffiliateRepository"

export class AssignAffiliatesToUserUseCase {
  constructor(private readonly repo: AffiliateRepository) {}

  async execute(affiliateIds: number[], userId: string): Promise<number> {
    if (!affiliateIds.length) return 0
    if (!userId) throw new Error("userId is required")
    return this.repo.assignToUser(affiliateIds, userId)
  }
}
