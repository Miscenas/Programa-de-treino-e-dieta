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
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8 border border-transparent dark:border-gray-800">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          <Utensils className="w-8 h-8 text-brand-500" />
          Resumo do Dia
        </h2>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Meta Diária</p>
          <p className="text-2xl font-black text-brand-600 dark:text-brand-400">{dailyGoal} kcal</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2 font-bold">
          <span>Progresso: <span className="text-gray-900 dark:text-white">{totalCalories}</span> kcal</span>
          <span>{percentageComplete.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ease-out shadow-sm ${percentageComplete >= 100
                ? 'bg-red-500'
                : percentageComplete >= 80
                  ? 'bg-orange-500'
                  : 'bg-brand-500'
              }`}
            style={{ width: `${Math.min(percentageComplete, 100)}%` }}
          />
        </div>
      </div>

      {/* Calorie Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-brand-50 dark:bg-brand-900/20 rounded-2xl p-4 text-center border border-brand-100 dark:border-brand-900/30">
          <Flame className="w-6 h-6 text-brand-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-brand-600 dark:text-brand-400">{totalCalories}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Calorias</p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 text-center border border-orange-100 dark:border-orange-900/30">
          <Target className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{remainingCalories}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Restantes</p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 text-center border border-purple-100 dark:border-purple-900/30">
          <TrendingUp className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalProtein}g</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Proteínas</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 text-center border border-blue-100 dark:border-blue-900/30">
          <Utensils className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{meals.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Refeições</p>
        </div>
      </div>

      {/* Meals List */}
      {meals.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-black text-gray-900 dark:text-white mb-4 uppercase text-sm tracking-widest">Refeições de Hoje</h3>
          {meals.map((meal, index) => (
            <div key={index} className="border border-gray-100 dark:border-gray-800 rounded-2xl p-5 bg-gray-50 dark:bg-gray-800/50 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl filter drop-shadow-sm">{getMealIcon(meal.mealType)}</span>
                  <h4 className="font-black text-gray-900 dark:text-gray-100 capitalize">{meal.mealType}</h4>
                </div>
                <span className="font-black text-brand-600 dark:text-brand-400">{meal.totalCalories} kcal</span>
              </div>

              {meal.foods.length > 0 && (
                <div className="space-y-2">
                  {meal.foods.map((food, foodIndex) => (
                    <div key={foodIndex} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        {food.name} <span className="text-gray-400 dark:text-gray-500 text-xs">({food.portion})</span>
                      </span>
                      <span className="font-bold text-gray-700 dark:text-gray-300">{food.calories} kcal</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between text-xs text-gray-500 dark:text-gray-500 font-bold">
                <span>P: {meal.totalProtein}g | C: {meal.totalCarbs}g | G: {meal.totalFats}g</span>
                <span className="italic">{meal.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {meals.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-50 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Utensils className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-900 dark:text-white font-black text-xl mb-2">Nenhuma refeição registrada hoje</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-xs mx-auto">Tire fotos das suas refeições para começar!</p>
        </div>
      )}
    </div>
  );
}
