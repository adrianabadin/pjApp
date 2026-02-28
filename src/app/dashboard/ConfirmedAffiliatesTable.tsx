"use client"

import { Fragment, useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { unmarkAffiliateAsSeenAction, updateAnyAffiliateContactAction } from "./actions"
import type { Affiliate } from "@/modules/affiliates/domain/Affiliate"

interface EditFormData {
  telefono: string
  mail: string
  calle: string
  altura: string
  fecha_nacimiento: string
}

function toDateInputValue(date: Date | null): string {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

interface Props {
  groups: { label: string; items: Affiliate[] }[]
}

export function ConfirmedAffiliatesTable({ groups }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [formData, setFormData] = useState<EditFormData>({
    telefono: "",
    mail: "",
    calle: "",
    altura: "",
    fecha_nacimiento: "",
  })
  const [isPending, startTransition] = useTransition()

  function openEdit(a: Affiliate) {
    setExpandedId(a.id)
    setFormData({
      telefono: a.telefono ?? "",
      mail: a.mail ?? "",
      calle: a.calle ?? "",
      altura: a.altura ?? "",
      fecha_nacimiento: toDateInputValue(a.fecha_nacimiento),
    })
  }

  function closeEdit() {
    setExpandedId(null)
  }

  function handleSave(affiliateId: number) {
    startTransition(async () => {
      await updateAnyAffiliateContactAction(affiliateId, formData)
      setExpandedId(null)
    })
  }

  function handleUnmark(affiliateId: number, name: string) {
    if (!window.confirm(`¿Quitar el visto de ${name}? El afiliado volverá a pendientes.`)) return
    startTransition(async () => {
      await unmarkAffiliateAsSeenAction(affiliateId)
    })
  }

  return (
    <div className="space-y-4">
      {groups.map(({ label, items }) => (
        <div key={label}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: "#6b7280" }}>
            {label} — {items.length}
          </p>
          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: "#f0f9fd" }}>
                  <TableHead style={{ color: "#020238" }}>Apellido y Nombre</TableHead>
                  <TableHead style={{ color: "#020238" }}>DNI</TableHead>
                  <TableHead style={{ color: "#020238" }}>Teléfono</TableHead>
                  <TableHead style={{ color: "#020238" }}>Email</TableHead>
                  <TableHead style={{ color: "#020238" }}>Hora</TableHead>
                  <TableHead style={{ color: "#020238" }}>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a) => {
                  const name = [a.apellido, a.nombres].filter(Boolean).join(", ")
                  const isExpanded = expandedId === a.id

                  return (
                    <Fragment key={a.id}>
                      <TableRow>
                        <TableCell className="font-medium text-sm">{name || "—"}</TableCell>
                        <TableCell className="text-sm">{a.dni_numero ?? "—"}</TableCell>
                        <TableCell className="text-sm">{a.telefono ?? "—"}</TableCell>
                        <TableCell className="text-sm">{a.mail ?? "—"}</TableCell>
                        <TableCell className="text-sm">
                          {a.seen_at
                            ? new Date(a.seen_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => (isExpanded ? closeEdit() : openEdit(a))}
                              style={
                                isExpanded
                                  ? { backgroundColor: "#020238", color: "#FFD331" }
                                  : { borderColor: "#020238", color: "#020238" }
                              }
                            >
                              {isExpanded ? "✕ Cerrar" : "✎ Editar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleUnmark(a.id, name)}
                              style={{ borderColor: "#dc2626", color: "#dc2626" }}
                            >
                              Quitar visto
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow style={{ backgroundColor: "#f8fafc" }}>
                          <TableCell colSpan={6} className="py-4 px-6">
                            <p className="text-xs font-semibold mb-3" style={{ color: "#020238" }}>
                              Editando: {name}
                            </p>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                              <div className="space-y-1">
                                <Label className="text-xs font-medium" style={{ color: "#020238" }}>
                                  Teléfono
                                </Label>
                                <Input
                                  value={formData.telefono}
                                  onChange={(e) => setFormData((f) => ({ ...f, telefono: e.target.value }))}
                                  placeholder="Ej: 2983123456"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium" style={{ color: "#020238" }}>
                                  Email
                                </Label>
                                <Input
                                  type="email"
                                  value={formData.mail}
                                  onChange={(e) => setFormData((f) => ({ ...f, mail: e.target.value }))}
                                  placeholder="Ej: juan@mail.com"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium" style={{ color: "#020238" }}>
                                  Fecha de Nac.
                                </Label>
                                <Input
                                  type="date"
                                  value={formData.fecha_nacimiento}
                                  onChange={(e) => setFormData((f) => ({ ...f, fecha_nacimiento: e.target.value }))}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium" style={{ color: "#020238" }}>
                                  Calle
                                </Label>
                                <Input
                                  value={formData.calle}
                                  onChange={(e) => setFormData((f) => ({ ...f, calle: e.target.value }))}
                                  placeholder="Ej: San Martín"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium" style={{ color: "#020238" }}>
                                  Altura
                                </Label>
                                <Input
                                  value={formData.altura}
                                  onChange={(e) => setFormData((f) => ({ ...f, altura: e.target.value }))}
                                  placeholder="Ej: 123"
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                              <Button
                                size="sm"
                                disabled={isPending}
                                onClick={() => handleSave(a.id)}
                                style={{ backgroundColor: "#020238", color: "#FFD331" }}
                              >
                                {isPending ? "Guardando…" : "Guardar cambios"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={closeEdit}
                                disabled={isPending}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}
