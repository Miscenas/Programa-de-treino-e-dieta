
export enum Gender {
  Male = 'MALE',
  Female = 'FEMALE'
}

export enum Goal {
  WeightLoss = 'WEIGHT_LOSS',
  MuscleGain = 'MUSCLE_GAIN'
}

export enum ActivityLevel {
  Sedentary = 'SEDENTARY',
  LightlyActive = 'LIGHTLY_ACTIVE',
  ModeratelyActive = 'MODERATELY_ACTIVE',
  VeryActive = 'VERY_ACTIVE',
  SuperActive = 'SUPER_ACTIVE'
}

export enum ExperienceLevel {
  Beginner = 'BEGINNER',
  Intermediate = 'INTERMEDIATE',
  Advanced = 'ADVANCED'
}

export enum WorkoutSplit {
  FullBody = 'FULL_BODY',
  AB = 'AB', // Upper/Lower ou Full Body A/B
  ABC = 'ABC', // PPL ou Push/Pull/Legs
  ABCD = 'ABCD', // 4 Day Split
  ABCDE = 'ABCDE', // 5 Day Split
  PPL_2X = 'PPL_2X' // 6 Day
}

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  experienceLevel: ExperienceLevel;
  workoutFrequency: number;
  workoutDays: number[]; // 0 = Domingo, 1 = Segunda, etc.
  workoutSplit?: WorkoutSplit; // Opção escolhida pelo usuário
  foodPreferences: string[];
  foodRestrictions: string[];
}

export interface Ingredient {
  name: string;
  amount: string; // ex: "100g", "1 unidade"
}

export interface MealOption {
  id: string;
  name: string; // ex: "Opção Clássica"
  description: string;
  ingredients: Ingredient[]; // Lista exata de ingredientes com quantidades
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  options: MealOption[]; // Substitui suggestions
}

export interface ShoppingItem {
  name: string;
  category: 'Proteína' | 'Carboidrato' | 'Vegetais & Frutas' | 'Outros';
  quantity: number; // Mudado para number para permitir soma
  unit: string;
  checked?: boolean;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string; 
  method?: string; 
  notes?: string; 
}

export interface WorkoutSession {
  dayName: string;
  focus: string;
  exercises: Exercise[];
  completed: boolean;
}

export interface NutritionPlan {
  bmr: number;
  tdee: number;
  targetCalories: number;
  waterIntake: number;
  meals: Meal[];
  // shoppingList removido daqui pois será calculado dinamicamente no frontend
}

export interface WorkoutPlan {
  weeklySchedule: WorkoutSession[];
  methodology: string; 
}

export interface FullPlan {
  nutrition: NutritionPlan;
  workout: WorkoutPlan;
  generatedAt: Date;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portion: string;
  category: 'meal' | 'snack' | 'drink' | 'junk';
}

// Supabase database types
export interface Profile {
  id: string;
  email: string;
  name: string;
  age?: number;
  gender?: Gender;
  height?: number;
  weight?: number;
  goal?: Goal;
  activity_level?: ActivityLevel;
  experience_level?: ExperienceLevel;
  workout_frequency?: number;
  workout_days?: number[];
  workout_split?: WorkoutSplit;
  food_preferences?: string[];
  food_restrictions?: string[];
  created_at: string;
  updated_at: string;
}

export interface UserPlan {
  id: string;
  user_id: string;
  nutrition_plan: NutritionPlan;
  workout_plan: WorkoutPlan;
  generated_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutRecord {
  id: string;
  user_id: string;
  session_date: string;
  workout_session: WorkoutSession;
  completed: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NutritionRecord {
  id: string;
  user_id: string;
  record_date: string;
  meals_consumed: Meal[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  water_intake: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}