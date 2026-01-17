import {
  UserProfile,
  Gender,
  Goal,
  ActivityLevel,
  FullPlan,
  NutritionPlan,
  WorkoutPlan,
  WorkoutSession,
  Meal,
  Exercise,
  WorkoutSplit,
  MealOption,
  Ingredient
} from '../types';

// --- Nutrition Engine ---

const calculateBMR = (user: UserProfile): number => {
  let bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age);
  if (user.gender === Gender.Male) {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  return Math.round(bmr);
};

const getActivityMultiplier = (level: ActivityLevel): number => {
  switch (level) {
    case ActivityLevel.Sedentary: return 1.2;
    case ActivityLevel.LightlyActive: return 1.375;
    case ActivityLevel.ModeratelyActive: return 1.55;
    case ActivityLevel.VeryActive: return 1.725;
    case ActivityLevel.SuperActive: return 1.9;
    default: return 1.2;
  }
};

// Helper para categorizar ingredientes
export const getIngredientCategory = (name: string): 'Proteína' | 'Carboidrato' | 'Vegetais & Frutas' | 'Outros' => {
  const n = name.toLowerCase();
  if (n.includes('frango') || n.includes('carne') || n.includes('ovo') || n.includes('whey') || n.includes('queijo') || n.includes('iogurte') || n.includes('peixe') || n.includes('presunto') || n.includes('atum') || n.includes('leite')) return 'Proteína';
  if (n.includes('arroz') || n.includes('feijão') || n.includes('pão') || n.includes('tapioca') || n.includes('cuscuz') || n.includes('aveia') || n.includes('batata') || n.includes('macarrão') || n.includes('mandioca') || n.includes('biscoito') || n.includes('goma') || n.includes('purê') || n.includes('milho') || n.includes('farinha')) return 'Carboidrato';
  if (n.includes('banana') || n.includes('maçã') || n.includes('alface') || n.includes('tomate') || n.includes('cenoura') || n.includes('brócolis') || n.includes('fruta') || n.includes('salada') || n.includes('legumes') || n.includes('abobrinha') || n.includes('couve')) return 'Vegetais & Frutas';
  return 'Outros';
};

