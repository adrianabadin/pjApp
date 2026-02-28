"use server"

import crypto from "crypto"
import { PrismaUserRepository } from "@/modules/users/infrastructure/PrismaUserRepository"
import { sendPasswordResetEmail } from "@/lib/email"

const userRepo = new PrismaUserRepository()

export async function requestPasswordResetAction(email: string): Promise<void> {
  const user = await userRepo.findByEmail(email)

  // Always succeed — never reveal whether an email exists
  if (!user) return

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await userRepo.saveResetToken(user.id, token, expiresAt)
  await sendPasswordResetEmail(user.email, token)
}
