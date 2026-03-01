"use client"

import { useTransition } from "react"
import { toggleUserRoleAction } from "./actions"
import type { User } from "@/modules/users/domain/User"

interface Props {
  users: User[]
  currentUserId: string
}

export function UsersTable({ users, currentUserId }: Props) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: "#020238" }}>
            <th className="text-left px-4 py-3 font-semibold text-white">Email</th>
            <th className="text-left px-4 py-3 font-semibold text-white hidden sm:table-cell">Nombre</th>
            <th className="text-left px-4 py-3 font-semibold text-white">Rol</th>
            <th className="text-left px-4 py-3 font-semibold text-white hidden md:table-cell">Creado</th>
            <th className="text-right px-4 py-3 font-semibold text-white">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UserRow({ user, isSelf }: { user: User; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition()
  const isAdmin = user.role === "admin"
  const newRole = isAdmin ? "operator" : "admin"

  function handleToggle() {
    startTransition(async () => {
      await toggleUserRoleAction(user.id, newRole)
    })
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-gray-800">{user.email}</td>
      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
        {user.name ?? <span className="text-gray-400 italic">—</span>}
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
          style={
            isAdmin
              ? { backgroundColor: "#FFD331", color: "#020238" }
              : { backgroundColor: "#e5e7eb", color: "#374151" }
          }
        >
          {isAdmin ? "Admin" : "Operador"}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
        {user.created_at.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={handleToggle}
          disabled={isSelf || isPending}
          className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            borderColor: "#020238",
            color: "#020238",
          }}
          title={isSelf ? "No podés cambiar tu propio rol" : undefined}
        >
          {isPending
            ? "Guardando…"
            : isAdmin
            ? "Quitar Admin"
            : "Hacer Admin"}
        </button>
      </td>
    </tr>
  )
}
