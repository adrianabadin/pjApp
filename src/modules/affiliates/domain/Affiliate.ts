export interface Affiliate {
  id: number
  distrito: string | null
  codigo: number | null
  apellido: string | null
  nombres: string | null
  genero: string | null
  dni_tipo: string | null
  dni_numero: string | null
  fecha_nacimiento: Date | null
  is_seen: boolean
  seen_at: Date | null
  assigned_user_id: string | null
  // Joined from padron_saladillo
  telefono: string | null
  mail: string | null
}
