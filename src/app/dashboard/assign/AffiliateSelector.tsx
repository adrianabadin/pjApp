"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Affiliate } from "@/modules/affiliates/domain/Affiliate"
import { assignSelectedAffiliatesAction } from "./actions"
import { updateAnyAffiliateContactAction } from "../../dashboard/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface AffiliateSelectorProps {
  affiliates: Affiliate[]
  unassignedCount: number
}

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

export default function AffiliateSelector({ affiliates, unassignedCount }: AffiliateSelectorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [apellidoFilter, setApellidoFilter] = useState("")
  const [nombresFilter, setNombresFilter] = useState("")
  const [dniFilter, setDniFilter] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EditFormData>({
    telefono: "",
    mail: "",
    calle: "",
    altura: "",
    fecha_nacimiento: "",
  })

  const filtered = useMemo(() => {
    const ap = apellidoFilter.trim().toLowerCase()
    const nm = nombresFilter.trim().toLowerCase()
    const dn = dniFilter.trim()
    return affiliates.filter((a) => {
      if (ap && !a.apellido?.toLowerCase().includes(ap)) return false
      if (nm && !a.nombres?.toLowerCase().includes(nm)) return false
      if (dn && !a.dni_numero?.includes(dn)) return false
      return true
    })
  }, [affiliates, apellidoFilter, nombresFilter, dniFilter])

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id))

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((a) => next.delete(a.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((a) => next.add(a.id))
        return next
      })
    }
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleAssign() {
    const ids = Array.from(selectedIds)
    startTransition(async () => {
      await assignSelectedAffiliatesAction(ids)
      setSelectedIds(new Set())
      router.refresh()
    })
  }

  function openEdit(a: Affiliate) {
    setEditingId(a.id)
    setEditForm({
      telefono: a.telefono ?? "",
      mail: a.mail ?? "",
      calle: a.calle ?? "",
      altura: a.altura ?? "",
      fecha_nacimiento: toDateInputValue(a.fecha_nacimiento),
    })
  }

  function closeEdit() {
    setEditingId(null)
  }

  function handleSaveEdit(affiliateId: number) {
    startTransition(async () => {
      await updateAnyAffiliateContactAction(affiliateId, editForm)
      setEditingId(null)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats header */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 rounded-lg text-sm"
        style={{ backgroundColor: "#f0f9fd" }}
      >
        <span style={{ color: "#020238" }}>Sin asignar:</span>
        <Badge style={{ backgroundColor: "#020238", color: "#FFD331" }}>
          {unassignedCount.toLocaleString("es-AR")}
        </Badge>
        <span className="ml-auto text-xs" style={{ color: "#4a5568" }}>
          {filtered.length !== affiliates.length
            ? `${filtered.length} de ${affiliates.length} visibles`
            : `${affiliates.length} cargados`}
        </span>
      </div>

      {/* Filters — stacked on mobile, row on md+ */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "#020238" }}>
            Apellido
          </label>
          <Input
            placeholder="Filtrar apellido…"
            value={apellidoFilter}
            onChange={(e) => setApellidoFilter(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "#020238" }}>
            Nombres
          </label>
          <Input
            placeholder="Filtrar nombres…"
            value={nombresFilter}
            onChange={(e) => setNombresFilter(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "#020238" }}>
            DNI
          </label>
          <Input
            placeholder="Filtrar DNI…"
            value={dniFilter}
            onChange={(e) => setDniFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Select-all shortcut */}
      <div
        role="button"
        tabIndex={0}
        onClick={toggleSelectAll}
        onKeyDown={(e) => e.key === "Enter" && toggleSelectAll()}
        className="flex items-center gap-2 text-sm w-fit transition-opacity hover:opacity-70 cursor-pointer"
        style={{ color: "#00B7E2" }}
      >
        <Checkbox
          checked={allVisibleSelected}
          onCheckedChange={toggleSelectAll}
          aria-hidden
        />
        {allVisibleSelected
          ? "Deseleccionar todos los visibles"
          : `Seleccionar todos los visibles (${filtered.length})`}
      </div>

      {/* Card list */}
      <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 380px)", minHeight: 120 }}>
        {filtered.length === 0 ? (
          <div
            className="flex items-center justify-center py-12 text-sm rounded-lg border border-dashed"
            style={{ color: "#4a5568" }}
          >
            No se encontraron afiliados con los filtros aplicados.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((a) => {
              const selected = selectedIds.has(a.id)
              const isEditing = editingId === a.id
              return (
                <div key={a.id} className="flex flex-col">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleOne(a.id)}
                    onKeyDown={(e) => e.key === "Enter" && toggleOne(a.id)}
                    className="w-full text-left rounded-xl border px-4 py-3 transition-all active:scale-[0.99] cursor-pointer"
                    style={{
                      backgroundColor: selected ? "#fffbea" : "#fff",
                      borderColor: selected ? "#FFD331" : "#e5e7eb",
                      boxShadow: selected
                        ? "0 0 0 2px #FFD33140"
                        : "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: name block */}
                      <div className="min-w-0">
                        <p
                          className="font-semibold text-sm leading-tight truncate"
                          style={{ color: "#020238" }}
                        >
                          {a.apellido ?? "—"}, {a.nombres ?? "—"}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                          <span className="flex items-center gap-1 text-xs" style={{ color: "#4a5568" }}>
                            <span className="font-medium" style={{ color: "#6b7280" }}>DNI</span>
                            <span className="font-mono">{a.dni_numero ?? "—"}</span>
                          </span>
                          {a.telefono && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: "#4a5568" }}>
                              <span className="font-medium" style={{ color: "#6b7280" }}>Tel.</span>
                              <span>{a.telefono}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: edit button + checkbox */}
                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={(e) => {
                            e.stopPropagation()
                            isEditing ? closeEdit() : openEdit(a)
                          }}
                          className="h-7 w-7 p-0 text-base"
                          title="Editar contacto"
                        >
                          {isEditing ? "✕" : "✎"}
                        </Button>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleOne(a.id)}
                            aria-label={`Seleccionar ${a.apellido}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inline edit panel */}
                  {isEditing && (
                    <div
                      className="rounded-b-xl border border-t-0 px-4 py-4"
                      style={{ backgroundColor: "#f8fafc", borderColor: "#e5e7eb" }}
                    >
                      <p className="text-xs font-semibold mb-3" style={{ color: "#020238" }}>
                        Editando: {a.apellido}, {a.nombres}
                      </p>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium" style={{ color: "#020238" }}>
                            Teléfono
                          </Label>
                          <Input
                            value={editForm.telefono}
                            onChange={(e) => setEditForm((f) => ({ ...f, telefono: e.target.value }))}
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
                            value={editForm.mail}
                            onChange={(e) => setEditForm((f) => ({ ...f, mail: e.target.value }))}
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
                            value={editForm.fecha_nacimiento}
                            onChange={(e) => setEditForm((f) => ({ ...f, fecha_nacimiento: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium" style={{ color: "#020238" }}>
                            Calle
                          </Label>
                          <Input
                            value={editForm.calle}
                            onChange={(e) => setEditForm((f) => ({ ...f, calle: e.target.value }))}
                            placeholder="Ej: San Martín"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium" style={{ color: "#020238" }}>
                            Altura
                          </Label>
                          <Input
                            value={editForm.altura}
                            onChange={(e) => setEditForm((f) => ({ ...f, altura: e.target.value }))}
                            placeholder="Ej: 123"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleSaveEdit(a.id)}
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
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div
        className="sticky bottom-0 -mx-6 px-6 py-3 flex items-center justify-between gap-3 border-t"
        style={{ backgroundColor: "#fff", boxShadow: "0 -2px 12px rgba(0,0,0,0.07)" }}
      >
        <span className="text-sm font-medium" style={{ color: "#020238" }}>
          {selectedIds.size > 0 ? (
            <>
              <span
                className="inline-flex items-center justify-center rounded-full text-xs font-bold mr-1.5 px-1.5 py-0.5"
                style={{ backgroundColor: "#FFD331", color: "#020238" }}
              >
                {selectedIds.size}
              </span>
              seleccionado{selectedIds.size !== 1 ? "s" : ""}
            </>
          ) : (
            <span style={{ color: "#9ca3af" }}>Ninguno seleccionado</span>
          )}
        </span>
        <Button
          onClick={handleAssign}
          disabled={selectedIds.size === 0 || isPending}
          style={{ backgroundColor: "#020238", color: "#FFD331" }}
        >
          {isPending ? "Asignando…" : "Asignar"}
        </Button>
      </div>
    </div>
  )
}
