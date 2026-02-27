"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { registerAction } from "./actions"

export default function RegisterForm({
  token,
  email,
}: {
  token: string
  email: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    const name = form.get("name") as string
    const password = form.get("password") as string
    const confirm = form.get("confirm") as string

    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      return
    }

    startTransition(async () => {
      try {
        await registerAction(token, name, password)
        router.push("/login")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocurrió un error")
      }
    })
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#020238" }}
    >
      <div className="mb-8">
        <Image
          src="/logo.svg"
          alt="PJ Saladillo"
          width={240}
          height={75}
          className="w-56 sm:w-64 h-auto"
          priority
        />
      </div>

      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div
          className="h-1"
          style={{ background: "linear-gradient(to right, #FFD331, #00B7E2)" }}
        />
        <div className="bg-white px-6 py-7">
          <h1 className="text-xl font-bold mb-1" style={{ color: "#020238" }}>
            Crear cuenta
          </h1>
          <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
            Completá tus datos para activar tu acceso.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" style={{ color: "#020238" }}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" style={{ color: "#020238" }}>
                Nombre
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Tu nombre completo"
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" style={{ color: "#020238" }}>
                Contraseña
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" style={{ color: "#020238" }}>
                Confirmar contraseña
              </Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                minLength={8}
                required
                disabled={isPending}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
              style={{ backgroundColor: "#020238", color: "#FFD331" }}
            >
              {isPending ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
          </form>
        </div>
      </div>

      <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
        Partido Justicialista · Saladillo
      </p>
    </div>
  )
}
