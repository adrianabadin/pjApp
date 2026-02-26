import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { listUnseenByUser } from "@/lib/di"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { markAffiliateAsSeenAction } from "./actions"
import { PresenceRegistration } from "./PresenceRegistration"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const affiliates = await listUnseenByUser.execute(session.user.id)

  return (
    <div className="space-y-6">
      {/* DNI Presence Registration */}
      <PresenceRegistration />

      {/* Pending affiliates list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: '#020238' }}>
            Afiliados asignados pendientes
          </h2>
          <Badge
            variant="secondary"
            style={{ backgroundColor: '#020238', color: '#FFD331' }}
          >
            {affiliates.length} pendientes
          </Badge>
        </div>

        {affiliates.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <p className="text-sm" style={{ color: '#4a5568' }}>
              No hay afiliados pendientes de revisión.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: '#f0f9fd' }}>
                  <TableHead style={{ color: '#020238' }}>Apellido y Nombre</TableHead>
                  <TableHead style={{ color: '#020238' }}>DNI</TableHead>
                  <TableHead style={{ color: '#020238' }}>Género</TableHead>
                  <TableHead style={{ color: '#020238' }}>Fecha Nac.</TableHead>
                  <TableHead style={{ color: '#020238' }}>Teléfono</TableHead>
                  <TableHead style={{ color: '#020238' }}>Email</TableHead>
                  <TableHead className="w-24" style={{ color: '#020238' }}>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-sm">
                      {[a.apellido, a.nombres].filter(Boolean).join(", ")}
                    </TableCell>
                    <TableCell className="text-sm">{a.dni_numero ?? "—"}</TableCell>
                    <TableCell>
                      {a.genero ? (
                        <Badge variant="outline" className="text-xs">{a.genero}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {a.fecha_nacimiento
                        ? new Date(a.fecha_nacimiento).toLocaleDateString("es-AR")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{a.telefono ?? "—"}</TableCell>
                    <TableCell className="text-sm">{a.mail ?? "—"}</TableCell>
                    <TableCell>
                      <form action={markAffiliateAsSeenAction.bind(null, a.id)}>
                        <Button
                          size="sm"
                          type="submit"
                          style={{ backgroundColor: '#00B7E2', color: '#020238' }}
                        >
                          Visto
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
