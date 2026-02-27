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

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await this.userRepo.create({
      email: invitation.email,
      password_hash: passwordHash,
      name,
    })

    await this.invitationRepo.markAccepted(invitation.id)

    return user
  }
}
