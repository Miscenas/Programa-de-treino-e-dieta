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

  static async parsePlan(content: string, type: 'image' | 'text', distributeByDays: boolean = true): Promise<FullPlan> {
    try {
      console.log(`[EdgeFunctionService] Calling parse-plan. Type: ${type}. Model: Gemini 2.0 Flash (Distribuir: ${distributeByDays})`);
      const { data, error } = await supabase.functions.invoke('parse-plan', {
        body: { content, type, distributeByDays }
      })

      if (error) {
        console.error('[EdgeFunctionService] Supabase invoke error:', error);
        throw new Error(`Erro na comunicação com a IA: ${error.message}`)
      }

      if (!data?.success) {
        console.error('[EdgeFunctionService] Backend logic error:', data?.error);
        throw new Error(data?.error || 'Erro processar o plano com IA')
      }

      console.log('[EdgeFunctionService] Plan parsed successfully');
      return data.data as FullPlan
    } catch (error: any) {
      console.error('[EdgeFunctionService] Unexpected error in parsePlan:', error)
      throw error
    }
  }
}
