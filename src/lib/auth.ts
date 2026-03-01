import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { authenticateUser, userRepo } from "@/lib/di"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const user = await authenticateUser.execute(
            credentials.email as string,
            credentials.password as string
          )
          return { id: user.id, email: user.email, name: user.name, role: user.role }
        } catch {
          return null
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      // Credentials are already validated in authorize()
      if (account?.provider === "credentials") return true

      // Google: only allow users already registered in the system
      if (account?.provider === "google") {
        const existing = await userRepo.findByEmail(user.email!)
        if (!existing) return "/login?error=NoAccount"

        // Upsert the OAuth account link and store tokens
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          create: {
            id: crypto.randomUUID(),
            userId: existing.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token ?? null,
            refresh_token: account.refresh_token ?? null,
            expires_at: account.expires_at ?? null,
            token_type: account.token_type ?? null,
            scope: account.scope ?? null,
            id_token: account.id_token ?? null,
          },
          update: {
            access_token: account.access_token ?? null,
            refresh_token: account.refresh_token ?? null,
            expires_at: account.expires_at ?? null,
            id_token: account.id_token ?? null,
          },
        })

        // Propagate id and role into the user object for jwt callback
        user.id = existing.id
        user.role = existing.role
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user.role ?? "operator") as string
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
