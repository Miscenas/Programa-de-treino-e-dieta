import { supabase } from './supabaseClient'

export interface AuthUser {
  id: string
  email: string
  name?: string
}

export class AuthService {
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  }

  static async signUp(email: string, password: string, name: string) {
    // Primeiro cria o usuário na autenticação
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    })

    if (error) throw error

    // Se o usuário foi criado com sucesso, cria o perfil na tabela profiles
    if (data.user) {
      await this.createProfile(data.user.id, email, name)
    }

    return data
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  static async onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name
        })
      } else {
        callback(null)
      }
    })
  }

  private static async createProfile(userId: string, email: string, name: string) {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) throw error
  }

  static async updateProfile(userId: string, updates: Partial<{ name: string }>) {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error
  }
}
