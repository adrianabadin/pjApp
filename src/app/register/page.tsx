import { invitationRepo } from "@/lib/di"
import RegisterForm from "./RegisterForm"

function InvalidInvitation() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#020238" }}
    >
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div
          className="h-1"
          style={{ background: "linear-gradient(to right, #FFD331, #00B7E2)" }}
        />
        <div className="bg-white px-6 py-8 text-center">
          <h1 className="text-xl font-bold mb-2" style={{ color: "#020238" }}>
            Invitación inválida
          </h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Este link de invitación no es válido o ya expiró. Pedile a tu administrador que te envíe una nueva invitación.
          </p>
        </div>
      </div>
    </div>
  )
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) return <InvalidInvitation />

  const invitation = await invitationRepo.findByToken(token)

  if (
    !invitation ||
    invitation.accepted_at ||
    new Date() > new Date(invitation.expires_at)
  ) {
    return <InvalidInvitation />
  }

  return <RegisterForm token={token} email={invitation.email} />
}
