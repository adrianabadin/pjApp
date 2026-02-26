"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const result = await signIn("credentials", {
      email: form.get("email") as string,
      password: form.get("password") as string,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Credenciales inválidas")
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#020238' }}>
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: '#FFD331', color: '#020238' }}>
              PJ
            </div>
            <span className="text-xs font-medium" style={{ color: '#4a5568' }}>Partido Justicialista · Saladillo</span>
          </div>
          <CardTitle className="text-2xl font-bold">Padrón de Afiliados</CardTitle>
          <CardDescription>Ingresá tus credenciales para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              style={{ backgroundColor: '#020238', color: '#FFD331' }}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
            <div className="text-center">
              <Link href="/" className="text-xs" style={{ color: '#00B7E2' }}>
                ← Inicio
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
