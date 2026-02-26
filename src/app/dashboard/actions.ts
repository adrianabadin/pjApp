"use server"

import { auth } from "@/lib/auth"
import { markAsSeen } from "@/lib/di"
import { revalidatePath } from "next/cache"

export async function markAffiliateAsSeenAction(affiliateId: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await markAsSeen.execute(affiliateId, session.user.id)
  revalidatePath("/dashboard")
}
