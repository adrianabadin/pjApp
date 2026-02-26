import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { listUnseenByUser } from "@/lib/di"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { markAffiliateAsSeenAction } from "./actions"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const affiliates = await listUnseenByUser.execute(session.user.id)

  if (affiliates.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">No hay afiliados pendientes de revisión.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Afiliados pendientes
        </h2>
        <Badge variant="secondary">{affiliates.length} pendientes</Badge>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Apellido y Nombre</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Género</TableHead>
              <TableHead>Fecha Nac.</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-24">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {affiliates.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  {[a.apellido, a.nombres].filter(Boolean).join(", ")}
                </TableCell>
                <TableCell>{a.dni_numero ?? "—"}</TableCell>
                <TableCell>
                  {a.genero ? (
                    <Badge variant="outline">{a.genero}</Badge>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  {a.fecha_nacimiento
                    ? new Date(a.fecha_nacimiento).toLocaleDateString("es-AR")
                    : "—"}
                </TableCell>
                <TableCell>{a.telefono ?? "—"}</TableCell>
                <TableCell>{a.mail ?? "—"}</TableCell>
                <TableCell>
                  <form action={markAffiliateAsSeenAction.bind(null, a.id)}>
                    <Button size="sm" variant="outline" type="submit">
                      Visto
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
