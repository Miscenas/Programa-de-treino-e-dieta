import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userProfile, imageData } = await req.json()

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
    
    // Use Gemini Pro Vision for image analysis
    const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const textModel = genAI.getGenerativeModel({ model: "gemini-pro" })

    let imageAnalysis = null

    // Process image if provided
    if (imageData) {
      try {
        const imageParts = [
          {
            inlineData: {
              data: imageData.split(',')[1], // Remove data:image/...;base64, prefix
              mimeType: imageData.split(';')[0].split(':')[1] // Extract MIME type
            }
          }
        ]

        const imagePrompt = `
          Analise esta imagem de comida e identifique:
          1. Todos os alimentos visíveis
          2. Estimativa de calorias totais
          3. Macronutrientes aproximados (proteínas, carboidratos, gorduras)
          4. Porções estimadas
          
          Responda em formato JSON com a estrutura:
          {
            "foods": [{"name": "nome", "calories": 123, "protein": 10, "carbs": 20, "fats": 5, "portion": "1 xícara"}],
            "totalCalories": 450,
            "totalProtein": 25,
            "totalCarbs": 35,
            "totalFats": 15
          }
        `

        const imageResult = await visionModel.generateContent([imagePrompt, ...imageParts])
        const imageResponse = await imageResult.response
        const imageText = imageResponse.text()

        // Parse image analysis
        try {
          imageAnalysis = JSON.parse(imageText)
        } catch (parseError) {
          const jsonMatch = imageText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            imageAnalysis = JSON.parse(jsonMatch[0])
          }
        }
      } catch (imageError) {
        console.error('Error analyzing image:', imageError)
        // Continue without image analysis if it fails
      }
    }

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

      ${imageAnalysis ? `
      Análise da imagem fornecida:
      - Alimentos identificados: ${imageAnalysis.foods?.map(f => f.name).join(', ') || 'Nenhum'}
      - Calorias totais na imagem: ${imageAnalysis.totalCalories || 0}
      - Macronutrientes: Proteínnas ${imageAnalysis.totalProtein || 0}g, Carboidratos ${imageAnalysis.totalCarbs || 0}g, Gorduras ${imageAnalysis.totalFats || 0}g
      ` : ''}

      Gere um plano completo em formato JSON com:
      1. Plano nutricional (calorias diárias, distribuição de macronutrientes, refeições)
      2. Plano de treino (divisão, exercícios, séries, repetições, descanso)
      
      Responda APENAS com o JSON válido, sem texto adicional.
    `

    const result = await textModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Try to parse response as JSON
    let planData
    try {
      planData = JSON.parse(text)
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse AI response as JSON')
      }
    }

    // Add image analysis to the response if available
    if (imageAnalysis) {
      planData.imageAnalysis = imageAnalysis
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