// Gera opções de Café da Manhã estruturadas
const getBreakfastOptions = (cals: number, prefs?: string[]): MealOption[] => {
  const opts: MealOption[] = [];
  const highCal = cals > 400;

  // Opção 1: Clássica (Pão com Ovos) - Default ou pref_bread
  if (!prefs || prefs.length === 0 || prefs.includes('pref_bread')) {
    opts.push({
      id: 'b-classic',
      name: 'Clássico (Pão com Ovos)',
      description: highCal ? "Pão, ovos e queijo reforçados." : "Pão na chapa e ovos.",
      ingredients: [
        { name: "Pão Francês ou Integral", amount: highCal ? "2 unidades" : "1 unidade" },
        { name: "Ovos", amount: highCal ? "3 unidades (mexidos)" : "2 unidades (mexidos)" },
        { name: highCal ? "Queijo Mussarela" : "Requeijão Light", amount: highCal ? "2 fatias" : "1 ponta de faca" },
        { name: "Café com Leite", amount: "1 xícara (200ml)" }
      ]
    });
  }

  // Opção 2: Regional (Cuscuz/Tapioca) - pref_tapioca
  if (!prefs || prefs.length === 0 || prefs.includes('pref_tapioca')) {
    opts.push({
      id: 'b-regional',
      name: 'Regional (Cuscuz/Tapioca)',
      description: highCal ? "Cuscuz/Tapioca recheada." : "Cuscuz/Tapioca simples.",
      ingredients: [
        { name: "Goma de Tapioca ou Flocão", amount: highCal ? "100g (Goma) ou 80g (Flocão)" : "60g (Goma) ou 50g (Flocão)" },
        { name: highCal ? "Peito de Frango Desfiado" : "Ovos", amount: highCal ? "100g" : "2 unidades" },
        { name: highCal ? "Queijo Coalho" : "Manteiga", amount: highCal ? "1 fatia grossa" : "1 colher de chá" },
        { name: "Café Preto", amount: "1 xícara" }
      ]
    });
  }

  // Opção 3: Mingau (Conforto) - pref_porridge
  if (!prefs || prefs.length === 0 || prefs.includes('pref_porridge')) {
    opts.push({
      id: 'b-porridge',
      name: 'Mingau de Aveia',
      description: "Opção quente e saciante.",
      ingredients: [
        { name: "Aveia em Flocos", amount: highCal ? "60g (6 col. sopa)" : "30g (3 col. sopa)" },
        { name: "Leite Desnatado/Vegetal", amount: "200ml" },
        { name: "Whey Protein (Opcional)", amount: highCal ? "1 dose (30g)" : "Meia dose (15g)" },
        { name: "Banana Picada", amount: "1 unidade" },
        { name: "Canela em pó", amount: "a gosto" }
      ]
    });
  }

  // Opção 4: Crepioca (Proteica) - pref_pancake
  if (!prefs || prefs.length === 0 || prefs.includes('pref_pancake')) {
    opts.push({
      id: 'b-crepioca',
      name: 'Crepioca Recheada',
      description: "Massa feita com ovo e tapioca.",
      ingredients: [
        { name: "Ovos", amount: "2 unidades" },
        { name: "Goma de Tapioca", amount: highCal ? "40g (2 col. sopa)" : "20g (1 col. sopa)" },
        { name: "Requeijão Light", amount: "1 col. sopa (na massa)" },
        { name: "Peito de Peru ou Frango", amount: highCal ? "4 fatias/80g" : "2 fatias/40g" }
      ]
    });
  }

  // Opção 5: Doce Fit (Panqueca de Banana) - pref_pancake
  if (!prefs || prefs.length === 0 || prefs.includes('pref_pancake')) {
    opts.push({
      id: 'b-pancake',
      name: 'Panqueca de Banana Fit',
      description: "Para quem gosta de doce pela manhã.",
      ingredients: [
        { name: "Banana Amassada", amount: highCal ? "2 unidades" : "1 unidade" },
        { name: "Ovos", amount: "2 unidades" },
        { name: "Aveia em Flocos Finos", amount: highCal ? "30g" : "15g" },
        { name: "Mel", amount: "1 fio" }
      ]
    });
  }

  // Fallback se não sobrou nada (ex: usuario desmarcou tudo)
  if (opts.length === 0) {
    opts.push({
      id: 'b-fallback',
      name: 'Café Simples',
      description: "Opção básica de segurança.",
      ingredients: [
        { name: "Pão Integral", amount: "2 fatias" },
        { name: "Ovos Mexidos", amount: "2 unidades" }
      ]
    });
  }

  return opts;
};

