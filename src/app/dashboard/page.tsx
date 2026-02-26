import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { listUnseenByUser, affiliateRepo } from "@/lib/di"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { markAffiliateAsSeenAction } from "./actions"
import { PresenceRegistration } from "./PresenceRegistration"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [pendingAffiliates, confirmedToday] = await Promise.all([
    listUnseenByUser.execute(session.user.id),
    affiliateRepo.findConfirmedToday(),
  ])

  return (
    <div className="space-y-6">
      {/* Presence registration widget */}
      <PresenceRegistration />

      {/* Confirmed today */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: '#020238' }}>
            Confirmados hoy
          </h2>
          <Badge style={{ backgroundColor: '#00B7E2', color: '#020238' }}>
            {confirmedToday.length}
          </Badge>
        </div>

        {confirmedToday.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-center">
            <p className="text-sm" style={{ color: '#4a5568' }}>
              Aún no se registraron presencias hoy.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: '#f0f9fd' }}>
                  <TableHead style={{ color: '#020238' }}>Apellido y Nombre</TableHead>
                  <TableHead style={{ color: '#020238' }}>DNI</TableHead>
                  <TableHead style={{ color: '#020238' }}>Teléfono</TableHead>
                  <TableHead style={{ color: '#020238' }}>Email</TableHead>
                  <TableHead style={{ color: '#020238' }}>Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmedToday.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-sm">
                      {[a.apellido, a.nombres].filter(Boolean).join(", ")}
                    </TableCell>
                    <TableCell className="text-sm">{a.dni_numero ?? "—"}</TableCell>
                    <TableCell className="text-sm">{a.telefono ?? "—"}</TableCell>
                    <TableCell className="text-sm">{a.mail ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {a.seen_at
                        ? new Date(a.seen_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Pending assigned affiliates */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: '#020238' }}>
            Afiliados asignados pendientes
          </h2>
          <div className="flex items-center gap-2">
            <Badge style={{ backgroundColor: '#020238', color: '#FFD331' }}>
              {pendingAffiliates.length} pendientes
            </Badge>
            <Link
              href="/dashboard/assign"
              className="text-xs px-3 py-1 rounded-full border font-medium"
              style={{ borderColor: '#020238', color: '#020238' }}
            >
              + Asignar afiliados
            </Link>
          </div>
        </div>

        {pendingAffiliates.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center space-y-3">
            <p className="text-sm" style={{ color: '#4a5568' }}>
              No hay afiliados asignados pendientes de revisión.
            </p>
            <Link
              href="/dashboard/assign"
              className="inline-flex items-center gap-1 text-sm font-medium underline"
              style={{ color: '#00B7E2' }}
            >
              Asignar afiliados a mi usuario →
            </Link>
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
                {pendingAffiliates.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-sm">
                      {[a.apellido, a.nombres].filter(Boolean).join(", ")}
                    </TableCell>
                    <TableCell className="text-sm">{a.dni_numero ?? "—"}</TableCell>
                    <TableCell>
                      {a.genero ? <Badge variant="outline" className="text-xs">{a.genero}</Badge> : "—"}
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
                        <Button size="sm" type="submit" style={{ backgroundColor: '#00B7E2', color: '#020238' }}>
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
      </section>
    </div>
  )
}
