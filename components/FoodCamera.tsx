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
        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
      >
        <Camera className="w-4 h-4" />
        <span>Foto da Refeição</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Foto do {mealType}
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!preview ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Tire uma foto da sua refeição
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
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Tirar Foto
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4 inline mr-2" />
                Refazer
              </button>
              
              <button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2" />
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
          </div>
        )}
      </div>
    </div>
  );
}