// Gera opções de Almoço/Jantar
const getMainMealOptions = (cals: number, isDinner: boolean, prefs?: string[]): MealOption[] => {
  const opts: MealOption[] = [];
  const highCal = cals > 500;

  // Calcula porções baseadas em calorias
  const carbAmount = highCal ? "200g (8 col. sopa)" : "100g (4 col. sopa)";
  const beanAmount = "1 concha média";
  const proteinAmount = highCal ? "150g (pesado cru)" : "120g (pesado cru)";
  const vegAmount = "À vontade (min. meio prato)";

  // Opção 1: O PF Brasileiro - pref_rice_beans
  if (!prefs || prefs.length === 0 || prefs.includes('pref_rice_beans')) {
    opts.push({
      id: isDinner ? 'd-pf' : 'l-pf',
      name: 'PF Brasileiro Tradicional',
      description: "O arroz e feijão nosso de cada dia.",
      ingredients: [
        { name: "Arroz Branco/Integral", amount: carbAmount },
        { name: "Feijão Carioca", amount: beanAmount },
        { name: "Peito de Frango ou Patinho", amount: proteinAmount },
        { name: "Salada Variada", amount: vegAmount }
      ]
    });
  }

  // Opção 2: Raízes & Grelhados - pref_roots
  if (!prefs || prefs.length === 0 || prefs.includes('pref_roots')) {
    opts.push({
      id: isDinner ? 'd-roots' : 'l-roots',
      name: 'Raízes & Grelhado',
      description: "Carboidratos complexos de raízes.",
      ingredients: [
        { name: "Batata Doce/Inglesa/Mandioca", amount: highCal ? "250g" : "150g" },
        { name: "Peito de Frango ou Tilápia", amount: proteinAmount },
        { name: "Legumes no Vapor (Brócolis/Cenoura)", amount: "1 pires cheio" },
        { name: "Azeite de Oliva", amount: "1 fio (5ml)" }
      ]
    });
  }

  // Opção 3: Escondidinho (Variação) - pref_roots
  if (!prefs || prefs.length === 0 || prefs.includes('pref_roots')) {
    opts.push({
      id: isDinner ? 'd-hide' : 'l-hide',
      name: 'Escondidinho Fit',
      description: "Purê com carne moída magra.",
      ingredients: [
        { name: "Purê de Batata/Mandioca/Abóbora", amount: highCal ? "250g" : "160g" },
        { name: "Carne Moída (Patinho)", amount: proteinAmount },
        { name: "Queijo Mussarela (Gratinar)", amount: "1 fatia" },
        { name: "Salada Verde", amount: vegAmount }
      ]
    });
  }

  // Opção 4: Strogonoff Fit (Variação) - pref_rice_beans OR pref_pasta
  if (!prefs || prefs.length === 0 || prefs.includes('pref_rice_beans') || prefs.includes('pref_pasta')) {
    opts.push({
      id: isDinner ? 'd-strogo' : 'l-strogo',
      name: 'Strogonoff Fit',
      description: "Feito com iogurte ou creme de ricota.",
      ingredients: [
        { name: "Arroz Branco", amount: carbAmount },
        { name: "Peito de Frango em Cubos", amount: proteinAmount },
        { name: "Molho de Tomate Natural", amount: "4 col. sopa" },
        { name: "Creme de Ricota ou Iogurte Natural", amount: "2 col. sopa (misturar no fim)" },
        { name: "Batata Palha (Moderação)", amount: "1 punhado pequeno" }
      ]
    });
  }

  // Opção 5: Massa ou Omelete
  if (!isDinner) {
    // Almoço: Massa - pref_pasta
    if (!prefs || prefs.length === 0 || prefs.includes('pref_pasta')) {
      opts.push({
        id: 'l-pasta',
        name: 'Macarrão à Bolonhesa',
        description: "Energia rápida.",
        ingredients: [
          { name: "Macarrão", amount: highCal ? "200g (cozido)" : "100g (cozido)" },
          { name: "Carne Moída (Patinho)", amount: proteinAmount },
          { name: "Molho de Tomate", amount: "4 colheres de sopa" },
          { name: "Queijo Parmesão", amount: "1 colher chá" }
        ]
      });
    }
  } else {
    // Jantar: Omelete/Wrap - pref_bread (assume que quem gosta de pão gosta de wrap/omelete) OR Default
    opts.push({
      id: 'd-omelet',
      name: 'Omelete Turbinado',
      description: "Leve e fácil digestão.",
      ingredients: [
        { name: "Ovos", amount: highCal ? "4 unidades" : "3 unidades" },
        { name: "Aveia em Flocos (na massa)", amount: "1 col. sopa" },
        { name: "Recheio: Frango/Queijo/Atum", amount: "3 col. sopa" },
        { name: "Salada Colorida", amount: "1 prato cheio" }
      ]
    });
  }

  // Fallback
  if (opts.length === 0) {
    opts.push({
      id: 'main-fallback',
      name: 'Prato Feito Simples',
      description: "Arroz, feijão e proteína.",
      ingredients: [
        { name: "Arroz", amount: "100g" },
        { name: "Feijão", amount: "1 concha" },
        { name: "Frango", amount: "120g" }
      ]
    });
  }

  return opts;
};

