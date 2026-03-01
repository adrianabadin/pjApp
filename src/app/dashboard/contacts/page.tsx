import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { affiliateRepo } from "@/lib/di"
import { ContactsSync } from "./ContactsSync"

export default async function ContactsPage() {
  const session = await auth()
  if (session?.user?.role !== "admin") redirect("/dashboard")

  const affiliates = await affiliateRepo.findAll()

  return (
    <div>
      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: "#020238" }}
      >
        Sincronizar Contactos de Google
      </h1>
      <ContactsSync affiliates={affiliates} />
    </div>
  )
}
