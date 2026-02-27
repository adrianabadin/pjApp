"use server"

import crypto from "crypto"
import { auth } from "@/lib/auth"
import { PrismaInvitationRepository } from "@/modules/invitations/infrastructure/PrismaInvitationRepository"
import { sendInvitationEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"

const invitationRepo = new PrismaInvitationRepository()

export async function createInvitationAction(email: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autenticado")

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
