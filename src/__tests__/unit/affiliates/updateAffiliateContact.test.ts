import { describe, it, expect, vi, beforeEach } from "vitest"
import { UpdateAffiliateContactUseCase } from "@/modules/affiliates/application/updateAffiliateContact"
import type { AffiliateRepository, AffiliateContactData } from "@/modules/affiliates/domain/AffiliateRepository"
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
    unassignFromUser: vi.fn(),
    ...overrides,
  }
}

describe("UpdateAffiliateContactUseCase", () => {
  let repo: AffiliateRepository
  let useCase: UpdateAffiliateContactUseCase

  beforeEach(() => {
    repo = makeRepo()
    useCase = new UpdateAffiliateContactUseCase(repo)
  })

  describe("Happy Path", () => {
    it("llama updateContactInfo cuando el afiliado existe y pertenece al usuario", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 1, assigned_user_id: "user-1" })
      const updated = { ...affiliate, telefono: "2983123456" }
      const data: AffiliateContactData = { telefono: "2983123456" }
      vi.mocked(repo.findById).mockResolvedValue(affiliate)
      vi.mocked(repo.updateContactInfo).mockResolvedValue(updated)

      // Act
      const result = await useCase.execute(1, "user-1", data)

      // Assert
      expect(repo.findById).toHaveBeenCalledWith(1)
      expect(repo.updateContactInfo).toHaveBeenCalledWith(1, data)
      expect(result.telefono).toBe("2983123456")
    })

    it("con datos parciales (solo telefono) delega correctamente", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 2, assigned_user_id: "user-1" })
      const data: AffiliateContactData = { telefono: "2983000001" }
      vi.mocked(repo.findById).mockResolvedValue(affiliate)
      vi.mocked(repo.updateContactInfo).mockResolvedValue({ ...affiliate, telefono: "2983000001" })

      // Act
      await useCase.execute(2, "user-1", data)

      // Assert
      expect(repo.updateContactInfo).toHaveBeenCalledWith(2, data)
    })

    it("pasa todos los campos cuando se proveen", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 1, assigned_user_id: "user-1" })
      const data: AffiliateContactData = {
        telefono: "2983123456",
        mail: "juan@example.com",
        calle: "San Martín",
        altura: "123",
        fecha_nacimiento: new Date("1985-06-15"),
      }
      vi.mocked(repo.findById).mockResolvedValue(affiliate)
      vi.mocked(repo.updateContactInfo).mockResolvedValue({ ...affiliate, ...data })

      // Act
      await useCase.execute(1, "user-1", data)

      // Assert
      expect(repo.updateContactInfo).toHaveBeenCalledWith(1, data)
    })
  })

  describe("Failure Path", () => {
    it("lanza error si el afiliado no existe", async () => {
      // Arrange
      vi.mocked(repo.findById).mockResolvedValue(null)

      // Act & Assert
      await expect(useCase.execute(999, "user-1", {})).rejects.toThrow(
        "Affiliate 999 not found"
      )
    })

    it("no llama updateContactInfo si el afiliado no existe", async () => {
      // Arrange
      vi.mocked(repo.findById).mockResolvedValue(null)

      // Act
      await useCase.execute(999, "user-1", {}).catch(() => {})

      // Assert
      expect(repo.updateContactInfo).not.toHaveBeenCalled()
    })

    it("lanza error si el afiliado no pertenece al usuario", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 1, assigned_user_id: "user-otro" })
      vi.mocked(repo.findById).mockResolvedValue(affiliate)

      // Act & Assert
      await expect(useCase.execute(1, "user-1", {})).rejects.toThrow(
        "Not authorized to edit this affiliate"
      )
    })

    it("no llama updateContactInfo si el afiliado pertenece a otro usuario", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 1, assigned_user_id: "user-otro" })
      vi.mocked(repo.findById).mockResolvedValue(affiliate)

      // Act
      await useCase.execute(1, "user-1", {}).catch(() => {})

      // Assert
      expect(repo.updateContactInfo).not.toHaveBeenCalled()
    })

    it("lanza error de autorización cuando assigned_user_id es null", async () => {
      // Arrange
      const affiliate = makeAffiliate({ id: 1, assigned_user_id: null })
      vi.mocked(repo.findById).mockResolvedValue(affiliate)

      // Act & Assert
      await expect(useCase.execute(1, "user-1", {})).rejects.toThrow(
        "Not authorized to edit this affiliate"
      )
    })
  })
})
