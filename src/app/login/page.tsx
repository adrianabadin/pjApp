"use client"

import { useState, useTransition, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resetOk = searchParams.get("reset") === "ok"

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const form = new FormData(e.currentTarget)
      const result = await signIn("credentials", {
        email: form.get("email") as string,
        password: form.get("password") as string,
        redirect: false,
      })
      if (result?.error) {
        setError("Credenciales inválidas")
      } else {
        router.push("/dashboard")
        router.refresh()
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
          alt="Partido Justicialista Saladillo"
          width={240}
          height={75}
          className="w-56 sm:w-64 h-auto"
          priority
        />
      </div>

      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-1" style={{ background: "linear-gradient(to right, #FFD331, #00B7E2)" }} />

        <div className="bg-white px-6 py-7">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold leading-tight" style={{ color: "#020238" }}>
                Padrón de Afiliados
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
                Ingresá para continuar
              </p>
            </div>
            <Image
              src="/arg.svg"
              alt=""
              width={52}
              height={78}
              className="h-16 w-auto -mb-1 opacity-90"
              aria-hidden
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" style={{ color: "#020238" }}>Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" style={{ color: "#020238" }}>Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={isPending}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}

            {resetOk && (
              <p className="text-sm font-medium bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                Contraseña actualizada. Podés ingresar con tu nueva contraseña.
              </p>
            )}

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={isPending}
              style={{ backgroundColor: "#020238", color: "#FFD331" }}
            >
              {isPending ? "Ingresando…" : "Ingresar"}
            </Button>

            <div className="text-center">
              <Link href="/forgot-password" className="text-xs" style={{ color: "#6b7280" }}>
                Olvidé mi contraseña
              </Link>
            </div>
          </form>
        </div>
      </div>

      <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
        Partido Justicialista · Saladillo
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
