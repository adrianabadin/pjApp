import { describe, it, expect, vi, beforeEach } from "vitest"

// Mockeamos el módulo DI completo antes de importar la route
// para evitar que intente conectarse a la base de datos real
vi.mock("@/lib/di", () => ({
  createUser: {
    execute: vi.fn(),
  },
  listUnseenByUser: { execute: vi.fn() },
  markAsSeen: { execute: vi.fn() },
  assignAffiliatesToUser: { execute: vi.fn() },
  authenticateUser: { execute: vi.fn() },
}))

// Mockeamos next-auth para evitar dependencias externas
vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}))

// Mockeamos next/server para poder instanciar NextRequest/NextResponse en Node puro
vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server")
  return actual
})

// Importamos después de los mocks
import { POST } from "@/app/api/register/route"
import { createUser } from "@/lib/di"
import { NextRequest } from "next/server"

// Helper para construir un NextRequest con body JSON
function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Happy Path - 201", () => {
    it("retorna 201 con id y email cuando los datos son válidos", async () => {
      // Arrange
      const mockUser = {
        id: "user-uuid-1",
        email: "nuevo@example.com",
        password_hash: "hash",
        name: "Juan",
        role: "operator",
        created_at: new Date(),
      }
      vi.mocked(createUser.execute).mockResolvedValue(mockUser)

      const req = buildRequest({
        name: "Juan",
        email: "nuevo@example.com",
        password: "securePass123",
      })

      // Act
      const response = await POST(req)
      const body = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(body).toEqual({ id: "user-uuid-1", email: "nuevo@example.com" })
    })

    it("no expone el password_hash en la respuesta", async () => {
      // Arrange
      const mockUser = {
        id: "user-uuid-1",
        email: "nuevo@example.com",
        password_hash: "$2b$12$secrethash",
        name: "Juan",
        role: "operator",
        created_at: new Date(),
      }
      vi.mocked(createUser.execute).mockResolvedValue(mockUser)

      const req = buildRequest({ email: "nuevo@example.com", password: "securePass123" })

      // Act
      const response = await POST(req)
      const body = await response.json()

      // Assert
      expect(body).not.toHaveProperty("password_hash")
    })

    it("acepta registro sin name (campo opcional)", async () => {
      // Arrange
      const mockUser = {
        id: "user-uuid-2",
        email: "sinname@example.com",
        password_hash: "hash",
        name: null,
        role: "operator",
        created_at: new Date(),
      }
      vi.mocked(createUser.execute).mockResolvedValue(mockUser)

      const req = buildRequest({ email: "sinname@example.com", password: "securePass123" })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(201)
    })
  })

  describe("Failure Path - 400", () => {
    it("retorna 400 si falta el email", async () => {
      // Arrange
      const req = buildRequest({ password: "securePass123" })

      // Act
      const response = await POST(req)
      const body = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty("error")
    })

    it("retorna 400 si falta el password", async () => {
      // Arrange
      const req = buildRequest({ email: "test@example.com" })

      // Act
      const response = await POST(req)
      const body = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty("error")
    })

    it("retorna 400 si falta tanto email como password", async () => {
      // Arrange
      const req = buildRequest({ name: "Solo nombre" })

      // Act
      const response = await POST(req)
      const body = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty("error")
    })

    it("retorna 400 si la contraseña tiene menos de 8 caracteres", async () => {
      // Arrange
      const req = buildRequest({ email: "test@example.com", password: "1234567" })

      // Act
      const response = await POST(req)
      const body = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty("error")
    })

    it("retorna 400 si la contraseña tiene exactamente 7 caracteres (borde inferior)", async () => {
      // Arrange
      const req = buildRequest({ email: "test@example.com", password: "1234567" })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(400)
    })

    it("acepta contraseña de exactamente 8 caracteres (borde inferior válido)", async () => {
      // Arrange
      const mockUser = {
        id: "u1",
        email: "test@example.com",
        password_hash: "hash",
        name: null,
        role: "operator",
        created_at: new Date(),
      }
      vi.mocked(createUser.execute).mockResolvedValue(mockUser)
      const req = buildRequest({ email: "test@example.com", password: "12345678" })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(201)
    })

    it("no llama al use case si la validación falla", async () => {
      // Arrange
      const req = buildRequest({ email: "test@example.com", password: "short" })

      // Act
      await POST(req)

      // Assert
      expect(createUser.execute).not.toHaveBeenCalled()
    })
  })

  describe("Conflict - 409", () => {
    it("retorna 409 si el email ya está registrado", async () => {
      // Arrange
      vi.mocked(createUser.execute).mockRejectedValue(
        new Error("Email already registered")
      )
      const req = buildRequest({
        email: "existente@example.com",
        password: "securePass123",
      })

      // Act
      const response = await POST(req)
      const body = await response.json()

      // Assert
      expect(response.status).toBe(409)
      expect(body).toHaveProperty("error")
    })
  })

  describe("Server Error - 500", () => {
    it("retorna 500 si ocurre un error inesperado en el use case", async () => {
      // Arrange
      vi.mocked(createUser.execute).mockRejectedValue(new Error("Unexpected DB crash"))
      const req = buildRequest({ email: "test@example.com", password: "securePass123" })

      // Act
      const response = await POST(req)

      // Assert
      expect(response.status).toBe(500)
    })
  })
})
