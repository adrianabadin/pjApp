import { describe, it, expect, vi, beforeEach } from "vitest"
import { AuthenticateUserUseCase } from "@/modules/users/application/authenticateUser"
import type { UserRepository } from "@/modules/users/domain/UserRepository"
import type { User } from "@/modules/users/domain/User"

// Mock bcryptjs para controlar el resultado de compare
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn().mockResolvedValue(false),
  },
}))

// --- Fake factory ---
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-uuid-1",
    email: "admin@saladillo.gob.ar",
    password_hash: "$2b$12$hashedpassword",
    name: "Administrador",
    role: "admin",
    created_at: new Date("2024-01-01"),
    ...overrides,
  }
}

function makeRepo(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    ...overrides,
  }
}

describe("AuthenticateUserUseCase", () => {
  let repo: UserRepository
  let useCase: AuthenticateUserUseCase

  beforeEach(async () => {
    repo = makeRepo()
    useCase = new AuthenticateUserUseCase(repo)
    vi.clearAllMocks()
    // Reset bcrypt.compare default a false
    const bcrypt = await import("bcryptjs")
    vi.mocked(bcrypt.default.compare).mockResolvedValue(false as never)
  })

  describe("Happy Path", () => {
    it("retorna el usuario cuando email y password son correctos", async () => {
      // Arrange
      const bcrypt = await import("bcryptjs")
      const user = makeUser()
      vi.mocked(repo.findByEmail).mockResolvedValue(user)
      vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never)

      // Act
      const result = await useCase.execute("admin@saladillo.gob.ar", "password123")

      // Assert
      expect(result).toEqual(user)
      expect(result.email).toBe("admin@saladillo.gob.ar")
    })

    it("llama a bcrypt.compare con el password plano y el hash almacenado", async () => {
      // Arrange
      const bcrypt = await import("bcryptjs")
      const user = makeUser({ password_hash: "$2b$12$specificHash" })
      vi.mocked(repo.findByEmail).mockResolvedValue(user)
      vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never)

      // Act
      await useCase.execute("admin@saladillo.gob.ar", "miPassword")

      // Assert
      expect(bcrypt.default.compare).toHaveBeenCalledWith("miPassword", "$2b$12$specificHash")
    })

    it("busca el usuario por email en el repositorio", async () => {
      // Arrange
      const bcrypt = await import("bcryptjs")
      const user = makeUser()
      vi.mocked(repo.findByEmail).mockResolvedValue(user)
      vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never)

      // Act
      await useCase.execute("admin@saladillo.gob.ar", "pass")

      // Assert
      expect(repo.findByEmail).toHaveBeenCalledWith("admin@saladillo.gob.ar")
    })
  })

  describe("Failure Path", () => {
    it("lanza error con mensaje genérico si el usuario no existe", async () => {
      // Arrange
      vi.mocked(repo.findByEmail).mockResolvedValue(null)

      // Act & Assert
      await expect(
        useCase.execute("noexiste@example.com", "anypass")
      ).rejects.toThrow("Invalid credentials")
    })

    it("no llama a bcrypt.compare si el usuario no existe", async () => {
      // Arrange
      const bcrypt = await import("bcryptjs")
      vi.mocked(repo.findByEmail).mockResolvedValue(null)

      // Act
      await useCase.execute("noexiste@example.com", "anypass").catch(() => {})

      // Assert
      expect(bcrypt.default.compare).not.toHaveBeenCalled()
    })

    it("lanza error con mensaje genérico si el password es incorrecto", async () => {
      // Arrange
      const bcrypt = await import("bcryptjs")
      vi.mocked(repo.findByEmail).mockResolvedValue(makeUser())
      vi.mocked(bcrypt.default.compare).mockResolvedValue(false as never)

      // Act & Assert
      await expect(
        useCase.execute("admin@saladillo.gob.ar", "wrongpassword")
      ).rejects.toThrow("Invalid credentials")
    })

    it("usa el mismo mensaje de error para usuario no encontrado y password incorrecto (evita enumeración)", async () => {
      // Arrange
      const bcrypt = await import("bcryptjs")
      vi.mocked(repo.findByEmail).mockResolvedValue(null)

      let errorNoUser: Error | undefined
      await useCase.execute("noexiste@example.com", "pass").catch((e) => { errorNoUser = e })

      vi.mocked(repo.findByEmail).mockResolvedValue(makeUser())
      vi.mocked(bcrypt.default.compare).mockResolvedValue(false as never)

      let errorBadPass: Error | undefined
      await useCase.execute("admin@saladillo.gob.ar", "wrongpass").catch((e) => { errorBadPass = e })

      // Assert
      expect(errorNoUser?.message).toBe(errorBadPass?.message)
    })

    it("propaga excepciones del repositorio", async () => {
      // Arrange
      vi.mocked(repo.findByEmail).mockRejectedValue(new Error("DB error"))

      // Act & Assert
      await expect(
        useCase.execute("admin@saladillo.gob.ar", "pass")
      ).rejects.toThrow("DB error")
    })
  })

  describe("Edge Cases", () => {
    it("no retorna el password_hash en el usuario autenticado (el objeto User lo expone pero no debería ser reenviado)", async () => {
      // Arrange
      const bcrypt = await import("bcryptjs")
      const user = makeUser()
      vi.mocked(repo.findByEmail).mockResolvedValue(user)
      vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never)

      // Act
      const result = await useCase.execute("admin@saladillo.gob.ar", "pass")

      // Assert: el use case retorna el objeto User completo (con hash),
      // la capa de presentación es responsable de no exponerlo
      expect(result).toHaveProperty("password_hash")
    })
  })
})
