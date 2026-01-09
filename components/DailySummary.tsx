import React, { useState, useEffect } from 'react';
import { Utensils, Flame, Target, TrendingUp } from 'lucide-react';

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  portion: string;
}

interface MealAnalysis {
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  mealType: string;
  description: string;
}

interface DailySummaryProps {
  meals: MealAnalysis[];
  dailyGoal: number;
}

export function DailySummary({ meals, dailyGoal }: DailySummaryProps) {
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalFats, setTotalFats] = useState(0);

  useEffect(() => {
    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totalCalories,
        protein: acc.protein + meal.totalProtein,
        carbs: acc.carbs + meal.totalCarbs,
        fats: acc.fats + meal.totalFats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    setTotalCalories(totals.calories);
    setTotalProtein(totals.protein);
    setTotalCarbs(totals.carbs);
    setTotalFats(totals.fats);
  }, [meals]);

  const remainingCalories = dailyGoal - totalCalories;
  const percentageComplete = Math.min((totalCalories / dailyGoal) * 100, 100);

  const getMealIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'café da manhã':
      case 'cafe da manha':
        return '🌅';
      case 'almoço':
        return '☀️';
      case 'jantar':
        return '🌙';
      case 'lanche':
      case 'lanches':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Utensils className="w-6 h-6 text-blue-500" />
          Resumo do Dia
        </h2>
        <div className="text-right">
          <p className="text-sm text-gray-600">Meta Diária</p>
          <p className="text-xl font-bold text-blue-600">{dailyGoal} kcal</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progresso: {totalCalories} kcal</span>
          <span>{percentageComplete.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              percentageComplete >= 100
                ? 'bg-red-500'
                : percentageComplete >= 80
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentageComplete, 100)}%` }}
          />
        </div>
      </div>

      {/* Calorie Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <Flame className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">{totalCalories}</p>
          <p className="text-sm text-gray-600">Calorias</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 text-center">
          <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">{remainingCalories}</p>
          <p className="text-sm text-gray-600">Restantes</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <TrendingUp className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-600">{totalProtein}g</p>
          <p className="text-sm text-gray-600">Proteínas</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <Utensils className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-orange-600">{meals.length}</p>
          <p className="text-sm text-gray-600">Refeições</p>
        </div>
      </div>

      {/* Meals List */}
      {meals.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 mb-3">Refeições de Hoje</h3>
          {meals.map((meal, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getMealIcon(meal.mealType)}</span>
                  <h4 className="font-semibold text-gray-800 capitalize">{meal.mealType}</h4>
                </div>
                <span className="font-bold text-blue-600">{meal.totalCalories} kcal</span>
              </div>

              {meal.foods.length > 0 && (
                <div className="space-y-2">
                  {meal.foods.map((food, foodIndex) => (
                    <div key={foodIndex} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {food.name} ({food.portion})
                      </span>
                      <span className="font-medium">{food.calories} kcal</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 pt-2 border-t flex justify-between text-xs text-gray-500">
                <span>P: {meal.totalProtein}g | C: {meal.totalCarbs}g | G: {meal.totalFats}g</span>
                <span>{meal.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {meals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhuma refeição registrada hoje</p>
          <p className="text-sm">Tire fotos das suas refeições para começar!</p>
        </div>
      )}
    </div>
  );
}
