# Design: Invitation-Based Registration

## Context

Internal app for PJ Saladillo affiliate management. User registration is invite-only — no public registration. Authenticated users generate invite links by entering an email; the invited person clicks the link and completes registration.

## Approach: Separate `invitations` table

A dedicated `invitations` table holds tokens independently of `User`. The invited user doesn't have a `User` record until they accept. This keeps the `users` table clean and makes invitation state explicit.

## Database Changes

```prisma
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

// User model gains inverse relation:
model User {
  // ...existing fields...
  invitations_sent Invitation[]
}
```

### Invitation States
- **Pendiente**: `accepted_at IS NULL AND expires_at > NOW()`
- **Expirada**: `expires_at < NOW()` and `accepted_at IS NULL`
- **Aceptada**: `accepted_at IS NOT NULL`

## Flow

1. Authenticated user visits `/dashboard/invite`
2. Enters email → server action:
   - Generates `crypto.randomBytes(32).toString('hex')` token
   - Saves to `invitations` with 24h expiry
   - Sends invite email via Resend with link `/register?token=xxx`
   - Always shows "Email enviado" (anti-enumeration)
3. List below form shows all invitations sent by this user with state
4. Invited person clicks link → `/register?token=xxx`
5. Server validates token (exists, not expired, not accepted) — shows error page if invalid
6. User fills name + password (email is read-only, prefilled from invitation)
7. Server action: validates token again, creates `User`, sets `invitation.accepted_at`, redirects to `/login`

## Security

- Token: `crypto.randomBytes(32).toString('hex')` (256 bits of entropy)
- Expiry: 24 hours
- Single-use: `accepted_at` is set immediately on registration
- No public registration: `/register` without a valid token always shows "Invitación inválida"
- Anti-enumeration: invite form always returns "Email enviado" regardless of whether email already exists
- Re-invite allowed: same email can be invited again if previous invitation expired or was accepted

## Files

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `Invitation` model + inverse relation on `User` |
| `src/modules/invitations/domain/Invitation.ts` | TypeScript type |
| `src/modules/invitations/domain/InvitationRepository.ts` | Interface: `create`, `findByToken`, `markAccepted`, `findAllByInviter` |
| `src/modules/invitations/infrastructure/PrismaInvitationRepository.ts` | Raw SQL implementation (consistent with project pattern) |
| `src/lib/email.ts` | Add `sendInvitationEmail(to, token)` |
| `src/app/dashboard/invite/page.tsx` | Server component: loads invitation list, renders `InviteForm` |
| `src/app/dashboard/invite/InviteForm.tsx` | Client component: email form + invitation list table |
| `src/app/dashboard/invite/actions.ts` | Server action: `createInvitationAction(email)` |
| `src/app/register/page.tsx` | Server component: validates token, renders form or error |
| `src/app/register/RegisterForm.tsx` | Client component: email (read-only) + name + password |
| `src/app/register/actions.ts` | Server action: `registerAction(token, name, password)` |
| `src/__tests__/unit/invitations/` | New test mocks for `InvitationRepository` |
