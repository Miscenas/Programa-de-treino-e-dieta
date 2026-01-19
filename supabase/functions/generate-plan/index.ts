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

    // Calculate nutrition values locally to ensure accuracy
    // BMR calculation using Mifflin-St Jeor equation
    let bmr = (10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age)
    if (userProfile.gender === 'MALE' || userProfile.gender === 'Male') {
      bmr += 5
    } else {
      bmr -= 161
    }
    bmr = Math.round(bmr)

    // TDEE calculation based on activity level
    const activityMultipliers: Record<string, number> = {
      'SEDENTARY': 1.2,
      'LIGHTLY_ACTIVE': 1.375,
      'MODERATELY_ACTIVE': 1.55,
      'VERY_ACTIVE': 1.725,
      'SUPER_ACTIVE': 1.9
    }
    const multiplier = activityMultipliers[userProfile.activityLevel] || 1.2
    const tdee = Math.round(bmr * multiplier)

    // Target calories with deficit/surplus
    let targetCalories = tdee
    if (userProfile.targetDeficit !== undefined) {
      targetCalories = tdee + userProfile.targetDeficit
    } else if (userProfile.goal === 'WEIGHT_LOSS') {
      targetCalories -= 500
    } else {
      targetCalories += 300
    }

    // Minimum calorie floors
    if (userProfile.gender === 'FEMALE' && targetCalories < 1200) targetCalories = 1200
    if (userProfile.gender === 'MALE' && targetCalories < 1500) targetCalories = 1500

    const waterIntake = Math.round(userProfile.weight * 35)

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

      VALORES NUTRICIONAIS CALCULADOS (USE EXATAMENTE ESTES):
      - BMR (Taxa Metabólica Basal): ${bmr} kcal
      - TDEE (Gasto Energético Total): ${tdee} kcal
      - META CALÓRICA DIÁRIA: ${targetCalories} kcal
      - Ingestão de Água: ${waterIntake}ml

      ⚠️ IMPORTANTE: Use EXATAMENTE ${targetCalories} kcal como "targetCalories" no JSON.
      NÃO recalcule estes valores. Apenas distribua as calorias entre as 4 refeições.

      REQUISITOS TÉCNICOS:
      1. DIETA: Forneça Exatamente 4 refeições diárias (Café, Almoço, Lanche, Jantar).
         - CULTURA: Priorize opções tradicionais brasileiras com VARIEDADE. 
         - No Café da Manhã: Sempre inclua 'Pão com Ovo/Manteiga e Café', mas varie as outras opções (tapioca, panqueca de aveia, omelete, etc).
         - No Almoço e Jantar: Sempre inclua 'PF Tradicional' (Arroz, Feijão, Proteína e Salada), mas varie as proteínas (frango, carne, peixe, ovo) e adicione opções como 'Sanduíche Natural de Carne Grelhada com Alface e Tomate' ou 'Wrap de Frango'.
         - No Lanche: Varie entre Frutas, Iogurte natural, Sanduíche natural (carne sem processamento), Pasta de amendoim com banana, Mix de castanhas.
         - IMPORTANTE: Evite alimentos ultraprocessados. Prefira carnes grelhadas, assadas ou cozidas ao invés de embutidos.
      2. OPÇÕES: Dentro de cada refeição ("meals"), forneça 5 OPÇÕES ("options") bem VARIADAS e diferentes para o usuário escolher.
      3. TREINO: Crie um cronograma semanal ("weeklySchedule") com foco nos objetivos do usuário.
      
      RESPONDA APENAS EM JSON PURO seguindo exatamente esta estrutura:
      {
        "nutrition": {
          "targetCalories": ${targetCalories},
          "bmr": ${bmr},
          "tdee": ${tdee},
          "waterIntake": ${waterIntake},
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
