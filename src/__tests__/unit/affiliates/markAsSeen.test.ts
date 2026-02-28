import { describe, it, expect, vi, beforeEach } from "vitest"
import { MarkAsSeenUseCase } from "@/modules/affiliates/application/markAsSeen"
import type { AffiliateRepository } from "@/modules/affiliates/domain/AffiliateRepository"
import type { Affiliate } from "@/modules/affiliates/domain/Affiliate"

// --- Fake factory ---
function makeAffiliate(overrides: Partial<Affiliate> = {}): Affiliate {
  return {
    id: 1,
    distrito: "Saladillo",
    codigo: 100,
    apellido: "Gomez",
    nombres: "Juan",
    genero: "M",
    dni_tipo: "DNI",
    dni_numero: "30000001",
    fecha_nacimiento: new Date("1990-01-01"),
    is_seen: false,
    seen_at: null,
    assigned_user_id: "user-1",
    telefono: null,
    mail: null,
    ...overrides,
  }
}

function makeRepo(overrides: Partial<AffiliateRepository> = {}): AffiliateRepository {
  return {
    findUnseenByUserId: vi.fn(),
    markAsSeen: vi.fn(),
    assignToUser: vi.fn(),
    findByDni: vi.fn(),
    findConfirmedToday: vi.fn().mockResolvedValue([]),
    findAllConfirmed: vi.fn().mockResolvedValue([]),
    countUnassigned: vi.fn().mockResolvedValue(0),
    assignNextBatch: vi.fn().mockResolvedValue(0),
    findById: vi.fn().mockResolvedValue(null),
    findUnassigned: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

describe("MarkAsSeenUseCase", () => {
  let repo: AffiliateRepository
  let useCase: MarkAsSeenUseCase

  beforeEach(() => {
    repo = makeRepo()
    useCase = new MarkAsSeenUseCase(repo)
  })

  describe("Happy Path", () => {
    it("llama markAsSeen en el repositorio cuando el afiliado existe, pertenece al usuario y no fue visto", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 1, assigned_user_id: "user-1", is_seen: false })
      const seenAffiliate = { ...affiliate, is_seen: true }
      vi.mocked(repo.findById).mockResolvedValue(affiliate)
      vi.mocked(repo.markAsSeen).mockResolvedValue(seenAffiliate)

      // Act
      const result = await useCase.execute(1, "user-1")

      // Assert
      expect(repo.findById).toHaveBeenCalledWith(1)
      expect(repo.markAsSeen).toHaveBeenCalledWith(1)
      expect(result.is_seen).toBe(true)
    })
  })

  describe("Failure Path", () => {
    it("lanza error si el afiliado no existe", async () => {
      // Arrange
      vi.mocked(repo.findById).mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(999, "user-1")).rejects.toThrow(
        "Affiliate 999 not found"
      )
    })

    it("no llama markAsSeen si el afiliado no existe", async () => {
      // Arrange
      vi.mocked(repo.findById).mockResolvedValue(null)

      // Act
      await useCase.execute(999, "user-1").catch(() => {})

      // Assert
      expect(repo.markAsSeen).not.toHaveBeenCalled()
    })

    it("lanza error si el afiliado no pertenece al usuario", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 1, assigned_user_id: "user-otro" })
      vi.mocked(repo.findById).mockResolvedValue(affiliate)

      // Act & Assert
      await expect(useCase.execute(1, "user-1")).rejects.toThrow(
        "Not authorized to mark this affiliate as seen"
      )
    })

    it("no llama markAsSeen si el afiliado pertenece a otro usuario", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 1, assigned_user_id: "user-otro" })
      vi.mocked(repo.findById).mockResolvedValue(affiliate)

      // Act
      await useCase.execute(1, "user-1").catch(() => {})

      // Assert
      expect(repo.markAsSeen).not.toHaveBeenCalled()
    })

    it("propaga excepciones del repositorio al buscar por id", async () => {
      // Arrange
      vi.mocked(repo.findById).mockRejectedValue(new Error("DB error"))

      // Act & Assert
      await expect(useCase.execute(1, "user-1")).rejects.toThrow("DB error")
    })
  })

  describe("Edge Cases - Idempotencia", () => {
    it("retorna el afiliado sin llamar markAsSeen si ya está marcado como visto (idempotente)", async () => {
      // Arrange
      const alreadySeen = makeAffiliate({
        id: 1,
        assigned_user_id: "user-1",
        is_seen: true,
      })
      vi.mocked(repo.findById).mockResolvedValue(alreadySeen)

      // Act
      const result = await useCase.execute(1, "user-1")

      // Assert
      expect(repo.markAsSeen).not.toHaveBeenCalled()
      expect(result).toEqual(alreadySeen)
      expect(result.is_seen).toBe(true)
    })

    it("afiliado con assigned_user_id null no pertenece a ningún usuario", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 1, assigned_user_id: null })
      vi.mocked(repo.findById).mockResolvedValue(affiliate)

      // Act & Assert
      await expect(useCase.execute(1, "user-1")).rejects.toThrow(
        "Not authorized to mark this affiliate as seen"
      )
    })
  })
})
