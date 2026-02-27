import { describe, it, expect, vi, beforeEach } from "vitest"
import { RegisterWithInvitationUseCase } from "@/modules/invitations/application/registerWithInvitation"
import type { InvitationRepository } from "@/modules/invitations/domain/InvitationRepository"
import type { Invitation } from "@/modules/invitations/domain/Invitation"
import type { UserRepository } from "@/modules/users/domain/UserRepository"
import type { User } from "@/modules/users/domain/User"

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$12$hashed"),
    compare: vi.fn(),
  },
}))

function makeInvitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    id: "inv-1",
    email: "nuevo@example.com",
    token: "abc123token",
    invited_by_id: "user-admin-1",
    expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    accepted_at: null,
    created_at: new Date(),
    ...overrides,
  }
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-new-1",
    email: "nuevo@example.com",
    password_hash: "$2b$12$hashed",
    name: "Juan Pérez",
    role: "operator",
    created_at: new Date(),
    reset_token: null,
    reset_token_expires_at: null,
    ...overrides,
  }
}

function makeInvitationRepo(overrides: Partial<InvitationRepository> = {}): InvitationRepository {
  return {
    create: vi.fn(),
    findByToken: vi.fn().mockResolvedValue(null),
    markAccepted: vi.fn().mockResolvedValue(undefined),
    findAllByInviter: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

function makeUserRepo(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(makeUser()),
    saveResetToken: vi.fn().mockResolvedValue(undefined),
    findByResetToken: vi.fn().mockResolvedValue(null),
    updatePassword: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe("RegisterWithInvitationUseCase", () => {
  let invitationRepo: InvitationRepository
  let userRepo: UserRepository
  let useCase: RegisterWithInvitationUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    invitationRepo = makeInvitationRepo()
    userRepo = makeUserRepo()
    useCase = new RegisterWithInvitationUseCase(invitationRepo, userRepo)
  })

  describe("Happy Path", () => {
    it("crea el usuario con el email de la invitación", async () => {
      const invitation = makeInvitation()
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(invitation)

      await useCase.execute("abc123token", "Juan Pérez", "password123")

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: "nuevo@example.com", name: "Juan Pérez" })
      )
    })

    it("marca la invitación como aceptada tras crear el usuario", async () => {
      const invitation = makeInvitation()
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(invitation)

      await useCase.execute("abc123token", "Juan", "password123")

      expect(invitationRepo.markAccepted).toHaveBeenCalledWith("inv-1")
    })

    it("retorna el usuario creado", async () => {
      const invitation = makeInvitation()
      const user = makeUser()
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(invitation)
      vi.mocked(userRepo.create).mockResolvedValue(user)

      const result = await useCase.execute("abc123token", "Juan", "password123")

      expect(result).toEqual(user)
    })

    it("hashea el password con bcrypt cost 12", async () => {
      const bcrypt = await import("bcryptjs")
      const invitation = makeInvitation()
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(invitation)

      await useCase.execute("abc123token", "Juan", "miPassword")

      expect(bcrypt.default.hash).toHaveBeenCalledWith("miPassword", 12)
    })
  })

  describe("Failure Path — token inválido", () => {
    it("lanza error si el token no existe", async () => {
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(null)

      await expect(
        useCase.execute("tokeninexistente", "Juan", "password123")
      ).rejects.toThrow("Invitación inválida o expirada")
    })

    it("lanza error si la invitación ya fue aceptada", async () => {
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(
        makeInvitation({ accepted_at: new Date("2024-01-01") })
      )

      await expect(
        useCase.execute("abc123token", "Juan", "password123")
      ).rejects.toThrow("Invitación inválida o expirada")
    })

    it("lanza error si la invitación expiró", async () => {
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(
        makeInvitation({ expires_at: new Date(Date.now() - 1000) }) // 1 second ago
      )

      await expect(
        useCase.execute("abc123token", "Juan", "password123")
      ).rejects.toThrow("Invitación inválida o expirada")
    })

    it("usa el mismo mensaje de error para token inexistente, expirado y ya usado", async () => {
      const msg = "Invitación inválida o expirada"

      vi.mocked(invitationRepo.findByToken).mockResolvedValue(null)
      await expect(useCase.execute("x", "J", "pass1234")).rejects.toThrow(msg)

      vi.mocked(invitationRepo.findByToken).mockResolvedValue(
        makeInvitation({ accepted_at: new Date() })
      )
      await expect(useCase.execute("x", "J", "pass1234")).rejects.toThrow(msg)

      vi.mocked(invitationRepo.findByToken).mockResolvedValue(
        makeInvitation({ expires_at: new Date(Date.now() - 1) })
      )
      await expect(useCase.execute("x", "J", "pass1234")).rejects.toThrow(msg)
    })

    it("no crea el usuario si el token es inválido", async () => {
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(null)

      await useCase.execute("bad", "Juan", "password123").catch(() => {})

      expect(userRepo.create).not.toHaveBeenCalled()
    })
  })

  describe("Failure Path — email ya registrado", () => {
    it("lanza error si ya existe una cuenta con ese email", async () => {
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(makeInvitation())
      vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser())

      await expect(
        useCase.execute("abc123token", "Juan", "password123")
      ).rejects.toThrow("Ya existe una cuenta con ese email")
    })

    it("no crea el usuario si el email ya está registrado", async () => {
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(makeInvitation())
      vi.mocked(userRepo.findByEmail).mockResolvedValue(makeUser())

      await useCase.execute("abc123token", "Juan", "password123").catch(() => {})

      expect(userRepo.create).not.toHaveBeenCalled()
    })
  })

  describe("Failure Path — validación de password", () => {
    it("lanza error si el password tiene menos de 8 caracteres", async () => {
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(makeInvitation())

      await expect(
        useCase.execute("abc123token", "Juan", "1234567")
      ).rejects.toThrow("La contraseña debe tener al menos 8 caracteres")
    })

    it("acepta password de exactamente 8 caracteres", async () => {
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(makeInvitation())

      await expect(
        useCase.execute("abc123token", "Juan", "12345678")
      ).resolves.not.toThrow()
    })
  })
})
