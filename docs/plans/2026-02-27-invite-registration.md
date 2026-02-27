# Invitation-Based Registration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow authenticated users to invite new users by email; only invited users can register via a 24-hour token link.

**Architecture:** A new `invitations` table stores tokens independently of `User`. The invite UI lives at `/dashboard/invite` (auth-gated). Registration lives at `/register?token=xxx` (public but token-gated). A `RegisterWithInvitationUseCase` encapsulates the business logic for testability.

**Tech Stack:** Next.js 16 Server Components + Server Actions, Prisma + PostgreSQL (raw SQL for writes), Resend (email), bcryptjs, NextAuth (session), Vitest (tests).

---

### Task 1: Prisma schema — Add `Invitation` model

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add `Invitation` model and inverse relation on `User`**

Open `prisma/schema.prisma`. Add at the end of the file (after the `User` model), and add the inverse relation to `User`:

```prisma
// in User model, add this field inside the model block:
  invitations_sent   Invitation[]

// new model at end of file:
model Invitation {
  id            String    @id @default(cuid())
  email         String
  token         String    @unique
  invited_by_id String
  invited_by    User      @relation(fields: [invited_by_id], references: [id])
  expires_at    DateTime
  accepted_at   DateTime?
  created_at    DateTime  @default(now())

  @@map("invitations")
}
```

Full `User` model should look like:
```prisma
model User {
  id                     String       @id @default(cuid())
  email                  String       @unique
  password_hash          String
  name                   String?
  role                   String       @default("operator")
  created_at             DateTime     @default(now())
  reset_token            String?      @unique
  reset_token_expires_at DateTime?

  afiliados              Afiliado[]
  invitations_sent       Invitation[]

  @@map("users")
}
```

**Step 2: Run migration**

```bash
cd /c/Users/Adria/Documents/code/pj
npx prisma migrate dev --name add-invitations
```

Expected: Migration applied, new `src/generated/prisma` client regenerated.

If `migrate dev` fails with "P3005 already exists" or replay error, use the manual approach:
```bash
# Write SQL file
cat > /tmp/add_invitations.sql << 'EOF'
CREATE TABLE invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  invited_by_id TEXT NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
EOF

# Apply it
npx prisma db execute --file /tmp/add_invitations.sql

# Find the migration name that was created (but not applied)
ls prisma/migrations/

# Mark it as applied (replace TIMESTAMP with the actual folder name)
npx prisma migrate resolve --applied TIMESTAMP_add_invitations

# Regenerate client
npx prisma generate
```

**Step 3: Verify client was regenerated**

```bash
node -e "const p = require('./src/generated/prisma/client'); console.log(typeof p.PrismaClient)"
```
Expected: `function`

**Step 4: Commit**

```bash
git add prisma/ src/generated/
git commit -m "feat: add invitations table to schema"
```

---

### Task 2: InvitationRepository — domain + infrastructure

**Files:**
- Create: `src/modules/invitations/domain/Invitation.ts`
- Create: `src/modules/invitations/domain/InvitationRepository.ts`
- Create: `src/modules/invitations/infrastructure/PrismaInvitationRepository.ts`

**Step 1: Create `src/modules/invitations/domain/Invitation.ts`**

```typescript
export interface Invitation {
  id: string
  email: string
  token: string
  invited_by_id: string
  expires_at: Date
  accepted_at: Date | null
  created_at: Date
}
```

**Step 2: Create `src/modules/invitations/domain/InvitationRepository.ts`**

```typescript
import type { Invitation } from "./Invitation"

export interface InvitationRepository {
  create(data: {
    email: string
    token: string
    invitedById: string
    expiresAt: Date
  }): Promise<Invitation>
  findByToken(token: string): Promise<Invitation | null>
  markAccepted(id: string): Promise<void>
  findAllByInviter(userId: string): Promise<Invitation[]>
}
```

**Step 3: Create `src/modules/invitations/infrastructure/PrismaInvitationRepository.ts`**

This uses the Prisma ORM (safe since `invitations` is a newly created table with a fresh generated client):

