# Design: Forgot Password (Resend + DB Token)

## Context

Internal app for PJ Saladillo affiliate management. Small number of users. No email infrastructure previously configured.

## Approach: DB token on User model

Add two nullable fields to the existing `User` model. No new table needed.

## Database Changes

```prisma
model User {
  // ...existing fields...
  reset_token            String?   @unique
  reset_token_expires_at DateTime?
}
```

## Flow

1. User clicks "Olvidé mi contraseña" on `/login` → `/forgot-password`
2. User enters email → server action generates `crypto.randomBytes(32).toString('hex')` token, saves to `users`, sends email via Resend with link to `/reset-password?token=xxx` (expires 1 hour)
3. User clicks link → `/reset-password?token=xxx` — page validates token on load, shows form if valid
4. User enters new password + confirmation → server action validates token (exists + not expired), hashes new password with bcrypt, updates `password_hash`, clears both reset fields
5. Redirect to `/login` with success message

## Security

- Token: `crypto.randomBytes(32).toString('hex')` (256 bits of entropy)
- Expiry: 1 hour
- Token is single-use: cleared immediately on password update
- "Always show success" on forgot-password form (no email enumeration)

## Files

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `reset_token`, `reset_token_expires_at` to User |
| `src/lib/email.ts` | Resend client + `sendPasswordResetEmail()` |
| `src/app/forgot-password/page.tsx` | Email input form |
| `src/app/forgot-password/actions.ts` | Generate token, save, send email |
| `src/app/reset-password/page.tsx` | New password form (validates token server-side) |
| `src/app/reset-password/actions.ts` | Validate token, update password, clear token |
| `src/modules/users/domain/UserRepository.ts` | Add `saveResetToken`, `findByResetToken`, `updatePassword` |
| `src/modules/users/infrastructure/PrismaUserRepository.ts` | Implement new methods |
| `src/app/login/page.tsx` | Add "Olvidé mi contraseña" link |
| `src/__tests__/unit/users/*.test.ts` | Update mocks with new methods |
