import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f9fd' }}>
      <header className="px-6 py-3 flex items-center justify-between shadow-sm" style={{ backgroundColor: '#020238' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: '#FFD331', color: '#020238' }}>
            PJ
          </div>
          <div>
            <p className="font-semibold text-white text-sm leading-none">Padrón de Afiliados</p>
            <p className="text-xs mt-0.5" style={{ color: '#00B7E2' }}>Saladillo</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.6)' }}>{session.user?.email}</span>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button
              type="submit"
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)' }}
            >
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="px-4 sm:px-6 py-6">{children}</main>
    </div>
  )
}
