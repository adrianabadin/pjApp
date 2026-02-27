"use server"

import { invitationRepo, userRepo } from "@/lib/di"
import { RegisterWithInvitationUseCase } from "@/modules/invitations/application/registerWithInvitation"

const registerUseCase = new RegisterWithInvitationUseCase(invitationRepo, userRepo)

export async function registerAction(
  token: string,
  name: string,
  password: string
): Promise<void> {
  await registerUseCase.execute(token, name, password)
}
