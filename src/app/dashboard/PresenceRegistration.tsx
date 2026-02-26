"use client"

import { useActionState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Affiliate } from "@/modules/affiliates/domain/Affiliate"
import {
  lookupAffiliateByDniAction,
  confirmPresenceByDniAction,
} from "./actions"

type LookupState = {
  affiliate: Affiliate | null
  error: string | null
}

type ConfirmState = {
  success: boolean
  error: string | null
  affiliateName?: string
}

export function PresenceRegistration() {
  const [lookupState, lookupAction, lookupPending] = useActionState<LookupState, FormData>(
    lookupAffiliateByDniAction,
    { affiliate: null, error: null }
  )
  const [confirmState, confirmAction, confirmPending] = useActionState<ConfirmState, FormData>(
    confirmPresenceByDniAction,
    { success: false, error: null }
  )

  const affiliate = lookupState.affiliate

  return (
    <div className="rounded-xl border p-6 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#FFD331', color: '#020238' }}>
          ✓
        </div>
        <h2 className="text-base font-semibold" style={{ color: '#020238' }}>
          Registrar Presencia
        </h2>
      </div>

      {/* Lookup form */}
      <form action={lookupAction} className="flex gap-2 mb-4">
        <Input
          name="dni"
          type="text"
          placeholder="Ingresá el DNI del afiliado"
          className="max-w-xs"
          defaultValue=""
          disabled={lookupPending}
        />
        <Button
          type="submit"
          disabled={lookupPending}
          style={{ backgroundColor: '#020238', color: '#FFD331' }}
        >
          {lookupPending ? "Buscando..." : "Buscar"}
        </Button>
      </form>

      {lookupState.error && (
        <p className="text-sm text-red-600 mb-3">{lookupState.error}</p>
      )}

      {/* Affiliate info card */}
      {affiliate && !confirmState.success && (
        <div className="rounded-lg border p-4 mb-4" style={{ borderColor: '#00B7E2', backgroundColor: '#f0f9fd' }}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-sm" style={{ color: '#020238' }}>
                {[affiliate.apellido, affiliate.nombres].filter(Boolean).join(", ")}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#4a5568' }}>
                DNI {affiliate.dni_numero} · {affiliate.genero ?? "—"}
              </p>
            </div>
            <Badge
              variant={affiliate.is_seen ? "secondary" : "outline"}
              className="text-xs"
            >
              {affiliate.is_seen ? "Ya presente" : "Pendiente"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-4" style={{ color: '#4a5568' }}>
            {affiliate.fecha_nacimiento && (
              <span>Nac: {new Date(affiliate.fecha_nacimiento).toLocaleDateString("es-AR")}</span>
            )}
            {affiliate.telefono && <span>Tel: {affiliate.telefono}</span>}
            {affiliate.mail && <span className="col-span-2">Email: {affiliate.mail}</span>}
          </div>

          {!affiliate.is_seen && (
            <form action={confirmAction}>
              <input type="hidden" name="dni" value={affiliate.dni_numero ?? ""} />
              <Button
                type="submit"
                disabled={confirmPending}
                className="w-full sm:w-auto"
                style={{ backgroundColor: '#020238', color: '#FFD331' }}
              >
                {confirmPending ? "Confirmando..." : "Confirmar Presencia"}
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Success state */}
      {confirmState.success && (
        <div className="rounded-lg border p-3 text-sm font-medium" style={{ borderColor: '#00B7E2', backgroundColor: '#e8f7fc', color: '#020238' }}>
          ✓ Presencia confirmada para {confirmState.affiliateName}
        </div>
      )}

      {confirmState.error && (
        <p className="text-sm text-red-600 mt-2">{confirmState.error}</p>
      )}
    </div>
  )
}
