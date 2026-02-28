import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { listUnseenByUser, affiliateRepo } from "@/lib/di"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PresenceRegistration } from "./PresenceRegistration"
import { PendingAffiliatesTable } from "./PendingAffiliatesTable"
import Link from "next/link"
import type { Affiliate } from "@/modules/affiliates/domain/Affiliate"

function formatDate(date: Date): string {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (sameDay(d, today)) return "Hoy"
  if (sameDay(d, yesterday)) return "Ayer"
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
}

function groupByDate(affiliates: Affiliate[]): { label: string; items: Affiliate[] }[] {
  const map = new Map<string, Affiliate[]>()
  for (const a of affiliates) {
    const label = a.seen_at ? formatDate(new Date(a.seen_at)) : "Sin fecha"
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(a)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [pendingAffiliates, allConfirmed] = await Promise.all([
    listUnseenByUser.execute(session.user.id),
    affiliateRepo.findAllConfirmed(),
  ])

  const confirmedGroups = groupByDate(allConfirmed)
  const todayCount = confirmedGroups.find((g) => g.label === "Hoy")?.items.length ?? 0

  return (
    <div className="space-y-6">
      {/* Presence registration widget */}
      <PresenceRegistration />

      {/* All confirmed affiliates */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: '#020238' }}>
            Confirmados
          </h2>
          <div className="flex items-center gap-2">
            {todayCount > 0 && (
              <Badge style={{ backgroundColor: '#00B7E2', color: '#020238' }}>
                {todayCount} hoy
              </Badge>
            )}
            <Badge style={{ backgroundColor: '#020238', color: '#FFD331' }}>
              {allConfirmed.length} total
            </Badge>
          </div>
        </div>

        {allConfirmed.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-center">
            <p className="text-sm" style={{ color: '#4a5568' }}>
              Aún no se registraron presencias.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {confirmedGroups.map(({ label, items }) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: '#6b7280' }}>
                  {label} — {items.length}
                </p>
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
                      {items.map((a) => (
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
              </div>
            ))}
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
              href="/dashboard/invite"
              className="text-xs px-3 py-1 rounded-full border font-medium"
              style={{ borderColor: '#020238', color: '#020238' }}
            >
              + Invitar usuario
            </Link>
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
          <PendingAffiliatesTable affiliates={pendingAffiliates} />
        )}
      </section>
    </div>
  )
}
