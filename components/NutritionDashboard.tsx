import React, { useState, useEffect } from 'react';
import { FoodCamera } from './FoodCamera';
import { DailySummary } from './DailySummary';
import { Plus, Calendar, Settings } from 'lucide-react';

interface MealAnalysis {
  foods: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    portion: string;
  }>;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  mealType: string;
  description: string;
}

export function NutritionDashboard() {
  const [meals, setMeals] = useState<MealAnalysis[]>([]);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [showMealSelector, setShowMealSelector] = useState(false);

  useEffect(() => {
    // Load saved meals from localStorage
    const savedMeals = localStorage.getItem('fitcoach_daily_meals');
    const savedGoal = localStorage.getItem('fitcoach_daily_goal');

    if (savedMeals) {
      setMeals(JSON.parse(savedMeals));
    }

    if (savedGoal) {
      setDailyGoal(parseInt(savedGoal));
    }
  }, []);

  useEffect(() => {
    // Save meals to localStorage whenever they change
    localStorage.setItem('fitcoach_daily_meals', JSON.stringify(meals));
  }, [meals]);

  useEffect(() => {
    // Save goal to localStorage
    localStorage.setItem('fitcoach_daily_goal', dailyGoal.toString());
  }, [dailyGoal]);

  const handleFoodAnalyzed = (analysis: MealAnalysis) => {
    setMeals(prev => [...prev, analysis]);
  };

  const addCustomMeal = (mealType: string) => {
    const customMeal: MealAnalysis = {
      foods: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      mealType,
      description: 'Refeição manual'
    };
    handleFoodAnalyzed(customMeal);
    setShowMealSelector(false);
  };

  const clearDailyMeals = () => {
    if (confirm('Tem certeza que deseja limpar todas as refeições de hoje?')) {
      setMeals([]);
    }
  };

  const mealTypes = ['Café da Manhã', 'Almoço', 'Jantar', 'Lanche'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8 border border-transparent dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                🍽️ NutriCoach Pro
              </h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {new Date().toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMealSelector(true)}
                className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm"
                title="Adicionar Refeição Manual"
              >
                <Plus className="w-6 h-6" />
              </button>

              <button
                onClick={clearDailyMeals}
                className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm"
                title="Limpar Refeições"
              >
                <Calendar className="w-6 h-6" />
              </button>

              <button
                className="bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 p-3 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors shadow-sm"
                title="Configurações"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Daily Summary */}
        <DailySummary meals={meals} dailyGoal={dailyGoal} />

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8 border border-transparent dark:border-gray-800">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">
            Adicionar Refeição
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mealTypes.map((mealType) => (
              <div key={mealType}>
                <FoodCamera
                  onFoodAnalyzed={(analysis) => handleFoodAnalyzed({ ...analysis, mealType })}
                  mealType={mealType}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Meal Selector Modal */}
        {showMealSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-transparent dark:border-gray-800">
              <h3 className="text-xl font-black mb-6 text-gray-900 dark:text-white">
                Adicionar Refeição Manual
              </h3>

              <div className="space-y-2">
                {mealTypes.map((mealType) => (
                  <button
                    key={mealType}
                    onClick={() => addCustomMeal(mealType)}
                    className="w-full text-left p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-bold text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                  >
                    {mealType}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowMealSelector(false)}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-4 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-bold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-transparent dark:border-gray-800">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">
            Configurações
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Meta Diária de Calorias
              </label>
              <input
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(parseInt(e.target.value) || 2000)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                min="1000"
                max="5000"
                step="100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
