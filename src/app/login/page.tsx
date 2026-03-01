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
  const noAccount = searchParams.get("error") === "NoAccount"

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isGooglePending, startGoogleTransition] = useTransition()

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

  function handleGoogleSignIn() {
    startGoogleTransition(async () => {
      await signIn("google", { callbackUrl: "/dashboard" })
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

            {noAccount && (
              <p className="text-sm font-medium bg-red-50 text-red-700 px-3 py-2 rounded-lg">
                Tu email no está registrado en el sistema.
              </p>
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

          {/* Divider */}
          <div className="flex items-center my-4 gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs" style={{ color: "#6b7280" }}>o</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google sign-in button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGooglePending}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-60"
            style={{ borderColor: "#d1d5db", color: "#374151" }}
          >
            {/* Google SVG icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              />
            </svg>
            {isGooglePending ? "Redirigiendo…" : "Continuar con Google"}
          </button>
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
