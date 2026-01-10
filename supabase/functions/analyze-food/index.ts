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
    console.log('=== ANALYZE-FOOD FUNCTION STARTED ===')
    console.log('Request method:', req.method)

    const { imageData } = await req.json()
    console.log('Image data received:', imageData ? 'YES' : 'NO')

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

    // Check if GEMINI_API_KEY is available
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

    // Initialize Gemini AI
    console.log('Initializing Gemini AI...')
    const genAI = new GoogleGenerativeAI(geminiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Extract and validate image data
    console.log('Processing image data...')
    const base64Data = imageData.split(',')[1]
    const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg'
    console.log('Image MIME type:', mimeType)
    console.log('Base64 data length:', base64Data.length)

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]

    const prompt = `
      Analise esta imagem de comida e responda em JSON.
      IMPORTANTE: Todos os campos de texto (name, portion, description, mealType) DEVEM obrigatoriamente estar em Português do Brasil (PT-BR). Mesmo que o alimento seja internacional, use o nome comum em português.

      Exemplo de formato esperado:
      {
        "foods": [
          {
            "name": "Ovo Cozido",
            "calories": 78,
            "protein": 6,
            "carbs": 0.6,
            "fats": 5,
            "portion": "1 unidade"
          }
        ],
        "totalCalories": 78,
        "totalProtein": 6,
        "totalCarbs": 0.6,
        "totalFats": 5,
        "mealType": "café da manhã",
        "description": "Um ovo cozido inteiro com gema firme."
      }
      
      Seja específico nas porções e valores nutricionais.
    `

    console.log('Calling Gemini AI...')
    const result = await model.generateContent([prompt, ...imageParts])
    const response = await result.response
    const text = response.text()
    console.log('Gemini response length:', text.length)

    // Parse response with better error handling
    let analysis
    try {
      analysis = JSON.parse(text)
      console.log('Successfully parsed JSON')
    } catch (parseError) {
      console.log('JSON parse failed, trying regex extraction...')
      // Try to extract JSON from text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
        console.log('Successfully extracted JSON with regex')
      } else {
        console.log('Failed to extract JSON, response was:', text)
        throw new Error('Failed to parse AI response as JSON')
      }
    }

    console.log('Analysis completed successfully')
    console.log('=== ANALYZE-FOOD FUNCTION COMPLETED ===')
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
    console.error('=== ANALYZE-FOOD FUNCTION ERROR ===')
    console.error('Error analyzing food:', error)
    console.error('Error stack:', error.stack)
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
