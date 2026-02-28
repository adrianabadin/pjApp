import { PrismaUserRepository } from "@/modules/users/infrastructure/PrismaUserRepository"
import ResetPasswordForm from "./ResetPasswordForm"

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return <TokenError message="Link inválido. Solicitá uno nuevo." />
  }

  const userRepo = new PrismaUserRepository()
  const user = await userRepo.findByResetToken(token)

  if (!user || !user.reset_token_expires_at || new Date() > new Date(user.reset_token_expires_at)) {
    return <TokenError message="Este link ya expiró o es inválido. Solicitá uno nuevo." />
  }

  return <ResetPasswordForm token={token} />
}

function TokenError({ message }: { message: string }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#020238" }}
    >
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-1" style={{ background: "linear-gradient(to right, #FFD331, #00B7E2)" }} />
        <div className="bg-white px-6 py-7 text-center space-y-4">
          <p className="text-sm" style={{ color: "#374151" }}>{message}</p>
          <a href="/forgot-password" className="text-sm font-medium" style={{ color: "#00B7E2" }}>
            Solicitar nuevo link →
          </a>
        </div>
      </div>
    </div>
  )
}
