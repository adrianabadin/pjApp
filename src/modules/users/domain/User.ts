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
