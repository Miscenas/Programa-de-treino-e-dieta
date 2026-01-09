import { supabase } from './supabaseClient'
import { UserProfile, FullPlan } from '../types'

export class EdgeFunctionService {
  static async generatePlan(userProfile: UserProfile): Promise<FullPlan> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-plan', {
        body: { userProfile }
      })

      if (error) {
        console.error('Edge function error:', error)
        throw new Error(`Failed to generate plan: ${error.message}`)
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate plan')
      }

      return data.data as FullPlan
    } catch (error) {
      console.error('Error calling edge function:', error)
      throw error
    }
  }

  static async analyzeFoodImage(imageData: string): Promise<any> {
    try {
      console.log('Starting food analysis...');

      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: {
          imageData: imageData
        }
      })

      console.log('Supabase client response:', { data, error });

      if (error) {
        console.error('Food analysis error:', error)
        // Try to see if there's more info in the error object (Supabase client often wraps it)
        throw new Error(`Failed to analyze food: ${error.message}${error.context ? ' - ' + JSON.stringify(error.context) : ''}`)
      }

      if (!data?.success) {
        console.error('Edge Function returned error:', data?.error || 'Unknown error')
        throw new Error(data?.error || 'Failed to analyze food')
      }

      console.log('Analysis successful:', data.data);
      return data.data
    } catch (error) {
      console.error('Error analyzing food image:', error)
      throw error
    }
  }
}
