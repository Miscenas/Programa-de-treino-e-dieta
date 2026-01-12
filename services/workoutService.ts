import { supabase } from './supabaseClient'

export interface WorkoutRecord {
  id?: string
  user_id: string
  session_date: string
  workout_session: any
  completed: boolean
  notes?: string
}

export class WorkoutService {
  // Salvar treino no banco
  static async saveWorkout(workout: Omit<WorkoutRecord, 'id'>): Promise<WorkoutRecord | null> {
    try {
      const { data, error } = await supabase
        .from('workout_records')
        .insert([workout])
        .select()
        .single()

      if (error) {
        console.error('Error saving workout:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error saving workout:', error)
      return null
    }
  }

  // Carregar treinos do usuário
  static async loadWorkouts(userId: string): Promise<WorkoutRecord[]> {
    try {
      const { data, error } = await supabase
        .from('workout_records')
        .select('*')
        .eq('user_id', userId)
        .order('session_date', { ascending: false })

      if (error) {
        console.error('Error loading workouts:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error loading workouts:', error)
      return []
    }
  }

  // Atualizar treino
  static async updateWorkout(id: string, updates: Partial<WorkoutRecord>): Promise<WorkoutRecord | null> {
    try {
      const { data, error } = await supabase
        .from('workout_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating workout:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error updating workout:', error)
      return null
    }
  }

  // Deletar treino
  static async deleteWorkout(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('workout_records')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting workout:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting workout:', error)
      return false
    }
  }

  // Verificar se treino já existe para a data
  static async getWorkoutByDate(userId: string, date: string): Promise<WorkoutRecord | null> {
    try {
      const { data, error } = await supabase
        .from('workout_records')
        .select('*')
        .eq('user_id', userId)
        .eq('session_date', date)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error getting workout by date:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error getting workout by date:', error)
      return null
    }
  }
}
