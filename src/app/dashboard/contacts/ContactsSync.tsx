"use client"

import { useState, useTransition, useMemo } from "react"
import type { Affiliate } from "@/modules/affiliates/domain/Affiliate"
import { syncAffiliatesAction } from "./actions"

interface Props {
  affiliates: Affiliate[]
}

export function ContactsSync({ affiliates }: Props) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [result, setResult] = useState<{ synced: number; errors: string[] } | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return affiliates
    return affiliates.filter(
      (a) =>
        a.apellido?.toLowerCase().includes(q) ||
        a.nombres?.toLowerCase().includes(q)
    )
  }, [affiliates, search])

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((a) => selected.has(a.id))

  function toggleAll() {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        filtered.forEach((a) => next.delete(a.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        filtered.forEach((a) => next.add(a.id))
        return next
      })
    }
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSync(ids: number[] | "all") {
    setResult(null)
    startTransition(async () => {
      const res = await syncAffiliatesAction(ids)
      setResult(res)
    })
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <input
          type="text"
          placeholder="Buscar por apellido o nombres…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-2"
          style={{ borderColor: "#020238", focusRingColor: "#FFD331" } as React.CSSProperties}
        />
        <div className="flex items-center gap-2 text-sm" style={{ color: "#020238" }}>
          <span className="font-medium">
            {selected.size} de {affiliates.length} seleccionados
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#020238" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "#020238", color: "#fff" }}>
              <th className="px-3 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAll}
                  className="rounded"
                  style={{ accentColor: "#FFD331" }}
                />
              </th>
              <th className="px-3 py-3 text-left font-semibold">Apellido</th>
              <th className="px-3 py-3 text-left font-semibold">Nombres</th>
              <th className="px-3 py-3 text-left font-semibold">Teléfono</th>
              <th className="px-3 py-3 text-left font-semibold">Email</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  Sin resultados
                </td>
              </tr>
            )}
            {filtered.map((a, idx) => (
              <tr
                key={a.id}
                className="cursor-pointer transition-colors"
                style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#f8f8ff" }}
                onClick={() => toggleOne(a.id)}
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(a.id)}
                    onChange={() => toggleOne(a.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ accentColor: "#FFD331" }}
                  />
                </td>
                <td className="px-3 py-2 font-medium" style={{ color: "#020238" }}>
                  {a.apellido ?? "—"}
                </td>
                <td className="px-3 py-2">{a.nombres ?? "—"}</td>
                <td className="px-3 py-2 text-gray-500">{a.telefono ?? "—"}</td>
                <td className="px-3 py-2 text-gray-500">{a.mail ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => handleSync([...selected])}
          disabled={isPending || selected.size === 0}
          className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#020238", color: "#FFD331" }}
        >
          {isPending ? "Sincronizando…" : `Sincronizar Seleccionados (${selected.size})`}
        </button>
        <button
          onClick={() => handleSync("all")}
          disabled={isPending}
          className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#FFD331", color: "#020238" }}
        >
          {isPending ? "Sincronizando…" : `Sincronizar Todos (${affiliates.length})`}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className="rounded-lg px-4 py-3 text-sm font-medium"
          style={{
            backgroundColor: result.errors.length === 0 ? "#ecfdf5" : "#fef2f2",
            color: result.errors.length === 0 ? "#166534" : "#991b1b",
            border: `1px solid ${result.errors.length === 0 ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {result.errors.length === 0 ? (
            <span>Se sincronizaron {result.synced} contactos correctamente.</span>
          ) : (
            <div className="space-y-1">
              <div>Se sincronizaron {result.synced} contactos con {result.errors.length} error(es):</div>
              {result.errors.map((e, i) => (
                <div key={i} className="text-xs opacity-80">{e}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
