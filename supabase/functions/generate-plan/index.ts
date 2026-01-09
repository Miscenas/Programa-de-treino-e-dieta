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
    console.log('=== GENERATE-PLAN FUNCTION STARTED ===')
    console.log('Request method:', req.method)
    
    const { userProfile, imageData } = await req.json()
    console.log('Request received - userProfile:', userProfile ? 'YES' : 'NO', 'imageData:', imageData ? 'YES' : 'NO')

    // Allow image analysis without userProfile for food analysis only
    if (!imageData) {
      console.log('Error: No image data provided')
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Gemini AI with API key from environment variables
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    console.log('GEMINI_API_KEY available:', geminiKey ? 'YES' : 'NO')
    
    if (!geminiKey) {
      console.log('Error: GEMINI_API_KEY not found in environment')
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const genAI = new GoogleGenerativeAI(geminiKey)
    
    // Use Gemini Pro Vision for image analysis
    const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
    const textModel = genAI.getGenerativeModel({ model: "gemini-pro" })

    let imageAnalysis = null

    // Process image if provided
    if (imageData) {
      try {
        console.log('Processing image data...')
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

        console.log('Calling Gemini AI...')
        const imageResult = await visionModel.generateContent([imagePrompt, ...imageParts])
        const imageResponse = await imageResult.response
        const imageText = imageResponse.text()
        console.log('Gemini response length:', imageText.length)

        // Parse image analysis
        try {
          imageAnalysis = JSON.parse(imageText)
          console.log('Successfully parsed JSON')
        } catch (parseError) {
          console.log('JSON parse failed, trying regex extraction...')
          const jsonMatch = imageText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            imageAnalysis = JSON.parse(jsonMatch[0])
            console.log('Successfully extracted JSON with regex')
          } else {
            console.log('Failed to extract JSON, response was:', imageText)
            throw new Error('Failed to parse AI response as JSON')
          }
        }

        // If only image analysis is requested (no userProfile), return it directly
        if (!userProfile) {
          console.log('Image analysis completed, returning directly')
          console.log('=== GENERATE-PLAN FUNCTION COMPLETED ===')
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: imageAnalysis 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      } catch (imageError) {
        console.error('Error analyzing image:', imageError)
        // Continue without image analysis if it fails
      }
    }

    // Create prompt for generating personalized fitness plan
    if (userProfile) {
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

        Crie um plano completo incluindo:
        1. Plano de treinos semanais
        2. Plano nutricional diário
        3. Recomendações gerais

        Responda em formato JSON com a estrutura:
        {
          "workoutPlan": {
            "weeklySchedule": [
              {
                "day": "segunda",
                "exercises": [
                  {
                    "name": "nome do exercício",
                    "sets": 3,
                    "reps": 12,
                    "rest": 60,
                    "muscleGroup": "peito"
                  }
                ]
              }
            ]
          },
          "nutritionPlan": {
            "dailyMeals": [
              {
                "name": "café da manhã",
                "foods": [
                  {
                    "name": "aveia",
                    "calories": 150,
                    "protein": 5,
                    "carbs": 27,
                    "fats": 3
                  }
                ],
                "totalCalories": 400
              }
            ],
            "totalDailyCalories": 2000,
            "macros": {
              "protein": 150,
              "carbs": 250,
              "fats": 65
            }
          },
          "recommendations": [
            "Beba 2-3 litros de água por dia",
            "Durma 7-8 horas por noite"
          ]
        }
      `

      const result = await textModel.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse the response
      let planData
      try {
        planData = JSON.parse(text)
      } catch (parseError) {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          planData = JSON.parse(jsonMatch[0])
        }
      }

      // Add image analysis to response if available
      if (imageAnalysis) {
        planData.imageAnalysis = imageAnalysis
      }

      console.log('Plan generation completed')
      console.log('=== GENERATE-PLAN FUNCTION COMPLETED ===')
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            ...planData,
            imageAnalysis: imageAnalysis // Include image analysis in response
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If we reach here, it means we had userProfile but no imageData, or some other case
    console.log('Error: Invalid request combination')
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request combination'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== GENERATE-PLAN FUNCTION ERROR ===')
    console.error('Error generating plan:', error)
    console.error('Error stack:', error.stack)
    
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
