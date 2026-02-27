"use server"

import crypto from "crypto"
import { auth } from "@/lib/auth"
import { invitationRepo } from "@/lib/di"
import { sendInvitationEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"

export async function createInvitationAction(email: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autenticado")

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error("Email inválido")
  }

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await invitationRepo.create({
    email,
    token,
    invitedById: session.user.id,
    expiresAt,
  })

  await sendInvitationEmail(email, token)

  revalidatePath("/dashboard/invite")
}
