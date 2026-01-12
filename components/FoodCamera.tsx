import React, { useState, useRef } from 'react';
import { Camera, X, Plus, Check } from 'lucide-react';
import { EdgeFunctionService } from '../services/edgeFunctionService';

interface FoodAnalysis {
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

interface FoodCameraProps {
  onFoodAnalyzed: (analysis: FoodAnalysis) => void;
  mealType: string;
}

export function FoodCamera({ onFoodAnalyzed, mealType }: FoodCameraProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!preview) return;

    setIsAnalyzing(true);
    try {
      const analysis = await EdgeFunctionService.analyzeFoodImage(preview);
      const analysisWithMealType = {
        ...analysis,
        mealType
      };
      onFoodAnalyzed(analysisWithMealType);
      setIsOpen(false);
      setPreview(null);
    } catch (error) {
      console.error('Error analyzing food:', error);
      alert('Erro ao analisar imagem. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 w-full aspect-square rounded-2xl hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all group"
      >
        <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <Camera className="w-6 h-6 text-brand-600 dark:text-brand-400" />
        </div>
        <span className="font-bold text-sm text-gray-600 dark:text-gray-300">{mealType}</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-transparent dark:border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-900 dark:text-white capitalize">
            Foto do {mealType}
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!preview ? (
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center bg-gray-50 dark:bg-gray-800/50">
            <Camera className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
            <p className="text-gray-600 dark:text-gray-400 font-bold mb-6">
              Mire no prato e tire uma foto
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={openCamera}
              className="w-full bg-brand-600 dark:bg-brand-500 text-white px-8 py-4 rounded-2xl hover:bg-brand-700 dark:hover:bg-brand-600 transition-all font-black shadow-lg shadow-brand-100 dark:shadow-brand-900/40 flex items-center justify-center gap-3"
            >
              <Camera className="w-6 h-6" />
              Tirar Foto
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden border-4 border-gray-100 dark:border-gray-800 shadow-inner">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-cover"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-4 py-4 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-bold flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Refazer
              </button>

              <button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="flex-1 bg-brand-600 dark:bg-brand-500 text-white px-4 py-4 rounded-2xl hover:bg-brand-700 dark:hover:bg-brand-600 transition-all font-black shadow-lg shadow-brand-100 dark:shadow-brand-900/40 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Analisar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
