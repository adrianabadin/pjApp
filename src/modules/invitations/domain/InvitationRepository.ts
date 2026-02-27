import type { Invitation } from "./Invitation"

export interface InvitationRepository {
  create(data: {
    email: string
    token: string
    invitedById: string
    expiresAt: Date
  }): Promise<Invitation>
  findByToken(token: string): Promise<Invitation | null>
  markAccepted(id: string): Promise<void>
  findAllByInviter(userId: string): Promise<Invitation[]>
}
