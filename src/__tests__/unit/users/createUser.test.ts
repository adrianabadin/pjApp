import { describe, it, expect, vi, beforeEach } from "vitest"
import { CreateUserUseCase } from "@/modules/users/application/createUser"
import type { UserRepository } from "@/modules/users/domain/UserRepository"
import type { User } from "@/modules/users/domain/User"

// Mock bcryptjs para evitar el costo computacional en tests unitarios
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password_mock"),
    compare: vi.fn(),
  },
}))

// --- Fake factory ---
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-uuid-1",
    email: "test@example.com",
    password_hash: "hashed_password_mock",
    name: "Test User",
    role: "operator",
    created_at: new Date("2024-01-01"),
    ...overrides,
  }
}

function makeRepo(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(makeUser()),
    ...overrides,
  }
}

describe("CreateUserUseCase", () => {
  let repo: UserRepository
  let useCase: CreateUserUseCase

  beforeEach(() => {
    repo = makeRepo()
    useCase = new CreateUserUseCase(repo)
    vi.clearAllMocks()
  })

  describe("Happy Path", () => {
    it("crea el usuario y retorna los datos correctamente", async () => {
      // Arrange
      const userData = { email: "nuevo@example.com", password: "securePass123", name: "Juan Perez" }
      const expectedUser = makeUser({ email: "nuevo@example.com", name: "Juan Perez" })
      vi.mocked(repo.findByEmail).mockResolvedValue(null)
      vi.mocked(repo.create).mockResolvedValue(expectedUser)

      // Act
      const result = await useCase.execute(userData)

      // Assert
      expect(result).toEqual(expectedUser)
      expect(result.email).toBe("nuevo@example.com")
    })

    it("hashea el password antes de llamar al repositorio", async () => {
      // Arrange
      const bcrypt = await import("bcryptjs")
      const userData = { email: "nuevo@example.com", password: "plaintext123" }
      vi.mocked(repo.findByEmail).mockResolvedValue(null)
      vi.mocked(repo.create).mockResolvedValue(makeUser())

      // Act
      await useCase.execute(userData)

      // Assert
      expect(bcrypt.default.hash).toHaveBeenCalledWith("plaintext123", 12)
    })

    it("llama a create con el hash y nunca con el password en texto plano", async () => {
      // Arrange
      const userData = { email: "nuevo@example.com", password: "plaintext123" }
      vi.mocked(repo.findByEmail).mockResolvedValue(null)
      vi.mocked(repo.create).mockResolvedValue(makeUser())

      // Act
      await useCase.execute(userData)

      // Assert
      expect(repo.create).toHaveBeenCalledOnce()
      const callArgs = vi.mocked(repo.create).mock.calls[0][0]
      expect(callArgs.password_hash).toBe("hashed_password_mock")
      expect(callArgs).not.toHaveProperty("password")
    })

    it("crea usuario sin name si name no se provee", async () => {
      // Arrange
      const userData = { email: "nuevo@example.com", password: "securePass123" }
      vi.mocked(repo.findByEmail).mockResolvedValue(null)
      vi.mocked(repo.create).mockResolvedValue(makeUser({ name: null }))

      // Act
      await useCase.execute(userData)

      // Assert
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: "nuevo@example.com" })
      )
    })
  })

  describe("Failure Path", () => {
    it("lanza error si el email ya está registrado", async () => {
      // Arrange
      const existingUser = makeUser({ email: "existente@example.com" })
      vi.mocked(repo.findByEmail).mockResolvedValue(existingUser)

      // Act & Assert
      await expect(
        useCase.execute({ email: "existente@example.com", password: "pass1234" })
      ).rejects.toThrow("Email already registered")
    })

    it("no llama a create ni a bcrypt.hash si el email ya existe", async () => {
      // Arrange
      const bcrypt = await import("bcryptjs")
      vi.mocked(repo.findByEmail).mockResolvedValue(makeUser())

      // Act
      await useCase.execute({ email: "existente@example.com", password: "pass1234" }).catch(() => {})

      // Assert
      expect(repo.create).not.toHaveBeenCalled()
      expect(bcrypt.default.hash).not.toHaveBeenCalled()
    })

    it("propaga excepciones del repositorio al crear", async () => {
      // Arrange
      vi.mocked(repo.findByEmail).mockResolvedValue(null)
      vi.mocked(repo.create).mockRejectedValue(new Error("DB write failed"))

      // Act & Assert
      await expect(
        useCase.execute({ email: "nuevo@example.com", password: "pass1234" })
      ).rejects.toThrow("DB write failed")
    })
  })

  describe("Edge Cases", () => {
    it("usa factor de costo 12 para el hash (seguridad)", async () => {
      // Arrange
      const bcrypt = await import("bcryptjs")
      vi.mocked(repo.findByEmail).mockResolvedValue(null)
      vi.mocked(repo.create).mockResolvedValue(makeUser())

      // Act
      await useCase.execute({ email: "test@example.com", password: "anypass" })

      // Assert
      const [, saltRounds] = vi.mocked(bcrypt.default.hash).mock.calls[0]
      expect(saltRounds).toBe(12)
    })
  })
})
