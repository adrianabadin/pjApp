"use server"

import { auth } from "@/lib/auth"
import { affiliateRepo } from "@/lib/di"
import { revalidatePath } from "next/cache"

export async function assignSelectedAffiliatesAction(ids: number[]): Promise<number> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Not authenticated")

  if (ids.length === 0) return 0

  const count = await affiliateRepo.assignToUser(ids, session.user.id)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/assign")
  return count
}
