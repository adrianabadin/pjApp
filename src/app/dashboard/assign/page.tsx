import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { affiliateRepo } from "@/lib/di"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import AffiliateSelector from "./AffiliateSelector"

export default async function AssignPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [affiliates, unassignedCount] = await Promise.all([
    affiliateRepo.findUnassigned(500),
    affiliateRepo.countUnassigned(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm"
          style={{ color: "#00B7E2" }}
        >
          ← Volver al dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ color: "#020238" }}>Asignar Afiliados</CardTitle>
          <CardDescription>
            Seleccioná los afiliados que querés asignar a tu usuario. Podés filtrar por apellido, nombres o DNI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unassignedCount === 0 ? (
            <p className="text-sm" style={{ color: "#4a5568" }}>
              Todos los afiliados ya están asignados.
            </p>
          ) : (
            <AffiliateSelector affiliates={affiliates} unassignedCount={unassignedCount} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
