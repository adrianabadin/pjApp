import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { invitationRepo } from "@/lib/di"
import InviteForm from "./InviteForm"

export default async function InvitePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const invitations = await invitationRepo.findAllByInviter(session.user.id)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "#020238" }}>
          Invitar usuarios
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
          Solo los usuarios invitados pueden registrarse en el sistema.
        </p>
      </div>
      <InviteForm invitations={invitations} />
    </div>
  )
}
