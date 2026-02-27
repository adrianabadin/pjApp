"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createInvitationAction } from "./actions"
import type { Invitation } from "@/modules/invitations/domain/Invitation"

function invitationStatus(inv: Invitation): { label: string; color: string } {
  if (inv.accepted_at) return { label: "Aceptada", color: "#16a34a" }
  if (new Date() > new Date(inv.expires_at)) return { label: "Expirada", color: "#9ca3af" }
  return { label: "Pendiente", color: "#00B7E2" }
}

export default function InviteForm({ invitations }: { invitations: Invitation[] }) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSent(false)
    startTransition(async () => {
      try {
        await createInvitationAction(email)
        setSent(true)
        setEmail("")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocurrió un error")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#020238" }}>
          Invitar nuevo usuario
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="invite-email" style={{ color: "#020238" }}>Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={isPending}
              style={{ backgroundColor: "#020238", color: "#FFD331" }}
            >
              {isPending ? "Enviando…" : "Invitar"}
            </Button>
          </div>
        </form>
        {sent && (
          <p className="mt-3 text-sm font-medium text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            Invitación enviada. El link expira en 24 horas.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>}
      </div>

      {/* Invitations list */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ backgroundColor: "#f0f9fd" }}>
          <h2 className="text-base font-semibold" style={{ color: "#020238" }}>
            Invitaciones enviadas
          </h2>
        </div>
        {invitations.length === 0 ? (
          <p className="px-6 py-8 text-sm text-center" style={{ color: "#6b7280" }}>
            Todavía no enviaste ninguna invitación.
          </p>
        ) : (
          <div className="divide-y">
            {invitations.map((inv) => {
              const status = invitationStatus(inv)
              return (
                <div key={inv.id} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm font-medium" style={{ color: "#020238" }}>
                    {inv.email}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: "#6b7280" }}>
                      {new Date(inv.created_at).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <Badge
                      style={{
                        backgroundColor: status.color,
                        color: status.label === "Pendiente" ? "#020238" : "#fff",
                      }}
                    >
                      {status.label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
