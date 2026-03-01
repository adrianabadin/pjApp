"use server"

import { auth } from "@/lib/auth"
import { updateUserRole } from "@/lib/di"
import { revalidatePath } from "next/cache"

export async function toggleUserRoleAction(userId: string, newRole: string) {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    throw new Error("Acceso denegado")
  }
  await updateUserRole.execute(userId, newRole)
  revalidatePath("/dashboard/users")
}
