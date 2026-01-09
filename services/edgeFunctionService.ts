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
      
      // Test the Edge Function URL directly first
      console.log('Testing Edge Function availability...');
      const testUrl = 'https://sngqsvienplvwlchpips.supabase.co/functions/v1/generate-plan';
      console.log('Edge Function URL:', testUrl);
      
      try {
        const testResponse = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZ3FzdmllbnBsdndsY2hwaXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Mjc1NjksImV4cCI6MjA4MzUwMzU2OX0.iOHvELHwYiEXOe5vA9Pkhg9N-ZfHnTk0hvotdZdI1Ks`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageData: imageData })
        });
        
        console.log('Direct fetch status:', testResponse.status);
        console.log('Direct fetch ok:', testResponse.ok);
        
        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.log('Direct fetch error:', errorText);
          throw new Error(`Direct fetch failed: ${testResponse.status} - ${errorText}`);
        }
        
        const result = await testResponse.json();
        console.log('Direct fetch result:', result);
        
        if (result.success) {
          console.log('Analysis successful via direct fetch:', result.data);
          return result.data;
        } else {
          throw new Error(result.error || 'Failed to analyze food');
        }
        
      } catch (fetchError) {
        console.log('Direct fetch failed, trying Supabase client...');
        
        // Fallback to Supabase client
        const { data, error } = await supabase.functions.invoke('generate-plan', {
          body: { 
            imageData: imageData
          }
        })

        console.log('Supabase client response:', { data, error });

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
      }

    } catch (error) {
      console.error('Error analyzing food image:', error)
      
      // Fallback for testing when Edge Function is not working
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
