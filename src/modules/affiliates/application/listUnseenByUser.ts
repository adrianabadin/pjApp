import type { AffiliateRepository } from "../domain/AffiliateRepository"
import type { Affiliate } from "../domain/Affiliate"

export class ListUnseenByUserUseCase {
  constructor(private readonly repo: AffiliateRepository) {}

  async execute(userId: string): Promise<Affiliate[]> {
    if (!userId) throw new Error("userId is required")
    return this.repo.findUnseenByUserId(userId)
  }
}
