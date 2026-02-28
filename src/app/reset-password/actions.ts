"use server"

import bcrypt from "bcryptjs"
import { PrismaUserRepository } from "@/modules/users/infrastructure/PrismaUserRepository"

const userRepo = new PrismaUserRepository()

export async function resetPasswordAction(token: string, newPassword: string): Promise<void> {
  const user = await userRepo.findByResetToken(token)

  if (!user || !user.reset_token_expires_at) {
    throw new Error("Token inválido o expirado")
  }

  if (new Date() > new Date(user.reset_token_expires_at)) {
    throw new Error("Token inválido o expirado")
  }

  if (newPassword.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres")
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await userRepo.updatePassword(user.id, passwordHash)
}
