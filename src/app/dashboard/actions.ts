"use server"

import { auth } from "@/lib/auth"
import { markAsSeen, updateAffiliateContact, unassignAffiliate } from "@/lib/di"
import { revalidatePath } from "next/cache"

export async function markAffiliateAsSeenAction(affiliateId: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await markAsSeen.execute(affiliateId, session.user.id)
  revalidatePath("/dashboard")
}

export async function updateAffiliateContactAction(
  affiliateId: number,
  data: { telefono?: string; mail?: string; calle?: string; altura?: string; fecha_nacimiento?: string }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const contactData = {
    telefono: data.telefono || null,
    mail: data.mail || null,
    calle: data.calle || null,
    altura: data.altura || null,
    fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : undefined,
  }
  await updateAffiliateContact.execute(affiliateId, session.user.id, contactData)
  revalidatePath("/dashboard")
}

export async function unassignAffiliateAction(affiliateId: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  await unassignAffiliate.execute(affiliateId, session.user.id)
  revalidatePath("/dashboard")
}

export async function unmarkAffiliateAsSeenAction(affiliateId: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const { affiliateRepo } = await import("@/lib/di")
  await affiliateRepo.unmarkAsSeen(affiliateId)
  revalidatePath("/dashboard")
}

export async function updateAnyAffiliateContactAction(
  affiliateId: number,
  data: { telefono?: string; mail?: string; calle?: string; altura?: string; fecha_nacimiento?: string }
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const { affiliateRepo } = await import("@/lib/di")
  const contactData = {
    telefono: data.telefono || null,
    mail: data.mail || null,
    calle: data.calle || null,
    altura: data.altura || null,
    fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : undefined,
  }
  await affiliateRepo.updateContactInfo(affiliateId, contactData)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/assign")
}

export async function lookupAffiliateByDniAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ affiliate: import("@/modules/affiliates/domain/Affiliate").Affiliate | null; error: string | null }> {
  const session = await auth()
  if (!session?.user?.id) return { affiliate: null, error: "No autorizado" }

  const dni = formData.get("dni") as string
  if (!dni?.trim()) return { affiliate: null, error: "Ingresá un DNI" }

  try {
    const { affiliateRepo } = await import("@/lib/di")
    const affiliate = await affiliateRepo.findByDni(dni.trim())
    if (!affiliate) return { affiliate: null, error: "DNI no encontrado en el padrón" }
    return { affiliate, error: null }
  } catch {
    return { affiliate: null, error: "Error al buscar el afiliado" }
  }
}

export async function confirmPresenceByDniAction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error: string | null; affiliateName?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "No autorizado" }

  const dni = formData.get("dni") as string
  try {
    const { confirmPresenceByDni } = await import("@/lib/di")
    const affiliate = await confirmPresenceByDni.execute(dni)
    const name = [affiliate.apellido, affiliate.nombres].filter(Boolean).join(", ")
    revalidatePath("/dashboard")
    return { success: true, error: null, affiliateName: name }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al confirmar presencia"
    return { success: false, error: msg }
  }
}
