import React, { useState, useRef } from 'react';
import { Camera, X, Plus, Check, Loader2 } from 'lucide-react';
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

interface MealCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealId: string;
  mealName: string;
  onFoodAnalyzed: (mealId: string, analysis: FoodAnalysis) => void;
}

export function MealCameraModal({ isOpen, onClose, mealId, mealName, onFoodAnalyzed }: MealCameraModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzedData, setAnalyzedData] = useState<FoodAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setAnalyzedData(null); // Reset analysis on new file
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
        mealType: mealName.toLowerCase()
      };

      setAnalyzedData(analysisWithMealType);
    } catch (error) {
      console.error('Error analyzing food:', error);
      alert('Erro ao analisar imagem. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confirmAnalysis = () => {
    if (analyzedData) {
      onFoodAnalyzed(mealId, analyzedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setPreview(null);
    setAnalyzedData(null);
    onClose();
  };

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-transparent dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Atualizar {mealName}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!preview ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center bg-gray-50 dark:bg-gray-800/50">
            <Camera className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4 font-medium">
              Tire uma foto ou escolha uma imagem da sua refeição para atualizar as calorias
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
              className="bg-brand-600 dark:bg-brand-500 text-white px-8 py-3 rounded-xl hover:bg-brand-700 dark:hover:bg-brand-600 transition-all font-bold shadow-lg shadow-brand-100 dark:shadow-brand-900/40"
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Escolher Foto
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl"
            />

            {analyzedData ? (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-900/30">
                <h4 className="font-bold text-green-800 dark:text-green-300 mb-2">Análise Concluída</h4>
                <div className="text-sm text-green-700 dark:text-green-400 mb-3 space-y-1">
                  <p><strong className="dark:text-green-200">Alimentos:</strong> {analyzedData.foods.map(f => f.name).join(', ')}</p>
                  <p><strong className="dark:text-green-200">Total:</strong> {analyzedData.totalCalories} kcal</p>
                </div>
                <p className="text-sm font-bold text-green-800 dark:text-green-300 mb-4">
                  Isso atualizará sua refeição e salvará na dieta.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAnalyzedData(null)}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-bold"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={confirmAnalysis}
                    className="flex-1 bg-green-600 dark:bg-green-500 text-white px-4 py-3 rounded-xl hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-bold shadow-lg shadow-green-100 dark:shadow-green-900/40"
                  >
                    <Check className="w-4 h-4" />
                    Confirmar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong className="dark:text-blue-100">Atenção:</strong> Esta análise irá atualizar as calorias e macros desta refeição no resumo do dia.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPreview(null)}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-4 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-bold"
                  >
                    <X className="w-4 h-4 inline mr-2" />
                    Refazer
                  </button>

                  <button
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                    className="flex-1 bg-brand-600 dark:bg-brand-500 text-white px-4 py-3 rounded-xl hover:bg-brand-700 dark:hover:bg-brand-600 transition-all disabled:opacity-50 font-bold shadow-lg shadow-brand-100 dark:shadow-brand-900/40"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 inline mr-2" />
                        Analisar
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
