import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

    const { userProfile, imageData } = await req.json()
    const genAI = new GoogleGenerativeAI(apiKey)

    // Use stable model for best results
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `
      Você é um especialista em fitness e nutrição. 
      Crie um plano completo de 7 dias (Dieta e Treino) para este usuário:
      
      PERFIL:
      - Nome: ${userProfile.name}
      - Idade: ${userProfile.age}
      - Objetivo: ${userProfile.goal === 'WEIGHT_LOSS' ? 'Emagrecimento' : 'Ganho de Massa'}
      - Peso: ${userProfile.weight}kg | Altura: ${userProfile.height}cm
      - Nível de Atividade: ${userProfile.activityLevel}
      - Preferências: ${userProfile.foodPreferences?.join(', ') || 'Nenhuma'}
      - Restrições: ${userProfile.foodRestrictions?.join(', ') || 'Nenhuma'}

      REQUISITOS TÉCNICOS:
      1. DIETA: Forneça pelo menos 5 refeições diárias.
      2. OPÇÕES: Dentro de cada refeição ("meals"), forneça 3 OPÇÕES ("options") diferentes para o usuário escolher.
      3. TREINO: Crie um cronograma semanal ("weeklySchedule") com foco nos objetivos do usuário.
      
      RESPONDA APENAS EM JSON PURO seguindo exatamente esta estrutura:
      {
        "nutrition": {
          "targetCalories": 2000,
          "bmr": 1800,
          "tdee": 2400,
          "waterIntake": 3000,
          "meals": [
            {
              "id": "1",
              "name": "Café da Manhã",
              "time": "08:00",
              "calories": 400,
              "macros": { "protein": 30, "carbs": 40, "fats": 10 },
              "options": [
                {
                  "id": "opt-1",
                  "name": "Opção Clássica",
                  "description": "Ovos mexidos com pão integral",
                  "ingredients": [
                    { "name": "Ovo", "amount": "2 unidades" },
                    { "name": "Pão Integral", "amount": "2 fatias" }
                  ],
                  "calories": 400,
                  "macros": { "protein": 30, "carbs": 40, "fats": 10 }
                }
              ]
            }
          ]
        },
        "workout": {
          "methodology": "Treino ABC",
          "weeklySchedule": [
            {
              "dayName": "Segunda-feira",
              "focus": "Peito e Tríceps",
              "exercises": [
                { "name": "Supino Reto", "sets": 3, "reps": "12", "rest": "60s" }
              ]
            }
          ]
        },
        "generatedAt": "${new Date().toISOString()}"
      }
    `

    let result;
    if (imageData) {
      const parts = imageData.split(';base64,')
      const base64Data = parts[1] || parts[0]
      const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg'
      result = await model.generateContent([prompt, { inlineData: { data: base64Data, mimeType } }])
    } else {
      result = await model.generateContent(prompt)
    }

    const response = await result.response
    const text = response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : text)

    return new Response(
      JSON.stringify({ success: true, data: analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Function error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
