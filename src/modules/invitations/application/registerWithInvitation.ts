import bcrypt from "bcryptjs"
import type { InvitationRepository } from "../domain/InvitationRepository"
import type { UserRepository } from "@/modules/users/domain/UserRepository"
import type { User } from "@/modules/users/domain/User"

export class RegisterWithInvitationUseCase {
  constructor(
    private invitationRepo: InvitationRepository,
    private userRepo: UserRepository
  ) {}

  async execute(token: string, name: string, password: string): Promise<User> {
    if (password.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres")
    }

    const invitation = await this.invitationRepo.findByToken(token)

    if (!invitation) {
      throw new Error("Invitación inválida o expirada")
    }

    if (invitation.accepted_at) {
      throw new Error("Invitación inválida o expirada")
    }

    if (new Date() > new Date(invitation.expires_at)) {
      throw new Error("Invitación inválida o expirada")
    }

    const existing = await this.userRepo.findByEmail(invitation.email)
    if (existing) {
      throw new Error("Ya existe una cuenta con ese email")
    }

    const passwordHash = await bcrypt.hash(password, 12)
    // TODO: ideally wrapped in a transaction — if markAccepted fails after create,
    // the invitation remains usable but a second create attempt will hit a unique constraint
    const user = await this.userRepo.create({
      email: invitation.email,
      password_hash: passwordHash,
      name,
    })

    await this.invitationRepo.markAccepted(invitation.id)

    return user
  }
}
