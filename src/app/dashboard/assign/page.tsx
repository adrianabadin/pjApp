import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { affiliateRepo } from "@/lib/di"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { revalidatePath } from "next/cache"
import Link from "next/link"

async function assignBatchAction(formData: FormData) {
  "use server"
  const { auth: getAuth } = await import("@/lib/auth")
  const session = await getAuth()
  if (!session?.user?.id) return

  const count = Math.min(Number(formData.get("count")) || 100, 500)
  const { affiliateRepo: repo } = await import("@/lib/di")
  await repo.assignNextBatch(count, session.user.id)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/assign")
}

export default async function AssignPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const unassignedCount = await affiliateRepo.countUnassigned()

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm"
          style={{ color: '#00B7E2' }}
        >
          ← Volver al dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ color: '#020238' }}>Asignar Afiliados</CardTitle>
          <CardDescription>
            Asigná afiliados sin asignar a tu usuario para trabajar con ellos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: '#f0f9fd' }}>
            <span className="text-sm" style={{ color: '#020238' }}>
              Afiliados sin asignar:
            </span>
            <Badge style={{ backgroundColor: '#020238', color: '#FFD331' }}>
              {unassignedCount.toLocaleString("es-AR")}
            </Badge>
          </div>

          {unassignedCount === 0 ? (
            <p className="text-sm" style={{ color: '#4a5568' }}>
              Todos los afiliados ya están asignados.
            </p>
          ) : (
            <form action={assignBatchAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="count">¿Cuántos afiliados asignar?</Label>
                <Input
                  id="count"
                  name="count"
                  type="number"
                  min={1}
                  max={Math.min(unassignedCount, 500)}
                  defaultValue={Math.min(100, unassignedCount)}
                />
                <p className="text-xs" style={{ color: '#4a5568' }}>
                  Máximo 500 por vez. Se asignan en orden de código de afiliado.
                </p>
              </div>
              <Button
                type="submit"
                style={{ backgroundColor: '#020238', color: '#FFD331' }}
              >
                Asignar afiliados
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
