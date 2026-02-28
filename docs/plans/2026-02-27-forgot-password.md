# Forgot Password Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to reset their password via a secure email link using Resend.

**Architecture:** Token (32-byte random hex) stored on the `User` row with 1h expiry. Three new pages: `/forgot-password`, `/reset-password`. Email sent via Resend SDK. Server actions handle all mutations.

**Tech Stack:** Next.js 16 server actions, Resend SDK, bcryptjs, Prisma, TypeScript

---

## Task 1: Install Resend and update schema

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/modules/users/domain/User.ts`

**Step 1: Install Resend**

```bash
npm install resend
```

Expected: `resend` appears in `package.json` dependencies.

**Step 2: Add reset token fields to User model in `prisma/schema.prisma`**

Add inside the `User` model (after `created_at`):

```prisma
  reset_token            String?   @unique
  reset_token_expires_at DateTime?
```

**Step 3: Run migration**

```bash
npx prisma migrate dev --name add-reset-token-to-users
```

Expected: new migration file created, DB updated.

**Step 4: Update `src/modules/users/domain/User.ts`**

```typescript
export interface User {
  id: string
  email: string
  password_hash: string
  name: string | null
  role: string
  created_at: Date
  reset_token: string | null
  reset_token_expires_at: Date | null
}
```

**Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 2: Extend UserRepository with reset token methods

**Files:**
- Modify: `src/modules/users/domain/UserRepository.ts`
- Modify: `src/modules/users/infrastructure/PrismaUserRepository.ts`

**Step 1: Add methods to `src/modules/users/domain/UserRepository.ts`**

```typescript
import type { User } from "./User"

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  create(data: { email: string; password_hash: string; name?: string }): Promise<User>
  saveResetToken(userId: string, token: string, expiresAt: Date): Promise<void>
  findByResetToken(token: string): Promise<User | null>
  updatePassword(userId: string, passwordHash: string): Promise<void>
}
```

Note: `updatePassword` also clears `reset_token` and `reset_token_expires_at`.

**Step 2: Implement in `src/modules/users/infrastructure/PrismaUserRepository.ts`**

Add three methods to the class:

```typescript
async saveResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
  await prisma.$executeRaw`
    UPDATE users SET reset_token = ${token}, reset_token_expires_at = ${expiresAt}
    WHERE id = ${userId}
  `
}

async findByResetToken(token: string): Promise<User | null> {
  const rows = await prisma.$queryRaw<User[]>`
    SELECT id, email, password_hash, name, role, created_at,
           reset_token, reset_token_expires_at
    FROM users WHERE reset_token = ${token} LIMIT 1
  `
  return rows[0] ?? null
}

