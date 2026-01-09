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
    const { imageData } = await req.json()

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Extract and validate image data
    const base64Data = imageData.split(',')[1]
    const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg'

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]

    const prompt = `
      Analise esta imagem de comida e responda em JSON:
      {
        "foods": [
          {
            "name": "nome do alimento",
            "calories": 123,
            "protein": 10,
            "carbs": 20,
            "fats": 5,
            "portion": "1 xícara ou 100g"
          }
        ],
        "totalCalories": 450,
        "totalProtein": 25,
        "totalCarbs": 35,
        "totalFats": 15,
        "mealType": "café da manhã",
        "description": "descrição do que você vê"
      }
      
      Seja específico nas porções e valores nutricionais.
    `

    const result = await model.generateContent([prompt, ...imageParts])
    const response = await result.response
    const text = response.text()

    // Parse response with better error handling
    let analysis
    try {
      analysis = JSON.parse(text)
    } catch (parseError) {
      // Try to extract JSON from text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse AI response as JSON')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: analysis 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error analyzing food:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze food',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
