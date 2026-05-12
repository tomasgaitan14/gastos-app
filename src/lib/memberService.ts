import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/**
 * Crea una cuenta para un nuevo miembro sin tocar la sesión del usuario activo.
 * Usa un cliente temporal con persistencia desactivada.
 */
export async function createMemberAccount(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  const { error } = await tempClient.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  })

  if (error) {
    const msg =
      error.message.includes('User already registered')
        ? 'Ya existe una cuenta con ese email'
        : error.message
    throw new Error(msg)
  }
}
