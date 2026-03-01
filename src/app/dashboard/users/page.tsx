import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { userRepo } from "@/lib/di"
import { UsersTable } from "./UsersTable"

export default async function UsersPage() {
  const session = await auth()
  if (session?.user?.role !== "admin") redirect("/dashboard")

  const users = await userRepo.findAll()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#020238" }}>
          Gestión de Usuarios
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
          Administrá los roles de los operadores del sistema.
        </p>
      </div>
      <UsersTable users={users} currentUserId={session.user.id} />
    </div>
  )
}