```typescript
import type { InvitationRepository } from "../domain/InvitationRepository"
import type { Invitation } from "../domain/Invitation"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

export class PrismaInvitationRepository implements InvitationRepository {
  async create(data: {
    email: string
    token: string
    invitedById: string
    expiresAt: Date
  }): Promise<Invitation> {
    const row = await prisma.$queryRaw<Invitation[]>(Prisma.sql`
      INSERT INTO invitations (id, email, token, invited_by_id, expires_at, created_at)
      VALUES (gen_random_uuid(), ${data.email}, ${data.token}, ${data.invitedById}, ${data.expiresAt}, NOW())
      RETURNING id, email, token, invited_by_id, expires_at, accepted_at, created_at
    `)
    return row[0]
  }

  async findByToken(token: string): Promise<Invitation | null> {
    const rows = await prisma.$queryRaw<Invitation[]>(Prisma.sql`
      SELECT id, email, token, invited_by_id, expires_at, accepted_at, created_at
      FROM invitations WHERE token = ${token} LIMIT 1
    `)
    return rows[0] ?? null
  }

  async markAccepted(id: string): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE invitations SET accepted_at = NOW() WHERE id = ${id}
    `)
  }

  async findAllByInviter(userId: string): Promise<Invitation[]> {
    return prisma.$queryRaw<Invitation[]>(Prisma.sql`
      SELECT id, email, token, invited_by_id, expires_at, accepted_at, created_at
      FROM invitations WHERE invited_by_id = ${userId}
      ORDER BY created_at DESC
    `)
  }
}
```

Note: Using `gen_random_uuid()` for PostgreSQL UUID generation (consistent with cuid() being handled by Prisma — but since we're using raw SQL here, we need PG to generate the ID; alternatively use `cuid()` from JS before the query).

Actually, to avoid the `gen_random_uuid()` dependency (it requires `pgcrypto` extension), generate the ID in JS:

```typescript
import { createId } from "@paralleldrive/cuid2"
// OR just use crypto:
import crypto from "crypto"

async create(data: { ... }): Promise<Invitation> {
  const id = crypto.randomUUID()
  const row = await prisma.$queryRaw<Invitation[]>(Prisma.sql`
    INSERT INTO invitations (id, email, token, invited_by_id, expires_at, created_at)
    VALUES (${id}, ${data.email}, ${data.token}, ${data.invitedById}, ${data.expiresAt}, NOW())
    RETURNING id, email, token, invited_by_id, expires_at, accepted_at, created_at
  `)
  return row[0]
}
```

Use `crypto.randomUUID()` from Node's built-in `crypto` module (no import needed — available as global in Node 16+, or `import crypto from "crypto"`).

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 5: Commit**

```bash
git add src/modules/invitations/
git commit -m "feat: add InvitationRepository domain and Prisma implementation"
```

---

### Task 3: Business logic — `RegisterWithInvitationUseCase` + email function

**Files:**
- Create: `src/modules/invitations/application/registerWithInvitation.ts`
- Modify: `src/lib/email.ts`

**Step 1: Create `src/modules/invitations/application/registerWithInvitation.ts`**

```typescript
import bcrypt from "bcryptjs"
import type { InvitationRepository } from "../domain/InvitationRepository"
import type { UserRepository } from "@/modules/users/domain/UserRepository"
import type { User } from "@/modules/users/domain/User"

export class RegisterWithInvitationUseCase {
  constructor(
    private invitationRepo: InvitationRepository,
    private userRepo: UserRepository
  ) {}

