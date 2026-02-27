"use server"

import { invitationRepo } from "@/lib/di"
import { PrismaUserRepository } from "@/modules/users/infrastructure/PrismaUserRepository"
import { RegisterWithInvitationUseCase } from "@/modules/invitations/application/registerWithInvitation"

const userRepo = new PrismaUserRepository()
const registerUseCase = new RegisterWithInvitationUseCase(invitationRepo, userRepo)

export async function registerAction(
  token: string,
  name: string,
  password: string
): Promise<void> {
  await registerUseCase.execute(token, name, password)
}
