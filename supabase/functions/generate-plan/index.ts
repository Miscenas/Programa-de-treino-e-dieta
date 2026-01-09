import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userProfile } = await req.json()

    if (!userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Gemini AI with API key from environment variables
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Create prompt for generating personalized fitness plan
    const prompt = `
      Como um especialista em fitness e nutrição, crie um plano personalizado para:
      
      Perfil do usuário:
      - Nome: ${userProfile.name}
      - Idade: ${userProfile.age} anos
      - Gênero: ${userProfile.gender === 'MALE' ? 'Masculino' : 'Feminino'}
      - Altura: ${userProfile.height}cm
      - Peso: ${userProfile.weight}kg
      - Objetivo: ${userProfile.goal === 'WEIGHT_LOSS' ? 'Perda de peso' : 'Ganho de massa muscular'}
      - Nível de atividade: ${userProfile.activityLevel}
      - Nível de experiência: ${userProfile.experienceLevel}
      - Frequência de treinos: ${userProfile.workoutFrequency} dias por semana
      - Dias de treino: ${userProfile.workoutDays}
      - Preferências alimentares: ${userProfile.foodPreferences?.join(', ') || 'Nenhuma'}
      - Restrições alimentares: ${userProfile.foodRestrictions?.join(', ') || 'Nenhuma'}

      Gere um plano completo em formato JSON com:
      1. Plano nutricional (calorias diárias, distribuição de macronutrientes, refeições)
      2. Plano de treino (divisão, exercícios, séries, repetições, descanso)
      
      Responda APENAS com o JSON válido, sem texto adicional.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Try to parse the response as JSON
    let planData
    try {
      planData = JSON.parse(text)
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse AI response as JSON')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: planData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error generating plan:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate plan',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