  async execute(token: string, name: string, password: string): Promise<User> {
    if (password.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres")
    }

    const invitation = await this.invitationRepo.findByToken(token)

    if (!invitation) {
      throw new Error("Invitación inválida o expirada")
    }

    if (invitation.accepted_at) {
      throw new Error("Invitación inválida o expirada")
    }

    if (new Date() > new Date(invitation.expires_at)) {
      throw new Error("Invitación inválida o expirada")
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await this.userRepo.create({
      email: invitation.email,
      password_hash: passwordHash,
      name,
    })

    await this.invitationRepo.markAccepted(invitation.id)

    return user
  }
}
```

**Step 2: Add `sendInvitationEmail()` to `src/lib/email.ts`**

Append this function after the existing `sendPasswordResetEmail`:

```typescript
export async function sendInvitationEmail(to: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  const registerUrl = `${baseUrl}/register?token=${token}`

  await resend.emails.send({
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
}
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 4: Commit**

```bash
git add src/modules/invitations/application/ src/lib/email.ts
git commit -m "feat: RegisterWithInvitationUseCase + sendInvitationEmail"
```

---

### Task 4: Tests — `RegisterWithInvitationUseCase`

**Files:**
- Create: `src/__tests__/unit/invitations/registerWithInvitation.test.ts`

**Step 1: Write the failing tests**

Create `src/__tests__/unit/invitations/registerWithInvitation.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { RegisterWithInvitationUseCase } from "@/modules/invitations/application/registerWithInvitation"
import type { InvitationRepository } from "@/modules/invitations/domain/InvitationRepository"
import type { Invitation } from "@/modules/invitations/domain/Invitation"
import type { UserRepository } from "@/modules/users/domain/UserRepository"
import type { User } from "@/modules/users/domain/User"

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$12$hashed"),
    compare: vi.fn(),
  },
}))

function makeInvitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    id: "inv-1",
    email: "nuevo@example.com",
    token: "abc123token",
    invited_by_id: "user-admin-1",
    expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    accepted_at: null,
    created_at: new Date(),
    ...overrides,
  }
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-new-1",
    email: "nuevo@example.com",
    password_hash: "$2b$12$hashed",
    name: "Juan Pérez",
    role: "operator",
    created_at: new Date(),
    reset_token: null,
    reset_token_expires_at: null,
    ...overrides,
  }
}

function makeInvitationRepo(overrides: Partial<InvitationRepository> = {}): InvitationRepository {
  return {
    create: vi.fn(),
    findByToken: vi.fn().mockResolvedValue(null),
    markAccepted: vi.fn().mockResolvedValue(undefined),
    findAllByInviter: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

function makeUserRepo(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(makeUser()),
    saveResetToken: vi.fn().mockResolvedValue(undefined),
    findByResetToken: vi.fn().mockResolvedValue(null),
    updatePassword: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe("RegisterWithInvitationUseCase", () => {
  let invitationRepo: InvitationRepository
  let userRepo: UserRepository
  let useCase: RegisterWithInvitationUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    invitationRepo = makeInvitationRepo()
    userRepo = makeUserRepo()
    useCase = new RegisterWithInvitationUseCase(invitationRepo, userRepo)
  })

  describe("Happy Path", () => {
    it("crea el usuario con el email de la invitación", async () => {
      const invitation = makeInvitation()
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(invitation)

      await useCase.execute("abc123token", "Juan Pérez", "password123")

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: "nuevo@example.com", name: "Juan Pérez" })
      )
    })

    it("marca la invitación como aceptada tras crear el usuario", async () => {
      const invitation = makeInvitation()
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(invitation)

      await useCase.execute("abc123token", "Juan", "password123")

      expect(invitationRepo.markAccepted).toHaveBeenCalledWith("inv-1")
    })

    it("retorna el usuario creado", async () => {
      const invitation = makeInvitation()
      const user = makeUser()
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(invitation)
      vi.mocked(userRepo.create).mockResolvedValue(user)

      const result = await useCase.execute("abc123token", "Juan", "password123")

      expect(result).toEqual(user)
    })

    it("hashea el password con bcrypt cost 12", async () => {
      const bcrypt = await import("bcryptjs")
      const invitation = makeInvitation()
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(invitation)

      await useCase.execute("abc123token", "Juan", "miPassword")

      expect(bcrypt.default.hash).toHaveBeenCalledWith("miPassword", 12)
    })
  })

  describe("Failure Path — token inválido", () => {
    it("lanza error si el token no existe", async () => {
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(null)

      await expect(
        useCase.execute("tokeninexistente", "Juan", "password123")
      ).rejects.toThrow("Invitación inválida o expirada")
    })

    it("lanza error si la invitación ya fue aceptada", async () => {
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(
        makeInvitation({ accepted_at: new Date("2024-01-01") })
      )

      await expect(
        useCase.execute("abc123token", "Juan", "password123")
      ).rejects.toThrow("Invitación inválida o expirada")
    })

    it("lanza error si la invitación expiró", async () => {
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(
        makeInvitation({ expires_at: new Date(Date.now() - 1000) }) // 1 second ago
      )

      await expect(
        useCase.execute("abc123token", "Juan", "password123")
      ).rejects.toThrow("Invitación inválida o expirada")
    })

    it("usa el mismo mensaje de error para token inexistente, expirado y ya usado (evita enumeración)", async () => {
      const msg = "Invitación inválida o expirada"

      vi.mocked(invitationRepo.findByToken).mockResolvedValue(null)
      await useCase.execute("x", "J", "pass1234").catch((e) => expect(e.message).toBe(msg))

      vi.mocked(invitationRepo.findByToken).mockResolvedValue(
        makeInvitation({ accepted_at: new Date() })
      )
      await useCase.execute("x", "J", "pass1234").catch((e) => expect(e.message).toBe(msg))

      vi.mocked(invitationRepo.findByToken).mockResolvedValue(
        makeInvitation({ expires_at: new Date(Date.now() - 1) })
      )
      await useCase.execute("x", "J", "pass1234").catch((e) => expect(e.message).toBe(msg))
    })

    it("no crea el usuario si el token es inválido", async () => {
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(null)

      await useCase.execute("bad", "Juan", "password123").catch(() => {})

      expect(userRepo.create).not.toHaveBeenCalled()
    })
  })

  describe("Failure Path — validación de password", () => {
    it("lanza error si el password tiene menos de 8 caracteres", async () => {
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(makeInvitation())

      await expect(
        useCase.execute("abc123token", "Juan", "1234567")
      ).rejects.toThrow("La contraseña debe tener al menos 8 caracteres")
    })

    it("acepta password de exactamente 8 caracteres", async () => {
      vi.mocked(invitationRepo.findByToken).mockResolvedValue(makeInvitation())

      await expect(
        useCase.execute("abc123token", "Juan", "12345678")
      ).resolves.not.toThrow()
    })
  })
})
```

**Step 2: Run tests to verify they FAIL**

```bash
npx vitest run src/__tests__/unit/invitations/
```
Expected: FAIL — module not found (use case doesn't exist yet).

Wait — we already created the use case in Task 3. So these should PASS.

**Step 3: Run all tests**

```bash
npx vitest run
```
Expected: All existing tests pass + new invitation tests pass.

**Step 4: Commit**

```bash
git add src/__tests__/unit/invitations/
git commit -m "test: add RegisterWithInvitationUseCase unit tests"
```

---

### Task 5: `/dashboard/invite` — Server action + UI

**Files:**
- Create: `src/app/dashboard/invite/actions.ts`
- Create: `src/app/dashboard/invite/page.tsx`
- Create: `src/app/dashboard/invite/InviteForm.tsx`

**Step 1: Create `src/app/dashboard/invite/actions.ts`**

```typescript
"use server"

import crypto from "crypto"
import { auth } from "@/lib/auth"
import { PrismaInvitationRepository } from "@/modules/invitations/infrastructure/PrismaInvitationRepository"
import { sendInvitationEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"

const invitationRepo = new PrismaInvitationRepository()

export async function createInvitationAction(email: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autenticado")

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await invitationRepo.create({
    email,
    token,
    invitedById: session.user.id,
    expiresAt,
  })

  await sendInvitationEmail(email, token)

  revalidatePath("/dashboard/invite")
}
```

**Step 2: Create `src/app/dashboard/invite/InviteForm.tsx`**

```typescript
"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createInvitationAction } from "./actions"
import type { Invitation } from "@/modules/invitations/domain/Invitation"

function invitationStatus(inv: Invitation): { label: string; color: string } {
  if (inv.accepted_at) return { label: "Aceptada", color: "#16a34a" }
  if (new Date() > new Date(inv.expires_at)) return { label: "Expirada", color: "#9ca3af" }
  return { label: "Pendiente", color: "#00B7E2" }
}

export default function InviteForm({ invitations }: { invitations: Invitation[] }) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSent(false)
    startTransition(async () => {
      try {
        await createInvitationAction(email)
        setSent(true)
        setEmail("")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocurrió un error")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold mb-4" style={{ color: "#020238" }}>
          Invitar nuevo usuario
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="invite-email" style={{ color: "#020238" }}>Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={isPending}
              style={{ backgroundColor: "#020238", color: "#FFD331" }}
            >
              {isPending ? "Enviando…" : "Invitar"}
            </Button>
          </div>
        </form>
        {sent && (
          <p className="mt-3 text-sm font-medium text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            Invitación enviada. El link expira en 24 horas.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>}
      </div>

      {/* Invitations list */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ backgroundColor: "#f0f9fd" }}>
          <h2 className="text-base font-semibold" style={{ color: "#020238" }}>
            Invitaciones enviadas
          </h2>
        </div>
        {invitations.length === 0 ? (
          <p className="px-6 py-8 text-sm text-center" style={{ color: "#6b7280" }}>
            Todavía no enviaste ninguna invitación.
          </p>
        ) : (
          <div className="divide-y">
            {invitations.map((inv) => {
              const status = invitationStatus(inv)
              return (
                <div key={inv.id} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm font-medium" style={{ color: "#020238" }}>
                    {inv.email}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: "#6b7280" }}>
                      {new Date(inv.created_at).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <Badge
                      style={{
                        backgroundColor: status.color,
                        color: status.label === "Pendiente" ? "#020238" : "#fff",
                      }}
                    >
                      {status.label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Create `src/app/dashboard/invite/page.tsx`**

```typescript
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PrismaInvitationRepository } from "@/modules/invitations/infrastructure/PrismaInvitationRepository"
import InviteForm from "./InviteForm"

const invitationRepo = new PrismaInvitationRepository()

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
```

**Step 4: Add "Invitar usuario" link to the dashboard main page**

In `src/app/dashboard/page.tsx`, in the "Afiliados asignados pendientes" section header, there's already a `Link` to `/dashboard/assign`. Add a similar link to `/dashboard/invite` in the same header row, after the assign link. Find this block in `page.tsx`:

```tsx
<Link
  href="/dashboard/assign"
  className="text-xs px-3 py-1 rounded-full border font-medium"
  style={{ borderColor: '#020238', color: '#020238' }}
>
  + Asignar afiliados
</Link>
```

Above that link (inside the `flex items-center gap-2` div), add:

```tsx
<Link
  href="/dashboard/invite"
  className="text-xs px-3 py-1 rounded-full border font-medium"
  style={{ borderColor: '#020238', color: '#020238' }}
>
  + Invitar usuario
</Link>
```

**Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 6: Commit**

```bash
git add src/app/dashboard/invite/ src/app/dashboard/page.tsx
git commit -m "feat: /dashboard/invite page — send invite + list invitations"
```

---

### Task 6: `/register` — Token-gated registration page

**Files:**
- Create: `src/app/register/page.tsx`
- Create: `src/app/register/RegisterForm.tsx`
- Create: `src/app/register/actions.ts`

**Step 1: Create `src/app/register/actions.ts`**

```typescript
"use server"

import { PrismaInvitationRepository } from "@/modules/invitations/infrastructure/PrismaInvitationRepository"
import { PrismaUserRepository } from "@/modules/users/infrastructure/PrismaUserRepository"
import { RegisterWithInvitationUseCase } from "@/modules/invitations/application/registerWithInvitation"

const invitationRepo = new PrismaInvitationRepository()
const userRepo = new PrismaUserRepository()
const registerUseCase = new RegisterWithInvitationUseCase(invitationRepo, userRepo)

export async function registerAction(
  token: string,
  name: string,
  password: string
): Promise<void> {
  await registerUseCase.execute(token, name, password)
}
```

**Step 2: Create `src/app/register/RegisterForm.tsx`**

```typescript
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { registerAction } from "./actions"

export default function RegisterForm({
  token,
  email,
}: {
  token: string
  email: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    const name = form.get("name") as string
    const password = form.get("password") as string
    const confirm = form.get("confirm") as string

    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      return
    }

    startTransition(async () => {
      try {
        await registerAction(token, name, password)
        router.push("/login")
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
        <Image
          src="/logo.svg"
          alt="PJ Saladillo"
          width={240}
          height={75}
          className="w-56 sm:w-64 h-auto"
          priority
        />
      </div>

      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div
          className="h-1"
          style={{ background: "linear-gradient(to right, #FFD331, #00B7E2)" }}
        />
        <div className="bg-white px-6 py-7">
          <h1 className="text-xl font-bold mb-1" style={{ color: "#020238" }}>
            Crear cuenta
          </h1>
          <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
            Completá tus datos para activar tu acceso.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" style={{ color: "#020238" }}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" style={{ color: "#020238" }}>
                Nombre
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Tu nombre completo"
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" style={{ color: "#020238" }}>
                Contraseña
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" style={{ color: "#020238" }}>
                Confirmar contraseña
              </Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                minLength={8}
                required
                disabled={isPending}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
              style={{ backgroundColor: "#020238", color: "#FFD331" }}
            >
              {isPending ? "Creando cuenta…" : "Crear cuenta"}
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

**Step 3: Create `src/app/register/page.tsx`**

```typescript
import { PrismaInvitationRepository } from "@/modules/invitations/infrastructure/PrismaInvitationRepository"
import RegisterForm from "./RegisterForm"

const invitationRepo = new PrismaInvitationRepository()

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
```

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 5: Commit**

```bash
git add src/app/register/
git commit -m "feat: /register token-gated registration page"
```

---

### Task 7: Final verification

**Step 1: Run all tests**

```bash
npx vitest run
```
Expected: All tests pass (existing 52 + new invitation tests).

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 3: Production build**

```bash
npx next build
```
Expected: Build succeeds, `/dashboard/invite` and `/register` appear in output.

**Step 4: Manual smoke test**

1. Start dev server: `npx next dev`
2. Log in as an existing user
3. Navigate to `/dashboard/invite`
4. Enter an email → click "Invitar" → check for success message
5. Check the invitations list shows the new entry with "Pendiente" status
6. Open the invite URL from the email (or check DB for token)
7. Fill name + password → submit → should redirect to `/login`
8. Log in with new credentials
9. Back to `/dashboard/invite` → invitation shows "Aceptada"
10. Try `/register` without token → shows "Invitación inválida"
11. Try the same token again → shows "Invitación inválida" (already used)

**Step 5: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "feat: complete invitation-based registration system"
```
