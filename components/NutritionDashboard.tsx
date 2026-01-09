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
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🍽️ NutriCoach Pro
              </h1>
              <p className="text-gray-600">
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
                className="bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600 transition-colors"
                title="Adicionar Refeição Manual"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              <button
                onClick={clearDailyMeals}
                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                title="Limpar Refeições"
              >
                <Calendar className="w-5 h-5" />
              </button>
              
              <button
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                title="Configurações"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Daily Summary */}
        <DailySummary meals={meals} dailyGoal={dailyGoal} />

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
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
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Adicionar Refeição Manual
              </h3>
              
              <div className="space-y-2">
                {mealTypes.map((mealType) => (
                  <button
                    key={mealType}
                    onClick={() => addCustomMeal(mealType)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {mealType}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowMealSelector(false)}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Configurações
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Diária de Calorias
              </label>
              <input
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(parseInt(e.target.value) || 2000)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
