import { prisma } from "@/lib/prisma"

export async function getGoogleToken(userId: string): Promise<string> {
  const rows = await prisma.$queryRaw<
    Array<{
      access_token: string | null
      refresh_token: string | null
      expires_at: number | null
    }>
  >`
    SELECT access_token, refresh_token, expires_at
    FROM accounts
    WHERE "userId" = ${userId} AND provider = 'google'
    LIMIT 1
  `

  if (rows.length === 0) {
    throw new Error("No Google account linked for this user")
  }

  const row = rows[0]
  const nowSeconds = Math.floor(Date.now() / 1000)

  // Token still valid (with 60s buffer)
  if (row.access_token && row.expires_at && row.expires_at > nowSeconds + 60) {
    return row.access_token
  }

  // Need to refresh
  if (!row.refresh_token) {
    throw new Error("No refresh token available — user must re-authenticate")
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: row.refresh_token,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Token refresh failed: ${body}`)
  }

  const data = (await res.json()) as {
    access_token: string
    expires_in: number
  }

  const newExpiresAt = nowSeconds + data.expires_in

  await prisma.$executeRaw`
    UPDATE accounts
    SET access_token = ${data.access_token}, expires_at = ${newExpiresAt}
    WHERE "userId" = ${userId} AND provider = 'google'
  `

  return data.access_token
}
