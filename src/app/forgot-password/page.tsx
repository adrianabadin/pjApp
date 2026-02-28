"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { requestPasswordResetAction } from "./actions"

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = new FormData(e.currentTarget).get("email") as string
    startTransition(async () => {
      await requestPasswordResetAction(email)
      setSent(true)
    })
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#020238" }}
    >
      <div className="mb-8">
        <Image src="/logo.svg" alt="PJ Saladillo" width={240} height={75} className="w-56 sm:w-64 h-auto" priority />
      </div>

      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-1" style={{ background: "linear-gradient(to right, #FFD331, #00B7E2)" }} />
        <div className="bg-white px-6 py-7">
          <h1 className="text-xl font-bold mb-1" style={{ color: "#020238" }}>
            Olvidé mi contraseña
          </h1>

          {sent ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm" style={{ color: "#374151" }}>
                Si existe una cuenta con ese email, vas a recibir un link para restablecer tu contraseña en los próximos minutos.
              </p>
              <Link href="/login" className="block text-sm font-medium" style={{ color: "#00B7E2" }}>
                ← Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <p className="text-sm" style={{ color: "#6b7280" }}>
                Ingresá tu email y te mandamos un link para restablecer tu contraseña.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="email" style={{ color: "#020238" }}>Email</Label>
                <Input id="email" name="email" type="email" placeholder="usuario@ejemplo.com" required disabled={isPending} />
              </div>
              <Button type="submit" className="w-full" disabled={isPending} style={{ backgroundColor: "#020238", color: "#FFD331" }}>
                {isPending ? "Enviando…" : "Enviar link"}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-xs" style={{ color: "#00B7E2" }}>
                  ← Volver al login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
        Partido Justicialista · Saladillo
      </p>
    </div>
  )
}
