export interface LibraryExercise {
  id: string;
  name: string;
  group: string;
  defaultSets: number;
  defaultReps: string;
  defaultRest: string;
}

export const exerciseDatabase: LibraryExercise[] = [
  // --- PEITO ---
  { id: 'ch-1', name: 'Supino Reto (Barra)', group: 'Peito', defaultSets: 3, defaultReps: '8-10', defaultRest: '60-90s' },
  { id: 'ch-2', name: 'Supino Reto (Halteres)', group: 'Peito', defaultSets: 3, defaultReps: '10-12', defaultRest: '60s' },
  { id: 'ch-3', name: 'Supino Inclinado (Halteres)', group: 'Peito', defaultSets: 3, defaultReps: '10-12', defaultRest: '60s' },
  { id: 'ch-4', name: 'Crucifixo (Máquina/Peck Deck)', group: 'Peito', defaultSets: 3, defaultReps: '12-15', defaultRest: '45s' },
  { id: 'ch-5', name: 'Flexão de Braço', group: 'Peito', defaultSets: 3, defaultReps: 'Falha', defaultRest: '60s' },
  { id: 'ch-6', name: 'Crossover (Polia Alta)', group: 'Peito', defaultSets: 3, defaultReps: '15', defaultRest: '45s' },

  // --- COSTAS ---
  { id: 'bk-1', name: 'Puxada Alta (Frente)', group: 'Costas', defaultSets: 3, defaultReps: '10-12', defaultRest: '60s' },
  { id: 'bk-2', name: 'Remada Curvada (Barra)', group: 'Costas', defaultSets: 3, defaultReps: '8-10', defaultRest: '90s' },
  { id: 'bk-3', name: 'Remada Baixa (Triângulo)', group: 'Costas', defaultSets: 3, defaultReps: '12', defaultRest: '60s' },
  { id: 'bk-4', name: 'Serrote (Remada Unilateral)', group: 'Costas', defaultSets: 3, defaultReps: '10-12', defaultRest: '45s' },
  { id: 'bk-5', name: 'Levantamento Terra', group: 'Costas', defaultSets: 3, defaultReps: '6-8', defaultRest: '120s' },
  { id: 'bk-6', name: 'Pulldown (Polia)', group: 'Costas', defaultSets: 3, defaultReps: '15', defaultRest: '45s' },

  // --- PERNAS (QUADRÍCEPS/POSTERIOR) ---
  { id: 'lg-1', name: 'Agachamento Livre', group: 'Pernas', defaultSets: 4, defaultReps: '8-10', defaultRest: '120s' },
  { id: 'lg-2', name: 'Leg Press 45º', group: 'Pernas', defaultSets: 4, defaultReps: '10-12', defaultRest: '90s' },
  { id: 'lg-3', name: 'Cadeira Extensora', group: 'Pernas', defaultSets: 3, defaultReps: '12-15', defaultRest: '60s' },
  { id: 'lg-4', name: 'Afundo / Passada', group: 'Pernas', defaultSets: 3, defaultReps: '10 cada', defaultRest: '60s' },
  { id: 'lg-5', name: 'Mesa Flexora', group: 'Pernas', defaultSets: 4, defaultReps: '12', defaultRest: '60s' },
  { id: 'lg-6', name: 'Stiff', group: 'Pernas', defaultSets: 3, defaultReps: '10-12', defaultRest: '90s' },
  { id: 'lg-7', name: 'Panturrilha em Pé', group: 'Pernas', defaultSets: 4, defaultReps: '15-20', defaultRest: '45s' },

  // --- OMBROS ---
  { id: 'sh-1', name: 'Desenvolvimento (Halteres)', group: 'Ombros', defaultSets: 3, defaultReps: '10-12', defaultRest: '60s' },
  { id: 'sh-2', name: 'Elevação Lateral', group: 'Ombros', defaultSets: 4, defaultReps: '12-15', defaultRest: '45s' },
  { id: 'sh-3', name: 'Elevação Frontal', group: 'Ombros', defaultSets: 3, defaultReps: '12', defaultRest: '45s' },
  { id: 'sh-4', name: 'Crucifixo Inverso', group: 'Ombros', defaultSets: 3, defaultReps: '15', defaultRest: '45s' },

  // --- BRAÇOS (BÍCEPS/TRÍCEPS) ---
  { id: 'ar-1', name: 'Rosca Direta (Barra)', group: 'Braços', defaultSets: 3, defaultReps: '10-12', defaultRest: '60s' },
  { id: 'ar-2', name: 'Rosca Martelo', group: 'Braços', defaultSets: 3, defaultReps: '12', defaultRest: '45s' },
  { id: 'ar-3', name: 'Rosca Scott', group: 'Braços', defaultSets: 3, defaultReps: '10-12', defaultRest: '60s' },
  { id: 'ar-4', name: 'Tríceps Testa', group: 'Braços', defaultSets: 3, defaultReps: '10-12', defaultRest: '60s' },
  { id: 'ar-5', name: 'Tríceps Corda', group: 'Braços', defaultSets: 3, defaultReps: '12-15', defaultRest: '45s' },
  { id: 'ar-6', name: 'Tríceps Banco', group: 'Braços', defaultSets: 3, defaultReps: 'Falha', defaultRest: '60s' },

  // --- ABDÔMEN ---
  { id: 'ab-1', name: 'Abdominal Supra (Chão)', group: 'Abdômen', defaultSets: 3, defaultReps: '20', defaultRest: '45s' },
  { id: 'ab-2', name: 'Prancha Isométrica', group: 'Abdômen', defaultSets: 3, defaultReps: '45s', defaultRest: '45s' },
  { id: 'ab-3', name: 'Abdominal Infra (Elevação de Pernas)', group: 'Abdômen', defaultSets: 3, defaultReps: '15', defaultRest: '45s' },

  // --- CARDIO ---
  { id: 'cd-1', name: 'Esteira (Caminhada Rápida)', group: 'Cardio', defaultSets: 1, defaultReps: '30 min', defaultRest: '-' },
  { id: 'cd-2', name: 'Esteira (Corrida)', group: 'Cardio', defaultSets: 1, defaultReps: '20 min', defaultRest: '-' },
  { id: 'cd-3', name: 'Bicicleta Ergométrica', group: 'Cardio', defaultSets: 1, defaultReps: '20 min', defaultRest: '-' },
  { id: 'cd-4', name: 'Elíptico', group: 'Cardio', defaultSets: 1, defaultReps: '20 min', defaultRest: '-' },
];