import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const { content, type, distributeByDays = true } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
      Você é um assistente especialista em fitness e nutrição. 
      Sua tarefa é extrair informações de um documento e converter para um objeto JSON RIGOROSO seguindo este formato:
      
      {
        "nutrition": {
          "targetCalories": 2000,
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
                  "name": "Opção Padrão",
                  "description": "Ex: Ovos e Fruta",
                  "ingredients": [
                    { "name": "Ovo", "amount": "2 unid" }
                  ],
                  "calories": 400,
                  "macros": { "protein": 30, "carbs": 40, "fats": 10 }
                }
              ]
            },
            {
              "id": "2",
              "name": "Almoço",
              "time": "12:30",
              "calories": 600,
              "macros": { "protein": 40, "carbs": 60, "fats": 20 },
              "options": [
                {
                  "id": "opt-2",
                  "name": "Padrão",
                  "description": "Frango, Arroz e Feijão",
                  "ingredients": [
                    { "name": "Frango", "amount": "150g" }
                  ],
                  "calories": 600,
                  "macros": { "protein": 40, "carbs": 60, "fats": 20 }
                }
              ]
            }
          ]
        },
        "workout": {
          "methodology": "Breve explicação",
          "weeklySchedule": [
            {
              "dayName": "Segunda-feira",
              "focus": "Peito e Tríceps",
              "exercises": [
                { "name": "Supino", "sets": 3, "reps": "12", "rest": "60s", "notes": "" }
              ]
            }
          ]
        },
        "generatedAt": "${new Date().toISOString()}"
      }

      REGRAS CRÍTICAS DE DISTRIBUIÇÃO:
      ${distributeByDays ? `
      1. TREINO: Não coloque tudo em um dia só. Distribua os treinos no "weeklySchedule" (Segunda, Terça, Quarta, Quinta, Sexta, Sábado).
      2. DIETA: Se houver variações para dias diferentes, use o array "options" dentro de cada "meal". Dê nomes às opções como "Segunda", "Terça", etc. se forem específicas por dia.
      ` : `
      1. TREINO: Se houver uma lista de treinos (ex: A, B, C), tente agrupá-los ou distribui-los de forma equilibrada no "weeklySchedule", mas para NUTRICAO (DIETA), use as opções apenas como alternativas gerais.
      2. DIETA: NÃO coloque nomes de dias da semana nas opções (ex: evite "Opção Segunda"). Use nomes descritivos como "Opção 1", "Panqueca", "Frango", etc. O usuário quer um menu fixo alternável, não um rígido por dia.
      `}
      3. Se o documento for longo (múltiplas páginas), processe TUDO para garantir que o plano completo seja montado.
      4. SELETIVIDADE CRÍTICA: 
         - Se o documento contiver APENAS TREINO, deixe "nutrition.meals" como um array VAZIO [].
         - Se o documento contiver APENAS DIETA, deixe "workout.weeklySchedule" como um array VAZIO [].
         - NUNCA invente refeições ou exercícios que não existam no texto/imagem fornecido.
      5. Idioma: Português (PT-BR). APENAS JSON puro.
    `;

    let result;
    if (type === 'image') {
      let base64Data = content;
      let mimeType = 'application/pdf';
      if (content.includes(';base64,')) {
        const parts = content.split(';base64,');
        base64Data = parts[1];
        mimeType = parts[0].split(':')[1];
      }
      result = await model.generateContent([prompt, { inlineData: { data: base64Data, mimeType } }]);
    } else {
      result = await model.generateContent(prompt + "\n\nCONTEÚDO:\n" + content);
    }

    const response = await result.response;
    const text = response.text();

    let analysis;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : text);

      // Validação de estrutura mínima para evitar crashes
      if (analysis.nutrition && analysis.nutrition.meals) {
        analysis.nutrition.meals = analysis.nutrition.meals.map((meal: any, idx: number) => ({
          ...meal,
          id: meal.id || `meal-${idx}`,
          options: meal.options || (meal.ingredients ? [{
            id: `opt-${idx}`,
            name: 'Padrão',
            description: 'Extraído do plano',
            ingredients: meal.ingredients,
            calories: meal.calories,
            macros: meal.macros
          }] : [])
        }));
      }

      if (analysis.workout && !analysis.workout.weeklySchedule) {
        analysis.workout.weeklySchedule = [];
      }
    } catch (e) {
      throw new Error("Erro ao validar estrutura do plano extraído.");
    }

    return new Response(
      JSON.stringify({ success: true, data: analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Function error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
