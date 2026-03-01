"use server"

import { auth } from "@/lib/auth"
import { affiliateRepo } from "@/lib/di"
import { getGoogleToken } from "@/lib/google-token"
import type { Affiliate } from "@/modules/affiliates/domain/Affiliate"

type SyncResult = { synced: number; errors: string[] }

export async function syncAffiliatesAction(
  affiliateIds: number[] | "all"
): Promise<SyncResult> {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized")
  }

  const affiliates: Affiliate[] =
    affiliateIds === "all"
      ? await affiliateRepo.findAll()
      : await Promise.all(
          affiliateIds
            .map((id) => affiliateRepo.findById(id))
            .map((p) => p.then((a) => a))
        ).then((results) => results.filter((a): a is Affiliate => a !== null))

  const accessToken = await getGoogleToken(session.user.id)

  const toSync = affiliates.filter((a) => a.nombres || a.apellido)
  const errors: string[] = []
  let synced = 0

  // Batch in groups of 200 (People API limit)
  const BATCH_SIZE = 200
  for (let i = 0; i < toSync.length; i += BATCH_SIZE) {
    const batch = toSync.slice(i, i + BATCH_SIZE)

    const contacts = batch.map((a) => {
      const contact: Record<string, unknown> = {
        names: [
          {
            givenName: a.nombres ?? "",
            familyName: a.apellido ?? "",
          },
        ],
      }
      if (a.telefono) {
        contact.phoneNumbers = [{ value: a.telefono }]
      }
      if (a.mail) {
        contact.emailAddresses = [{ value: a.mail }]
      }
      return { contactPerson: contact }
    })

    const res = await fetch(
      "https://people.googleapis.com/v1/people:batchCreateContacts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contacts,
          readMask: "names",
        }),
      }
    )

    if (!res.ok) {
      const body = await res.text()
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${body}`)
    } else {
      const data = (await res.json()) as { createdPeople?: unknown[] }
      synced += data.createdPeople?.length ?? batch.length
    }
  }

  return { synced, errors }
}
