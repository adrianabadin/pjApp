import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to,
    subject: "Restablecer contraseña — PJ Saladillo",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#020238">Restablecer contraseña</h2>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 24px;background:#020238;color:#FFD331;text-decoration:none;border-radius:8px;font-weight:bold">
            Restablecer contraseña
          </a>
        </p>
        <p style="color:#6b7280;font-size:14px">
          Este link expira en <strong>1 hora</strong>.<br>
          Si no solicitaste este cambio, podés ignorar este email.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb">
        <p style="color:#9ca3af;font-size:12px">Partido Justicialista · Saladillo</p>
      </div>
    `,
  })
  if (error) throw new Error(`Error enviando email de recuperación: ${error.message}`)
}

export async function sendInvitationEmail(to: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const registerUrl = `${baseUrl}/register?token=${token}`

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to,
    subject: "Invitación al sistema — PJ Saladillo",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#020238">Te invitaron al sistema</h2>
        <p>Fuiste invitado a acceder al Padrón de Afiliados del Partido Justicialista de Saladillo.</p>
        <p>
          <a href="${registerUrl}"
             style="display:inline-block;padding:12px 24px;background:#020238;color:#FFD331;text-decoration:none;border-radius:8px;font-weight:bold">
            Crear mi cuenta
          </a>
        </p>
        <p style="color:#6b7280;font-size:14px">
          Este link expira en <strong>24 horas</strong>.<br>
          Si no esperabas esta invitación, podés ignorar este email.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb">
        <p style="color:#9ca3af;font-size:12px">Partido Justicialista · Saladillo</p>
      </div>
    `,
  })
  if (error) throw new Error(`Error enviando invitación: ${error.message}`)
}
