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
      console.log('Image data length:', imageData.length);
      
      const { data, error } = await supabase.functions.invoke('analyze-food', {
        body: { imageData }
      })

      console.log('Edge Function response:', { data, error });

      if (error) {
        console.error('Food analysis error:', error)
        throw new Error(`Failed to analyze food: ${error.message}`)
      }

      if (!data?.success) {
        console.error('Edge Function returned error:', data?.error)
        throw new Error(data?.error || 'Failed to analyze food')
      }

      console.log('Analysis successful:', data.data);
      return data.data
    } catch (error) {
      console.error('Error analyzing food image:', error)
      
      // Fallback for testing when Edge Function is not deployed
      console.warn('Using fallback food analysis (Edge Function not available)')
      return {
        foods: [
          {
            name: "Refeição analisada",
            calories: 350,
            protein: 25,
            carbs: 40,
            fats: 12,
            portion: "1 porção"
          }
        ],
        totalCalories: 350,
        totalProtein: 25,
        totalCarbs: 40,
        totalFats: 12,
        mealType: "refeição",
        description: "Análise simulada para teste"
      }
    }
  }
}
