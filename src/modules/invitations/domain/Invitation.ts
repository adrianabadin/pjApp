export interface Invitation {
  id: string
  email: string
  token: string
  invited_by_id: string
  expires_at: Date
  accepted_at: Date | null
  created_at: Date
}
