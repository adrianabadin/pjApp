"use client"

import { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { markAffiliateAsSeenAction, updateAffiliateContactAction, unassignAffiliateAction } from "./actions"
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
  const d = new Date(date)
  return d.toISOString().split("T")[0]
}

interface Props {
  affiliates: Affiliate[]
}

export function PendingAffiliatesTable({ affiliates }: Props) {
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
      await updateAffiliateContactAction(affiliateId, formData)
      setExpandedId(null)
    })
  }

  function handleUnassign(affiliateId: number, name: string) {
    if (!window.confirm(`¿Desasignar a ${name}? El afiliado volverá al pool sin asignar.`)) return
    startTransition(async () => {
      await unassignAffiliateAction(affiliateId)
    })
  }

  return (
    <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow style={{ backgroundColor: "#f0f9fd" }}>
            <TableHead style={{ color: "#020238" }}>Apellido y Nombre</TableHead>
            <TableHead style={{ color: "#020238" }}>DNI</TableHead>
            <TableHead style={{ color: "#020238" }}>Género</TableHead>
            <TableHead style={{ color: "#020238" }}>Fecha Nac.</TableHead>
            <TableHead style={{ color: "#020238" }}>Teléfono</TableHead>
            <TableHead style={{ color: "#020238" }}>Email</TableHead>
            <TableHead style={{ color: "#020238" }}>Calle</TableHead>
            <TableHead style={{ color: "#020238" }}>Altura</TableHead>
            <TableHead style={{ color: "#020238" }}>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {affiliates.map((a) => {
            const name = [a.apellido, a.nombres].filter(Boolean).join(", ")
            const isExpanded = expandedId === a.id

            return (
              <>
                <TableRow
                  key={a.id}
                  className="cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => (isExpanded ? closeEdit() : openEdit(a))}
                >
                  <TableCell className="font-medium text-sm">{name || "—"}</TableCell>
                  <TableCell className="text-sm">{a.dni_numero ?? "—"}</TableCell>
                  <TableCell>
                    {a.genero ? (
                      <Badge variant="outline" className="text-xs">
                        {a.genero}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {a.fecha_nacimiento
                      ? new Date(a.fecha_nacimiento).toLocaleDateString("es-AR")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{a.telefono ?? "—"}</TableCell>
                  <TableCell className="text-sm">{a.mail ?? "—"}</TableCell>
                  <TableCell className="text-sm">{a.calle ?? "—"}</TableCell>
                  <TableCell className="text-sm">{a.altura ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <form action={markAffiliateAsSeenAction.bind(null, a.id)}>
                        <Button
                          size="sm"
                          type="submit"
                          style={{ backgroundColor: "#00B7E2", color: "#020238" }}
                        >
                          Visto
                        </Button>
                      </form>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleUnassign(a.id, name)}
                        style={{ borderColor: "#dc2626", color: "#dc2626" }}
                      >
                        Desasignar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow key={`${a.id}-edit`} style={{ backgroundColor: "#f8fafc" }}>
                    <TableCell colSpan={9} className="py-4 px-6">
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium" style={{ color: "#020238" }}>
                            Teléfono
                          </Label>
                          <Input
                            value={formData.telefono}
                            onChange={(e) =>
                              setFormData((f) => ({ ...f, telefono: e.target.value }))
                            }
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
                            onChange={(e) =>
                              setFormData((f) => ({ ...f, mail: e.target.value }))
                            }
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
                            onChange={(e) =>
                              setFormData((f) => ({ ...f, fecha_nacimiento: e.target.value }))
                            }
                            className="h-8 text-sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-medium" style={{ color: "#020238" }}>
                            Calle
                          </Label>
                          <Input
                            value={formData.calle}
                            onChange={(e) =>
                              setFormData((f) => ({ ...f, calle: e.target.value }))
                            }
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
                            onChange={(e) =>
                              setFormData((f) => ({ ...f, altura: e.target.value }))
                            }
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
                          {isPending ? "Guardando…" : "Guardar"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={closeEdit} disabled={isPending}>
                          Cancelar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