async updatePassword(userId: string, passwordHash: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE users
    SET password_hash = ${passwordHash},
        reset_token = NULL,
        reset_token_expires_at = NULL
    WHERE id = ${userId}
  `
}
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 3: Update test mocks

**Files:**
- Modify: `src/__tests__/unit/users/authenticateUser.test.ts`
- Modify: `src/__tests__/unit/users/createUser.test.ts`

**Step 1: In both test files, add the three new methods to `makeRepo()`**

Find each `makeRepo()` function and add after `create: vi.fn()`:

```typescript
saveResetToken: vi.fn().mockResolvedValue(undefined),
findByResetToken: vi.fn().mockResolvedValue(null),
updatePassword: vi.fn().mockResolvedValue(undefined),
```

**Step 2: Run tests to confirm they still pass**

```bash
npx vitest run
```

Expected: 52 tests pass.

---

## Task 4: Create email utility

**Files:**
- Create: `src/lib/email.ts`

**Step 1: Add `RESEND_FROM_EMAIL` to `.env`**

```
RESEND_FROM_EMAIL="onboarding@resend.dev"
```

Note: for production with a verified domain, change to e.g. `"PJ Saladillo <noreply@tudominio.com>"`.

**Step 2: Create `src/lib/email.ts`**

```typescript
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  await resend.emails.send({
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
}
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

---

## Task 5: Forgot password page + action

**Files:**
- Create: `src/app/forgot-password/page.tsx`
- Create: `src/app/forgot-password/actions.ts`

**Step 1: Create `src/app/forgot-password/actions.ts`**

```typescript
"use server"

import crypto from "crypto"
import { PrismaUserRepository } from "@/modules/users/infrastructure/PrismaUserRepository"
import { sendPasswordResetEmail } from "@/lib/email"

const userRepo = new PrismaUserRepository()

export async function requestPasswordResetAction(email: string): Promise<void> {
  const user = await userRepo.findByEmail(email)

  // Always succeed — never reveal whether an email exists
  if (!user) return

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await userRepo.saveResetToken(user.id, token, expiresAt)
  await sendPasswordResetEmail(user.email, token)
}
```

**Step 2: Create `src/app/forgot-password/page.tsx`**

```tsx
"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { requestPasswordResetAction } from "./actions"

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = new FormData(e.currentTarget).get("email") as string
    startTransition(async () => {
      await requestPasswordResetAction(email)
      setSent(true)
    })
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#020238" }}
    >
      <div className="mb-8">
        <Image src="/logo.svg" alt="PJ Saladillo" width={240} height={75} className="w-56 sm:w-64 h-auto" priority />
      </div>

      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-1" style={{ background: "linear-gradient(to right, #FFD331, #00B7E2)" }} />
        <div className="bg-white px-6 py-7">
          <h1 className="text-xl font-bold mb-1" style={{ color: "#020238" }}>
            Olvidé mi contraseña
          </h1>

          {sent ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm" style={{ color: "#374151" }}>
                Si existe una cuenta con ese email, vas a recibir un link para restablecer tu contraseña en los próximos minutos.
              </p>
              <Link href="/login" className="block text-sm font-medium" style={{ color: "#00B7E2" }}>
                ← Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <p className="text-sm" style={{ color: "#6b7280" }}>
                Ingresá tu email y te mandamos un link para restablecer tu contraseña.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="email" style={{ color: "#020238" }}>Email</Label>
                <Input id="email" name="email" type="email" placeholder="usuario@ejemplo.com" required disabled={isPending} />
              </div>
              <Button type="submit" className="w-full" disabled={isPending} style={{ backgroundColor: "#020238", color: "#FFD331" }}>
                {isPending ? "Enviando…" : "Enviar link"}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-xs" style={{ color: "#00B7E2" }}>
                  ← Volver al login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
        Partido Justicialista · Saladillo
      </p>
    </div>
  )
}
```

---

## Task 6: Reset password page + action

**Files:**
- Create: `src/app/reset-password/page.tsx`
- Create: `src/app/reset-password/actions.ts`

**Step 1: Create `src/app/reset-password/actions.ts`**

```typescript
"use server"

import bcrypt from "bcryptjs"
import { PrismaUserRepository } from "@/modules/users/infrastructure/PrismaUserRepository"

const userRepo = new PrismaUserRepository()

export async function resetPasswordAction(token: string, newPassword: string): Promise<void> {
  const user = await userRepo.findByResetToken(token)

  if (!user || !user.reset_token_expires_at) {
    throw new Error("Token inválido o expirado")
  }

  if (new Date() > new Date(user.reset_token_expires_at)) {
    throw new Error("Token inválido o expirado")
  }

  if (newPassword.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres")
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await userRepo.updatePassword(user.id, passwordHash)
}
```

**Step 2: Create `src/app/reset-password/page.tsx`**

This is a server component that pre-validates the token, then renders the client form.

```tsx
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
```

**Step 3: Create `src/app/reset-password/ResetPasswordForm.tsx`**

```tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { resetPasswordAction } from "./actions"

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    const password = form.get("password") as string
    const confirm = form.get("confirm") as string

    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      return
    }

    startTransition(async () => {
      try {
        await resetPasswordAction(token, password)
        router.push("/login?reset=ok")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocurrió un error")
      }
    })
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#020238" }}
    >
      <div className="mb-8">
        <Image src="/logo.svg" alt="PJ Saladillo" width={240} height={75} className="w-56 sm:w-64 h-auto" priority />
      </div>

      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-1" style={{ background: "linear-gradient(to right, #FFD331, #00B7E2)" }} />
        <div className="bg-white px-6 py-7">
          <h1 className="text-xl font-bold mb-1" style={{ color: "#020238" }}>Nueva contraseña</h1>
          <p className="text-sm mb-4" style={{ color: "#6b7280" }}>Ingresá tu nueva contraseña (mínimo 8 caracteres).</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" style={{ color: "#020238" }}>Nueva contraseña</Label>
              <Input id="password" name="password" type="password" minLength={8} required disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm" style={{ color: "#020238" }}>Confirmar contraseña</Label>
              <Input id="confirm" name="confirm" type="password" minLength={8} required disabled={isPending} />
            </div>
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
            <Button type="submit" className="w-full" disabled={isPending} style={{ backgroundColor: "#020238", color: "#FFD331" }}>
              {isPending ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </form>
        </div>
      </div>

      <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
        Partido Justicialista · Saladillo
      </p>
    </div>
  )
}
```

---

## Task 7: Add "Olvidé mi contraseña" link to login + success message

**Files:**
- Modify: `src/app/login/page.tsx`

**Step 1: Add `useSearchParams` to read `?reset=ok`, and add the link**

Add to the imports:
```tsx
import { useSearchParams } from "next/navigation"
```

Add inside the component, after the existing state declarations:
```tsx
const searchParams = useSearchParams()
const resetOk = searchParams.get("reset") === "ok"
```

After the `{error && ...}` block and before the submit button, add the success banner:
```tsx
{resetOk && (
  <p className="text-sm text-green-700 font-medium bg-green-50 px-3 py-2 rounded-lg">
    Contraseña actualizada. Podés ingresar con tu nueva contraseña.
  </p>
)}
```

After the submit `<Button>`, add the forgot link:
```tsx
<div className="text-center">
  <Link href="/forgot-password" className="text-xs" style={{ color: "#6b7280" }}>
    Olvidé mi contraseña
  </Link>
</div>
```

Note: `useSearchParams` requires wrapping in `<Suspense>`. Wrap the export with:
```tsx
import { Suspense } from "react"

function LoginForm() {
  // move all existing component content here
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
```

---

## Task 8: Final verification

**Step 1: TypeScript check**
```bash
npx tsc --noEmit
```
Expected: 0 errors.

**Step 2: Run tests**
```bash
npx vitest run
```
Expected: 52 tests pass.

**Step 3: Next.js build**
```bash
npx next build
```
Expected: clean build.

**Step 4: Manual test**
1. Go to `/login`, click "Olvidé mi contraseña"
2. Enter a valid user email → see success message
3. Check email inbox for reset link
4. Click link → see new password form
5. Enter new password → redirected to `/login?reset=ok` with success banner
6. Log in with new password
