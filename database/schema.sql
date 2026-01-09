-- Criação das tabelas para o FitCoach Pro no Supabase

-- Tabela de perfis de usuário
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('MALE', 'FEMALE')),
  height DECIMAL(5,2), -- em cm
  weight DECIMAL(5,2), -- em kg
  goal TEXT CHECK (goal IN ('WEIGHT_LOSS', 'MUSCLE_GAIN')),
  activity_level TEXT CHECK (activity_level IN ('SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'SUPER_ACTIVE')),
  experience_level TEXT CHECK (experience_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  workout_frequency INTEGER, -- dias por semana
  workout_days INTEGER[], -- array com dias da semana [0,1,2,3,4,5,6] onde 0 = domingo
  workout_split TEXT CHECK (workout_split IN ('FULL_BODY', 'AB', 'ABC', 'ABCD', 'ABCDE', 'PPL_2X')),
  food_preferences TEXT[], -- array de preferências alimentares
  food_restrictions TEXT[], -- array de restrições alimentares
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de planos de usuário
CREATE TABLE user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nutrition_plan JSONB NOT NULL, -- NutritionPlan em JSON
  workout_plan JSONB NOT NULL, -- WorkoutPlan em JSON
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de registros de treino
CREATE TABLE workout_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  workout_session JSONB NOT NULL, -- WorkoutSession em JSON
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de registros nutricionais
CREATE TABLE nutrition_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  meals_consumed JSONB NOT NULL, -- Array de Meal em JSON
  total_calories INTEGER NOT NULL,
  total_protein DECIMAL(8,2) NOT NULL,
  total_carbs DECIMAL(8,2) NOT NULL,
  total_fats DECIMAL(8,2) NOT NULL,
  water_intake INTEGER NOT NULL, -- em ml
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX idx_user_plans_is_active ON user_plans(is_active);
CREATE INDEX idx_workout_records_user_id ON workout_records(user_id);
CREATE INDEX idx_workout_records_date ON workout_records(session_date);
CREATE INDEX idx_nutrition_records_user_id ON nutrition_records(user_id);
CREATE INDEX idx_nutrition_records_date ON nutrition_records(record_date);

-- RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_records ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies para user_plans
CREATE POLICY "Users can view own plans" ON user_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own plans" ON user_plans
  FOR ALL USING (auth.uid() = user_id);

-- Policies para workout_records
CREATE POLICY "Users can view own workout records" ON workout_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own workout records" ON workout_records
  FOR ALL USING (auth.uid() = user_id);

-- Policies para nutrition_records
CREATE POLICY "Users can view own nutrition records" ON nutrition_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own nutrition records" ON nutrition_records
  FOR ALL USING (auth.uid() = user_id);

-- Functions para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_plans_updated_at BEFORE UPDATE ON user_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_records_updated_at BEFORE UPDATE ON workout_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_records_updated_at BEFORE UPDATE ON nutrition_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
