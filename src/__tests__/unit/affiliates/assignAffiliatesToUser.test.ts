import { describe, it, expect, vi, beforeEach } from "vitest"
import { AssignAffiliatesToUserUseCase } from "@/modules/affiliates/application/assignAffiliatesToUser"
import type { AffiliateRepository } from "@/modules/affiliates/domain/AffiliateRepository"

function makeRepo(overrides: Partial<AffiliateRepository> = {}): AffiliateRepository {
  return {
    findUnseenByUserId: vi.fn(),
    markAsSeen: vi.fn(),
    assignToUser: vi.fn().mockResolvedValue(0),
    findById: vi.fn(),
    findByDni: vi.fn(),
    findConfirmedToday: vi.fn().mockResolvedValue([]),
    findAllConfirmed: vi.fn().mockResolvedValue([]),
    countUnassigned: vi.fn().mockResolvedValue(0),
    assignNextBatch: vi.fn().mockResolvedValue(0),
    findUnassigned: vi.fn().mockResolvedValue([]),
    updateContactInfo: vi.fn(),
    unassignFromUser: vi.fn(),
    unmarkAsSeen: vi.fn(),
    findAll: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

describe("AssignAffiliatesToUserUseCase", () => {
  let repo: AffiliateRepository
  let useCase: AssignAffiliatesToUserUseCase

  beforeEach(() => {
    repo = makeRepo()
    useCase = new AssignAffiliatesToUserUseCase(repo)
  })

  describe("Happy Path", () => {
    it("delega al repositorio con los ids y userId correctos", async () => {
      // Arrange
      vi.mocked(repo.assignToUser).mockResolvedValue(3)

      // Act
      const result = await useCase.execute([1, 2, 3], "user-1")

      // Assert
      expect(repo.assignToUser).toHaveBeenCalledOnce()
      expect(repo.assignToUser).toHaveBeenCalledWith([1, 2, 3], "user-1")
      expect(result).toBe(3)
    })

    it("retorna el número de afiliados asignados correctamente", async () => {
      // Arrange
      vi.mocked(repo.assignToUser).mockResolvedValue(5)

      // Act
      const result = await useCase.execute([10, 20, 30, 40, 50], "user-2")

      // Assert
      expect(result).toBe(5)
    })

    it("funciona con un único afiliado", async () => {
      // Arrange
      vi.mocked(repo.assignToUser).mockResolvedValue(1)

      // Act
      const result = await useCase.execute([42], "user-1")

      // Assert
      expect(repo.assignToUser).toHaveBeenCalledWith([42], "user-1")
      expect(result).toBe(1)
    })
  })

  describe("Failure Path", () => {
    it("lanza error si userId es string vacío y hay ids", async () => {
      // Arrange & Act & Assert
      await expect(useCase.execute([1, 2], "")).rejects.toThrow("userId is required")
    })

    it("no llama al repositorio si userId es string vacío", async () => {
      // Arrange & Act
      await useCase.execute([1, 2], "").catch(() => {})

      // Assert
      expect(repo.assignToUser).not.toHaveBeenCalled()
    })

    it("propaga excepciones del repositorio", async () => {
      // Arrange
      vi.mocked(repo.assignToUser).mockRejectedValue(new Error("Constraint violation"))

      // Act & Assert
      await expect(useCase.execute([1], "user-1")).rejects.toThrow(
        "Constraint violation"
      )
    })
  })

  describe("Edge Cases", () => {
    it("retorna 0 sin llamar al repositorio si el array de ids está vacío", async () => {
      // Arrange & Act
      const result = await useCase.execute([], "user-1")

      // Assert
      expect(result).toBe(0)
      expect(repo.assignToUser).not.toHaveBeenCalled()
    })

    it("retorna 0 para array vacío incluso con userId vacío (array vacío tiene prioridad)", async () => {
      // Arrange & Act
      const result = await useCase.execute([], "")

      // Assert
      expect(result).toBe(0)
      expect(repo.assignToUser).not.toHaveBeenCalled()
    })

    it("maneja ids duplicados correctamente (delega sin filtrar)", async () => {
      // Arrange
      vi.mocked(repo.assignToUser).mockResolvedValue(3)

      // Act
      const result = await useCase.execute([1, 1, 1], "user-1")

      // Assert
      expect(repo.assignToUser).toHaveBeenCalledWith([1, 1, 1], "user-1")
      expect(result).toBe(3)
    })
  })
})
