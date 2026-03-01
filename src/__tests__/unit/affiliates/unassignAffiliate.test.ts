import { describe, it, expect, vi, beforeEach } from "vitest"
import { UnassignAffiliateUseCase } from "@/modules/affiliates/application/unassignAffiliate"
import type { AffiliateRepository } from "@/modules/affiliates/domain/AffiliateRepository"
import type { Affiliate } from "@/modules/affiliates/domain/Affiliate"

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
    calle: null,
    altura: null,
    ...overrides,
  }
}

function makeRepo(overrides: Partial<AffiliateRepository> = {}): AffiliateRepository {
  return {
    findUnseenByUserId: vi.fn(),
    markAsSeen: vi.fn(),
    assignToUser: vi.fn(),
    findById: vi.fn().mockResolvedValue(null),
    findByDni: vi.fn(),
    findConfirmedToday: vi.fn().mockResolvedValue([]),
    findAllConfirmed: vi.fn().mockResolvedValue([]),
    countUnassigned: vi.fn().mockResolvedValue(0),
    assignNextBatch: vi.fn().mockResolvedValue(0),
    findUnassigned: vi.fn().mockResolvedValue([]),
    updateContactInfo: vi.fn(),
    unassignFromUser: vi.fn().mockResolvedValue(undefined),
    unmarkAsSeen: vi.fn(),
    findAll: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

describe("UnassignAffiliateUseCase", () => {
  let repo: AffiliateRepository
  let useCase: UnassignAffiliateUseCase

  beforeEach(() => {
    repo = makeRepo()
    useCase = new UnassignAffiliateUseCase(repo)
  })

  describe("Happy Path", () => {
    it("llama unassignFromUser cuando el afiliado existe y pertenece al usuario", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 1, assigned_user_id: "user-1" })
      vi.mocked(repo.findById).mockResolvedValue(affiliate)

      // Act
      await useCase.execute(1, "user-1")

      // Assert
      expect(repo.findById).toHaveBeenCalledWith(1)
      expect(repo.unassignFromUser).toHaveBeenCalledWith(1)
    })

    it("resuelve sin valor (void) en el happy path", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 1, assigned_user_id: "user-1" })
      vi.mocked(repo.findById).mockResolvedValue(affiliate)

      // Act & Assert
      await expect(useCase.execute(1, "user-1")).resolves.toBeUndefined()
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

    it("no llama unassignFromUser si el afiliado no existe", async () => {
      // Arrange
      vi.mocked(repo.findById).mockResolvedValue(null)

      // Act
      await useCase.execute(999, "user-1").catch(() => {})

      // Assert
      expect(repo.unassignFromUser).not.toHaveBeenCalled()
    })

    it("lanza error si el afiliado no pertenece al usuario", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 1, assigned_user_id: "user-otro" })
      vi.mocked(repo.findById).mockResolvedValue(affiliate)

      // Act & Assert
      await expect(useCase.execute(1, "user-1")).rejects.toThrow(
        "Not authorized to unassign this affiliate"
      )
    })

    it("no llama unassignFromUser si el afiliado pertenece a otro usuario", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 1, assigned_user_id: "user-otro" })
      vi.mocked(repo.findById).mockResolvedValue(affiliate)

      // Act
      await useCase.execute(1, "user-1").catch(() => {})

      // Assert
      expect(repo.unassignFromUser).not.toHaveBeenCalled()
    })

    it("lanza error de autorización cuando assigned_user_id es null", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 1, assigned_user_id: null })
      vi.mocked(repo.findById).mockResolvedValue(affiliate)

      // Act & Assert
      await expect(useCase.execute(1, "user-1")).rejects.toThrow(
        "Not authorized to unassign this affiliate"
      )
    })
  })
})
