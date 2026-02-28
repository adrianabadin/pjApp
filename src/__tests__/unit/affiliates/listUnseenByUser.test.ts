import { describe, it, expect, vi, beforeEach } from "vitest"
import { ListUnseenByUserUseCase } from "@/modules/affiliates/application/listUnseenByUser"
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
    findUnseenByUserId: vi.fn().mockResolvedValue([]),
    markAsSeen: vi.fn(),
    assignToUser: vi.fn(),
    findById: vi.fn(),
    findByDni: vi.fn(),
    findConfirmedToday: vi.fn().mockResolvedValue([]),
    findAllConfirmed: vi.fn().mockResolvedValue([]),
    countUnassigned: vi.fn().mockResolvedValue(0),
    assignNextBatch: vi.fn().mockResolvedValue(0),
    findUnassigned: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

describe("ListUnseenByUserUseCase", () => {
  let repo: AffiliateRepository
  let useCase: ListUnseenByUserUseCase

  beforeEach(() => {
    repo = makeRepo()
    useCase = new ListUnseenByUserUseCase(repo)
  })

  describe("Happy Path", () => {
    it("delega al repositorio con el userId correcto y retorna los afiliados", async () => {
      // Arrange
      const affiliates = [makeAffiliate({ id: 1 }), makeAffiliate({ id: 2 })]
      vi.mocked(repo.findUnseenByUserId).mockResolvedValue(affiliates)

      // Act
      const result = await useCase.execute("user-1")

      // Assert
      expect(repo.findUnseenByUserId).toHaveBeenCalledOnce()
      expect(repo.findUnseenByUserId).toHaveBeenCalledWith("user-1")
      expect(result).toEqual(affiliates)
    })

    it("retorna array vacío si el repositorio no encuentra afiliados no vistos", async () => {
      // Arrange
      vi.mocked(repo.findUnseenByUserId).mockResolvedValue([])

      // Act
      const result = await useCase.execute("user-sin-afiliados")

      // Assert
      expect(result).toEqual([])
    })
  })

  describe("Failure Path", () => {
    it("lanza error si userId es string vacío", async () => {
      // Arrange & Act & Assert
      await expect(useCase.execute("")).rejects.toThrow("userId is required")
    })

    it("no llama al repositorio si userId es string vacío", async () => {
      // Arrange & Act
      await useCase.execute("").catch(() => {})

      // Assert
      expect(repo.findUnseenByUserId).not.toHaveBeenCalled()
    })

    it("propaga excepciones del repositorio", async () => {
      // Arrange
      vi.mocked(repo.findUnseenByUserId).mockRejectedValue(
        new Error("DB connection failed")
      )

      // Act & Assert
      await expect(useCase.execute("user-1")).rejects.toThrow("DB connection failed")
    })
  })

  describe("Edge Cases", () => {
    it("retorna múltiples afiliados correctamente ordenados", async () => {
      // Arrange
      const affiliates = [
        makeAffiliate({ id: 10, apellido: "Zarate" }),
        makeAffiliate({ id: 5, apellido: "Alvarez" }),
        makeAffiliate({ id: 20, apellido: "Mendoza" }),
      ]
      vi.mocked(repo.findUnseenByUserId).mockResolvedValue(affiliates)

      // Act
      const result = await useCase.execute("user-1")

      // Assert
      expect(result).toHaveLength(3)
      expect(result[0].apellido).toBe("Zarate")
      expect(result[1].apellido).toBe("Alvarez")
    })
  })
})
