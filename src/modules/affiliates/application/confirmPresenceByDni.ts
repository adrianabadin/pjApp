import type { AffiliateRepository } from "../domain/AffiliateRepository"
import type { Affiliate } from "../domain/Affiliate"

export class ConfirmPresenceByDniUseCase {
  constructor(private readonly repo: AffiliateRepository) {}

  async execute(dni: string): Promise<Affiliate> {
    if (!dni?.trim()) throw new Error("DNI es requerido")
    const affiliate = await this.repo.findByDni(dni.trim())
    if (!affiliate) throw new Error("Afiliado no encontrado con ese DNI")
    if (affiliate.is_seen) return affiliate // idempotente
    return this.repo.markAsSeen(affiliate.id)
  }
}