// Gera opções de Lanche
const getSnackOptions = (cals: number, prefs?: string[]): MealOption[] => {
  const opts: MealOption[] = [];
  const highCal = cals > 300;

  // Opção 1: Fruta e Lácteo - pref_dairy
  if (!prefs || prefs.length === 0 || prefs.includes('pref_dairy')) {
    opts.push({
      id: 's-light',
      name: 'Iogurte com Fruta',
      description: "Opção rápida e digestiva.",
      ingredients: [
        { name: "Frutas (Maçã/Pera/Banana)", amount: highCal ? "2 unidades" : "1 unidade" },
        { name: "Iogurte Natural", amount: "1 pote (170g)" },
        ...(highCal ? [{ name: "Granola/Castanhas", amount: "30g" }] : [])
      ]
    });
  }

  // Opção 2: Sanduíche - pref_sandwich
  if (!prefs || prefs.length === 0 || prefs.includes('pref_sandwich')) {
    opts.push({
      id: 's-sandwich',
      name: 'Sanduíche Natural',
      description: "Lanche salgado prático.",
      ingredients: [
        { name: "Pão de Forma Integral", amount: "2 fatias" },
        { name: "Pasta de Atum ou Frango Desfiado", amount: highCal ? "4 col. sopa" : "2 col. sopa" },
        { name: "Alface e Tomate", amount: "a gosto" }
      ]
    });
  }

  // Opção 3: Shake - pref_shakes
  if (!prefs || prefs.length === 0 || prefs.includes('pref_shakes')) {
    opts.push({
      id: 's-shake',
      name: 'Vitamina Proteica',
      description: "Para quem está na correria.",
      ingredients: [
        { name: "Whey Protein", amount: "1 dose (30g)" },
        { name: "Leite Desnatado/Água", amount: "250ml" },
        { name: "Fruta (Banana/Morango/Abacate)", amount: highCal ? "1 unidade + 1 col. pasta de amendoim" : "1 unidade" }
      ]
    });
  }

  // Opção 4: Ovos com Torrada - pref_bread (assume que quem gosta de pão gosta de torrada)
  if (!prefs || prefs.length === 0 || prefs.includes('pref_bread')) {
    opts.push({
      id: 's-eggs',
      name: 'Ovos com Torrada',
      description: "Salgado e saciante.",
      ingredients: [
        { name: "Ovos Cozidos", amount: highCal ? "3 unidades" : "2 unidades" },
        { name: "Torradas Integrais", amount: highCal ? "4 unidades" : "2 unidades" },
        { name: "Azeite/Orégano", amount: "fio" }
      ]
    });
  }

  // Fallback
  if (opts.length === 0) {
    opts.push({
      id: 'snack-fallback',
      name: 'Mix de Castanhas e Fruta',
      description: "Opção prática.",
      ingredients: [
        { name: "Castanha do Pará/Caju", amount: "30g" },
        { name: "Maçã", amount: "1 unidade" }
      ]
    });
  }

  return opts;
};

const generateNutritionPlan = (user: UserProfile, bmr: number): NutritionPlan => {
  const activityMultiplier = getActivityMultiplier(user.activityLevel);
  const tdee = Math.round(bmr * activityMultiplier);
  let targetCalories = tdee;

  if (user.targetDeficit !== undefined) {
    targetCalories = tdee + user.targetDeficit;
  } else if (user.goal === Goal.WeightLoss) {
    targetCalories -= 500;
  } else {
    targetCalories += 300;
  }

  if (user.gender === Gender.Female && targetCalories < 1200) targetCalories = 1200;
  if (user.gender === Gender.Male && targetCalories < 1500) targetCalories = 1500;

  const waterIntake = Math.round(user.weight * 35);

  const mealRatios = [0.25, 0.35, 0.15, 0.25];
  const mealNames = ["Café da Manhã", "Almoço", "Lanche da Tarde", "Jantar"];
  const mealTimes = ["07:30", "12:30", "16:30", "20:00"];

  const meals: Meal[] = mealNames.map((name, index) => {
    const cals = Math.round(targetCalories * mealRatios[index]);

    const p = Math.round((cals * 0.3) / 4);
    const c = Math.round((cals * 0.4) / 4);
    const f = Math.round((cals * 0.3) / 9);

    let options: MealOption[] = [];

    if (index === 0) { // Café
      options = getBreakfastOptions(cals, user.foodPreferences);
    } else if (index === 1) { // Almoço
      options = getMainMealOptions(cals, false, user.foodPreferences);
    } else if (index === 3) { // Jantar
      options = getMainMealOptions(cals, true, user.foodPreferences);
    } else { // Lanche
      options = getSnackOptions(cals, user.foodPreferences);
    }

    return {
      id: `meal-${index}`,
      name,
      time: mealTimes[index],
      calories: cals,
      macros: { protein: p, carbs: c, fats: f },
      options
    };
  });

  return { bmr, tdee, targetCalories, waterIntake, meals };
};

