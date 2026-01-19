import React, { useState } from 'react';
import { X, Calculator, TrendingUp, Activity, Target, ArrowRight } from 'lucide-react';

interface BMRCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    onGeneratePlan?: (userData: UserData) => void;
}

interface UserData {
    weight: number;
    height: number;
    age: number;
    gender: 'male' | 'female';
    activityLevel: string;
    goal: string;
    targetDeficit: number;
}

export function BMRCalculator({ isOpen, onClose, onGeneratePlan }: BMRCalculatorProps) {
    const [formData, setFormData] = useState({
        weight: '',
        height: '',
        age: '',
        gender: 'male' as 'male' | 'female',
        activityLevel: 'Sedentário',
        goal: 'Perda de peso',
        targetDeficit: -500 // Padrão inicial
    });

    // Update targetDeficit when goal changes
    const handleGoalChange = (newGoal: string) => {
        let newDeficit = 0;
        if (newGoal === 'Perda de peso') {
            newDeficit = -500; // Default deficit for weight loss
        } else if (newGoal === 'Ganho de massa') {
            newDeficit = 300; // Default surplus for muscle gain
        }
        setFormData({ ...formData, goal: newGoal, targetDeficit: newDeficit });
    };

    const [showResults, setShowResults] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const calculateBMR = () => {
        const weight = parseFloat(formData.weight);
        const height = parseFloat(formData.height);
        const age = parseFloat(formData.age);

        if (!weight || !height || !age) return 0;

        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        if (formData.gender === 'male') {
            bmr += 5;
        } else {
            bmr -= 161;
        }
        return Math.round(bmr);
    };

    const getActivityFactor = () => {
        switch (formData.activityLevel) {
            case 'Sedentário': return 1.2;
            case 'Levemente ativo': return 1.375;
            case 'Moderadamente ativo': return 1.55;
            case 'Muito ativo': return 1.725;
            case 'Extremamente ativo': return 1.9;
            default: return 1.2;
        }
    };

    const calculateTDEE = () => {
        const bmr = calculateBMR();
        return Math.round(bmr * getActivityFactor());
    };

    const calculateTarget = () => {
        const tdee = calculateTDEE();
        return tdee + formData.targetDeficit;
    };

    const handleCalculate = () => {
        if (formData.weight && formData.height && formData.age) {
            setShowResults(true);
        }
    };

    const handleGeneratePlan = () => {
        setShowConfirmation(true);
    };

    const confirmGeneratePlan = () => {
        if (onGeneratePlan) {
            const userData: UserData = {
                weight: parseFloat(formData.weight),
                height: parseFloat(formData.height),
                age: parseFloat(formData.age),
                gender: formData.gender,
                activityLevel: formData.activityLevel,
                goal: formData.goal,
                targetDeficit: formData.targetDeficit
            };
            onGeneratePlan(userData);
        }
        onClose();
    };

    if (!isOpen) return null;

    const bmr = calculateBMR();
    const tdee = calculateTDEE();
    const target = calculateTarget();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-800 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-brand-500 to-brand-600 p-3 rounded-xl shadow-lg">
                            <Calculator className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-800 dark:text-white">Calculadora BMR</h3>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">Taxa Metabólica Basal</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Peso */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Peso (kg)</label>
                        <input
                            type="number"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold text-gray-900 dark:text-white"
                            placeholder="Ex: 75"
                        />
                    </div>

                    {/* Altura */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Altura (cm)</label>
                        <input
                            type="number"
                            value={formData.height}
                            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold text-gray-900 dark:text-white"
                            placeholder="Ex: 170"
                        />
                    </div>

                    {/* Idade */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Idade (anos)</label>
                        <input
                            type="number"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold text-gray-900 dark:text-white"
                            placeholder="Ex: 30"
                        />
                    </div>

                    {/* Sexo */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Sexo</label>
                        <select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold text-gray-900 dark:text-white"
                        >
                            <option value="male">Masculino</option>
                            <option value="female">Feminino</option>
                        </select>
                    </div>

                    {/* Nível de Atividade */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Nível de Atividade</label>
                        <select
                            value={formData.activityLevel}
                            onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold text-gray-900 dark:text-white"
                        >
                            <option value="Sedentário">Sedentário</option>
                            <option value="Levemente ativo">Levemente ativo</option>
                            <option value="Moderadamente ativo">Moderadamente ativo</option>
                            <option value="Muito ativo">Muito ativo</option>
                            <option value="Extremamente ativo">Extremamente ativo</option>
                        </select>
                    </div>

                    {/* Objetivo */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">Objetivo</label>
                        <select
                            value={formData.goal}
                            onChange={(e) => handleGoalChange(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold text-gray-900 dark:text-white"
                        >
                            <option value="Perda de peso">Perda de peso</option>
                            <option value="Ganho de massa">Ganho de massa</option>
                            <option value="Manutenção">Manutenção</option>
                        </select>
                    </div>

                    {/* Ajuste de Déficit/Superávit */}
                    <div className="md:col-span-2 bg-brand-50/50 dark:bg-brand-900/10 p-4 rounded-2xl border border-brand-100 dark:border-brand-900/30">
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-xs font-bold text-brand-900 dark:text-brand-400 uppercase">
                                Ajuste Manual de Meta ({formData.targetDeficit > 0 ? '+' : ''}{formData.targetDeficit} kcal)
                            </label>
                            <span className="text-[10px] font-black bg-brand-200 dark:bg-brand-800 text-brand-700 dark:text-brand-300 px-2 py-1 rounded-full uppercase">
                                {formData.targetDeficit < 0 ? 'Déficit' : formData.targetDeficit > 0 ? 'Superávit' : 'Manutenção'}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={formData.goal === 'Perda de peso' ? -1000 : formData.goal === 'Ganho de massa' ? 0 : -500}
                            max={formData.goal === 'Perda de peso' ? 0 : formData.goal === 'Ganho de massa' ? 1000 : 500}
                            step="50"
                            value={formData.targetDeficit}
                            onChange={(e) => setFormData({ ...formData, targetDeficit: parseInt(e.target.value) })}
                            className="w-full h-2 bg-brand-100 dark:bg-brand-900/50 rounded-lg appearance-none cursor-pointer accent-brand-600"
                        />
                        <div className="flex justify-between mt-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                            {formData.goal === 'Perda de peso' && (
                                <>
                                    <span>-1000 (Agressivo)</span>
                                    <span>-500 (Moderado)</span>
                                    <span>0 (Manutenção)</span>
                                </>
                            )}
                            {formData.goal === 'Ganho de massa' && (
                                <>
                                    <span>0 (Manutenção)</span>
                                    <span>+500 (Moderado)</span>
                                    <span>+1000 (Agressivo)</span>
                                </>
                            )}
                            {formData.goal === 'Manutenção' && (
                                <>
                                    <span>-500</span>
                                    <span>0 (Manutenção)</span>
                                    <span>+500</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Calculate Button */}
                <button
                    onClick={handleCalculate}
                    disabled={!formData.weight || !formData.height || !formData.age}
                    className="w-full py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-black rounded-2xl shadow-lg shadow-brand-100 dark:shadow-brand-900/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                >
                    Calcular BMR
                </button>

                {/* Results */}
                {showResults && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                        {/* BMR */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/30">
                            <div className="flex items-center gap-3 mb-2">
                                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <h4 className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase">Gasto Basal (BMR)</h4>
                            </div>
                            <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{bmr} <span className="text-lg">kcal/dia</span></p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Gasto em repouso absoluto</p>
                        </div>

                        {/* TDEE */}
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 rounded-2xl p-4 border border-purple-100 dark:border-purple-900/30">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <h4 className="text-sm font-black text-purple-900 dark:text-purple-300 uppercase">Gasto Total (TDEE)</h4>
                            </div>
                            <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{tdee} <span className="text-lg">kcal/dia</span></p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Incluindo atividades diárias</p>
                        </div>

                        {/* Meta */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-2xl p-4 border border-green-100 dark:border-green-900/30">
                            <div className="flex items-center gap-3 mb-2">
                                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <h4 className="text-sm font-black text-green-900 dark:text-green-300 uppercase">Meta Calórica ({formData.goal})</h4>
                            </div>
                            <p className="text-3xl font-black text-green-600 dark:text-green-400">{target} <span className="text-lg">kcal/dia</span></p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {formData.goal === 'Perda de peso' && `Déficit de ${tdee - target} kcal/dia`}
                                {formData.goal === 'Ganho de massa' && `Superávit de ${target - tdee} kcal/dia`}
                                {formData.goal === 'Manutenção' && 'Manutenção do peso atual'}
                            </p>
                        </div>

                        {/* Generate Plan Button */}
                        <button
                            onClick={handleGeneratePlan}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            Gerar Plano Completo
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Confirmation Modal */}
                {showConfirmation && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md shadow-2xl border border-transparent dark:border-gray-800">
                            <h4 className="text-xl font-black text-gray-800 dark:text-white mb-3">Gerar Plano Completo?</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Deseja usar essas informações para gerar um plano completo de {formData.goal.toLowerCase()}?
                                {' '}Isso irá <strong>sobrescrever</strong> seu plano atual.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmation(false)}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmGeneratePlan}
                                    className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