// --- WORKOUT ENGINE PRO ---

const generateWorkoutPlan = (user: UserProfile): WorkoutPlan => {
  const schedule: WorkoutSession[] = [];
  const freq = user.workoutFrequency;
  const activeDays = user.workoutDays || [1, 3, 5]; // Default se não existir
  const split = user.workoutSplit || WorkoutSplit.FullBody;
  const isHypertrophy = user.goal === Goal.MuscleGain;

  const restTime = isHypertrophy ? "60-90s" : "45-60s";

  const ex = (name: string, sets: number, reps: string, notes: string = "", method: string = ""): Exercise => ({
    name, sets, reps, rest: restTime, notes, method
  });

  const warmUp = (muscleGroup: string): Exercise => ({
    name: `Aquecimento de ${muscleGroup} (Manguito/Mobilidade)`,
    sets: 2,
    reps: "15-20",
    rest: "30s",
    notes: "Carga leve, foco em ativar a articulação.",
    method: "Aquecimento"
  });

  const cardio = user.goal === Goal.WeightLoss
    ? ex("Cardio Moderado (Esteira/Elíptico)", 1, "20-30 min", "Mantenha FC entre 120-140bpm")
    : ex("Cardio Leve", 1, "10-15 min", "Caminhada rápida apenas para saúde cardiovascular");

  // --- BIBLIOTECA DE TREINOS ---

  // FULL BODY
  const fullBodyA = [
    warmUp("Geral"),
    ex("Agachamento Livre (ou Globet)", 3, "10-12", "Pés na largura dos ombros."),
    ex("Supino Reto com Halteres", 3, "10-12", "Alongue bem o peitoral na descida."),
    ex("Puxada Alta (Polia)", 3, "10-12", "Segure 1s lá embaixo."),
    ex("Desenvolvimento Militar", 3, "10-12", "Cuidado com a lombar."),
    ex("Prancha Abdominal", 3, "30-45s", "Contraia o abdômen o tempo todo.")
  ];

  const fullBodyB = [
    warmUp("Geral"),
    ex("Leg Press 45º", 3, "10-12", "Não estenda o joelho totalmente."),
    ex("Remada Curvada", 3, "10-12", "Mantenha a coluna reta."),
    ex("Flexão de Braço", 3, "Falha", "Se precisar, apoie os joelhos."),
    ex("Elevação Lateral", 3, "12-15", "Controle a descida."),
    ex("Abdominal Supra", 3, "15-20", "Solte o ar ao subir.")
  ];

  // UPPER / LOWER
  const upper1 = [
    warmUp("Ombros"),
    ex("Supino Reto Barra", 4, "8-10", "Carga moderada/alta."),
    ex("Remada Curvada Pronada", 4, "8-10", "Foco na espessura das costas."),
    ex("Desenvolvimento Halteres", 3, "10-12", "Banco a 75 graus."),
    ex("Elevação Lateral", 3, "12-15", "Drop-set na última.", "Drop-set"),
    ex("Tríceps Corda", 3, "12-15", "Esmague o tríceps no final."),
    ex("Rosca Direta Barra W", 3, "10-12", "Sem balançar o tronco.")
  ];

  const lower1 = [
    warmUp("Quadril/Joelhos"),
    ex("Agachamento Livre", 4, "6-8", "Foco em força. Descanso maior (2min).", "Força"),
    ex("Leg Press 45", 3, "10-12", "Amplitude máxima."),
    ex("Stiff com Halteres", 3, "10-12", "Sinta o posterior alongar."),
    ex("Cadeira Extensora", 3, "12-15", "Segure 2s no topo.", "Pico de Contração"),
    ex("Panturrilha Sentado", 4, "15", "Movimento completo.")
  ];

  // ABC (PUSH / PULL / LEGS)
  const push = [
    warmUp("Ombros/Peito"),
    ex("Supino Inclinado Halteres", 4, "8-10", "Foco na porção superior."),
    ex("Crucifixo Máquina", 3, "10-12", "Foque no alongamento."),
    ex("Desenvolvimento Máquina", 3, "10-12", ""),
    ex("Elevação Lateral Polia", 3, "12-15", "Tensão constante."),
    ex("Tríceps Testa", 4, "10-12", "Cotovelos fechados."),
  ];
  const pull = [
    warmUp("Costas"),
    ex("Puxada Frente Aberta", 4, "8-10", "Inicie o movimento pelas escápulas."),
    ex("Remada Baixa Triângulo", 3, "10-12", "Alongue bem a dorsal."),
    ex("Face Pull", 3, "15", "Foco em posterior de ombro."),
    ex("Rosca Alternada", 3, "10-12", "Rotação de punho."),
    ex("Rosca Martelo", 3, "12", "Foco em braquial."),
  ];
  const legs = [
    warmUp("Pernas"),
    ex("Agachamento Livre", 4, "8-10", "A rainha dos exercícios."),
    ex("Afundo (Passada)", 3, "10 cada", "Passada larga para glúteo."),
    ex("Mesa Flexora", 4, "12-15", "Não levante o quadril do banco."),
    ex("Cadeira Extensora", 3, "15", "Rest-pause na última.", "Rest-Pause"),
    ex("Panturrilha em Pé", 4, "15-20", "Pausa de 1s embaixo."),
  ];

  // ABCD - DIVISÃO ESPECÍFICA (4 DIAS)
  const abcdA = [
    warmUp("Peito"),
    ex("Supino Reto Barra", 4, "8-10", "Carga alta."),
    ex("Supino Inclinado Halteres", 3, "10-12", ""),
    ex("Crucifixo", 3, "12", "Foco no alongamento."),
    ex("Tríceps Testa", 4, "10-12", ""),
    ex("Tríceps Pulley", 3, "12-15", "Drop-set na última.", "Drop-set")
  ];
  const abcdB = [
    warmUp("Costas"),
    ex("Levantamento Terra (ou Meio)", 3, "6-8", "Cuidado com a postura."),
    ex("Puxada Alta", 4, "10", ""),
    ex("Remada Baixa", 3, "12", "Segura 1s."),
    ex("Rosca Direta", 4, "10", "Barra reta."),
    ex("Rosca Scott", 3, "12", "Pico de contração.", "Pico")
  ];
  const abcdC = [
    warmUp("Pernas"),
    ex("Agachamento Livre", 4, "8-10", ""),
    ex("Leg Press 45", 4, "10-12", ""),
    ex("Cadeira Extensora", 3, "15", ""),
    ex("Mesa Flexora", 4, "12", ""),
    ex("Stiff", 3, "10-12", ""),
    ex("Panturrilha", 5, "15", "Volume alto.")
  ];
  const abcdD = [
    warmUp("Ombros"),
    ex("Desenvolvimento Militar", 4, "8-10", ""),
    ex("Elevação Lateral", 4, "12-15", ""),
    ex("Elevação Frontal", 3, "12", ""),
    ex("Crucifixo Inverso", 3, "15", "Posterior de ombro."),
    ex("Encolhimento com Halteres", 4, "15", "Segura 2s em cima."),
    ex("Abdominal Supra", 4, "20", "")
  ];

  // ABCDE (5 DIAS)
  const chestDay = [...abcdA];
  const backDay = [...abcdB];
  const legDay = [...abcdC];
  const shoulderDay = [...abcdD];
  const armDay = [
    warmUp("Braços"),
    ex("Rosca Direta", 3, "10", ""),
    ex("Tríceps Testa", 3, "10", ""),
    ex("Rosca Alternada", 3, "12", ""),
    ex("Tríceps Francês", 3, "12", ""),
    ex("Rosca Martelo", 3, "15", "Bi-set com Tríceps Corda", "Bi-set"),
    ex("Tríceps Corda", 3, "15", "Bi-set com Martelo", "Bi-set")
  ];

  // --- LOGICA DE MONTAGEM DO CALENDÁRIO ---

  // 1. Definir os templates de treino disponíveis baseados no split
  let sessionTemplates: { focus: string, exercises: Exercise[] }[] = [];
  let methodologyName = "";

  if (split === WorkoutSplit.FullBody) {
    methodologyName = "Full Body (A/B)";
    sessionTemplates = [
      { focus: "Full Body A", exercises: fullBodyA },
      { focus: "Full Body B", exercises: fullBodyB }
    ];
  } else if (split === WorkoutSplit.AB) {
    methodologyName = "Upper / Lower";
    sessionTemplates = [
      { focus: "Superiores", exercises: upper1 },
      { focus: "Inferiores", exercises: lower1 }
    ];
  } else if (split === WorkoutSplit.ABC) {
    methodologyName = "Push / Pull / Legs";
    sessionTemplates = [
      { focus: "Empurrar", exercises: push },
      { focus: "Puxar", exercises: pull },
      { focus: "Pernas", exercises: legs }
    ];
  } else if (split === WorkoutSplit.ABCD) {
    methodologyName = "ABCD (Grupos)";
    sessionTemplates = [
      { focus: "Peito e Tríceps", exercises: abcdA },
      { focus: "Costas e Bíceps", exercises: abcdB },
      { focus: "Pernas", exercises: abcdC },
      { focus: "Ombros e Trapézio", exercises: abcdD }
    ];
  } else if (split === WorkoutSplit.ABCDE) {
    methodologyName = "ABCDE (Body Part Split)";
    sessionTemplates = [
      { focus: "Peitoral", exercises: chestDay },
      { focus: "Dorsal", exercises: backDay },
      { focus: "Pernas", exercises: legDay },
      { focus: "Ombros", exercises: shoulderDay },
      { focus: "Braços", exercises: armDay }
    ];
  } else if (split === WorkoutSplit.PPL_2X) {
    methodologyName = "PPL 2x";
    sessionTemplates = [
      { focus: "Empurrar", exercises: push },
      { focus: "Puxar", exercises: pull },
      { focus: "Pernas", exercises: legs }
    ];
  }

  // 2. Mapear os dias da semana (0 = Domingo) e preencher
  const daysOfWeek = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  // Controle de qual template usar (para rotacionar: A, B, A, B...)
  let templateIndex = 0;

  for (let i = 0; i < 7; i++) {
    const isWorkoutDay = activeDays.includes(i);
    const dayName = daysOfWeek[i];

    if (isWorkoutDay) {
      // Pega o template atual e avança o índice
      const template = sessionTemplates[templateIndex % sessionTemplates.length];
      templateIndex++;

      schedule.push({
        dayName,
        focus: template.focus,
        exercises: [...template.exercises, cardio],
        completed: false
      });
    } else {
      // Dia de Descanso
      schedule.push({
        dayName,
        focus: "Descanso / Recuperação",
        exercises: [],
        completed: false
      });
    }
  }

  return { weeklySchedule: schedule, methodology: methodologyName };
};

export const generatePlan = (user: UserProfile): FullPlan => {
  const bmr = calculateBMR(user);
  return {
    nutrition: generateNutritionPlan(user, bmr),
    workout: generateWorkoutPlan(user),
    generatedAt: new Date()
  };
};