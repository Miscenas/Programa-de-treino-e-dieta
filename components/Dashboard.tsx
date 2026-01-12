
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FullPlan, UserProfile, FoodItem, ShoppingItem, MealOption, Meal, Exercise, Gender } from '../types';
import { Droplets, Flame, Dumbbell, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Apple, ShoppingBasket, Printer, Clock, RefreshCw, LayoutDashboard, Plus, PlusCircle, Search, X, Trash2, CalendarRange, ChevronLeft, ChevronRight, Check, Save, Star, Users, CheckSquare, Square, ArrowDown, Share2, Circle, PlayCircle, Beef, Wheat, Sandwich, ArrowLeft, PenSquare, BookOpen, Edit2, Edit3, Camera, Aperture, Loader2, Sparkles, ScanLine, Utensils, Scale, TrendingUp, ListChecks, Eraser, Activity, Footprints, Zap, Smartphone, Settings2, Info, Carrot, Lock, Unlock } from 'lucide-react';
import { FoodPreferencesModal } from './FoodPreferencesModal';
import { foodDatabase } from '../services/foodDatabase';
import { getIngredientCategory, generatePlan } from '../services/expertSystem';
import { exerciseDatabase, LibraryExercise } from '../services/exerciseDatabase';
import { GoogleGenAI, Type } from "@google/genai";
import { NutritionDashboard } from './NutritionDashboard';
import { MealCameraModal } from './MealCameraModal';
import { EdgeFunctionService } from '../services/edgeFunctionService';
import { GoogleFitWebService } from '../services/googleFitWebService';
import { supabase } from '../services/supabaseClient';

interface Props {
    userId: string;
    plan: FullPlan;
    user: UserProfile;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    onReset: () => void;
    onUpdatePlan: (plan: FullPlan) => void;
}

interface SavedDayInfo {
    isSaved: boolean;
    householdSize: number;
}

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

interface FruitAnalysis {
    name: string;
    quality: 'Excelente' | 'Boa' | 'Ruim' | 'Verde';
    sweetness: string;
    details: string;
    tips: string;
}

// --- MODERN GAUGE COMPONENT ---
const ModernGauge: React.FC<{
    value: number;
    max: number;
    type: 'calories' | 'workouts' | 'deficit';
    label: string;
    suffix?: string;
    icon: React.ReactNode
}> = ({ value, max, type, label, suffix = '', icon }) => {
    const size = 140;
    const strokeWidth = 10;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2 - 8;
    const circumference = 2 * Math.PI * radius;

    const arcDegrees = 240;
    const arcLength = (arcDegrees / 360) * circumference;

    const percentage = Math.min(Math.max(value / max, 0), 1);
    const strokeDashoffset = arcLength - (percentage * arcLength);

    const rotation = 150;

    const gradientId = `grad - ${type} `;
    const colors = type === 'calories'
        ? { start: '#f97316', end: '#dc2626', bg: '#fee2e2' }
        : type === 'deficit'
            ? { start: '#3b82f6', end: '#1d4ed8', bg: '#dbeafe' }
            : { start: '#4ade80', end: '#16a34a', bg: '#dcfce7' };

    const renderTicks = () => {
        const ticks = [];
        const totalTicks = 30;
        const step = arcDegrees / totalTicks;

        for (let i = 0; i <= totalTicks; i++) {
            const deg = 150 + (i * step);
            const angleInRad = (deg * Math.PI) / 180;

            const innerR = radius + 6;
            const outerR = radius + 11;

            const x1 = center + innerR * Math.cos(angleInRad);
            const y1 = center + innerR * Math.sin(angleInRad);
            const x2 = center + outerR * Math.cos(angleInRad);
            const y2 = center + outerR * Math.sin(angleInRad);

            const isActive = (i / totalTicks) <= percentage;

            ticks.push(
                <line
                    key={i}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isActive ? colors.end : '#e5e7eb'}
                    strokeWidth={isActive ? 2 : 1.5}
                    className="transition-colors duration-500"
                />
            );
        }
        return ticks;
    };

    return (
        <div className="flex flex-col items-center justify-center relative" style={{ width: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size} `} className="overflow-visible">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={colors.start} />
                        <stop offset="100%" stopColor={colors.end} />
                    </linearGradient>
                    <filter id={`glow - ${type} `} x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={colors.end} floodOpacity="0.3" />
                    </filter>
                </defs>

                <g>{renderTicks()}</g>

                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={colors.bg}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${arcLength} ${circumference} `}
                    transform={`rotate(${rotation} ${center} ${center})`}
                />

                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${arcLength} ${circumference} `}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(${rotation} ${center} ${center})`}
                    className="transition-all duration-1000 ease-out"
                    filter={`url(#glow - ${type})`}
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center mt-3">
                <div className="text-gray-400 dark:text-gray-500 mb-0.5 scale-90">{icon}</div>
                <span className={`font-black text-gray-800 dark:text-white leading-none tracking-tight ${value > 9999 ? 'text-xl' : 'text-2xl'}`}>{value}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-0.5">{suffix} / {max}</span>
            </div>

            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">{label}</span>
        </div>
    );
};

export const Dashboard: React.FC<Props> = ({ userId, plan, user, isDarkMode, onToggleDarkMode, onReset, onUpdatePlan }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'workout' | 'diet' | 'shopping' | 'calendar' | 'progress'>('overview');
    const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
    const [expandedDay, setExpandedDay] = useState<string | null>(
        plan.workout?.weeklySchedule?.[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.dayName || null
    );
    const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

    // Camera Modal State
    const [cameraModalOpen, setCameraModalOpen] = useState(false);
    const [selectedMealForCamera, setSelectedMealForCamera] = useState<{ id: string, name: string } | null>(null);

    // --- DATE & HISTORY STATE ---
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // CALENDAR STATE
    const [calendarMode, setCalendarMode] = useState<'menu' | 'workout' | 'diet'>('menu');
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    // WORKOUT CUSTOMIZATION STATE
    const [customWorkouts, setCustomWorkouts] = useState<Record<string, Exercise[]>>({});

    // Map DateString (YYYY-MM-DD) -> MealId -> Array of FoodItems
    const [dietHistory, setDietHistory] = useState<Record<string, Record<string, FoodItem[]>>>({});

    // Map DateString -> MealId -> OptionIndex (0, 1, 2, ...)
    const [mealSelections, setMealSelections] = useState<Record<string, number>>({});

    // Map MealId -> Array of MealOption (Custom user created options)
    // Map MealId -> Array of MealOption (Custom user created options)
    const [customOptions, setCustomOptions] = useState<Record<string, MealOption[]>>({});


    // Map "Date_MealId" -> Array of excluded ingredient indices
    const [excludedIngredients, setExcludedIngredients] = useState<Record<string, number[]>>({});

    // Map DateString -> SavedDayInfo (Para lista de compras)
    const [savedDays, setSavedDays] = useState<Record<string, SavedDayInfo>>({});

    // Shopping List Checked Items State
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
    const [showCompletedItems, setShowCompletedItems] = useState(true);

    // NEW: Tracking states for Overview
    const [workoutLog, setWorkoutLog] = useState<Set<string>>(new Set());
    const [consumedMeals, setConsumedMeals] = useState<Set<string>>(new Set());
    const [closedDays, setClosedDays] = useState<Set<string>>(new Set());

    // --- PROGRESS TRACKING STATE ---
    // Map DateString (YYYY-MM-DD) -> number
    const [weightHistory, setWeightHistory] = useState<Record<string, number>>({});
    const [bodyFatHistory, setBodyFatHistory] = useState<Record<string, number>>({});
    const [waistHistory, setWaistHistory] = useState<Record<string, number>>({});
    const [loadingMeasurements, setLoadingMeasurements] = useState(false);

    // Smart Plan Import states
    const [isSmartImportModalOpen, setIsSmartImportModalOpen] = useState(false);
    const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'review'>('idle');
    const [importedPlan, setImportedPlan] = useState<FullPlan | null>(null);
    const [backupPlan, setBackupPlan] = useState<FullPlan | null>(null);
    const [backupSelections, setBackupSelections] = useState<Record<string, number>>({});
    const [importError, setImportError] = useState<string | null>(null);
    const [importType, setImportType] = useState<'image' | 'text'>('image');
    const [importDistributeByDays, setImportDistributeByDays] = useState<boolean>(true);
    const [importDietSelected, setImportDietSelected] = useState(true);
    const [importWorkoutSelected, setImportWorkoutSelected] = useState(true);

    // Modal for adding measurements
    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
    const [newMeasurement, setNewMeasurement] = useState({ weight: '', bodyFat: '', waist: '' });

    // Google Fit Import State
    const [importingGoogleFit, setImportingGoogleFit] = useState(false);

    // Google Fit Data State
    const [googleFitData, setGoogleFitData] = useState<Array<{
        date: string;
        steps: number;
        calories_burned: number;
    }>>([]);
    const [loadingGoogleFitData, setLoadingGoogleFitData] = useState(false);

    // Caloric Deficit Goal State
    const [deficitGoal, setDeficitGoal] = useState<number>(() => {
        const saved = localStorage.getItem('fitcoach_deficit_goal');
        const val = saved ? parseInt(saved) : 7700;
        // Migration: If the saved value is too low (e.g. 500), it's probably the old daily value
        return val < 1000 ? 7700 : val;
    });
    // Add start date state
    const [deficitStartDate, setDeficitStartDate] = useState<string | null>(() => {
        return localStorage.getItem('fitcoach_deficit_start_date');
    });

    useEffect(() => {
        localStorage.setItem('fitcoach_deficit_goal', String(deficitGoal));
    }, [deficitGoal]);

    useEffect(() => {
        if (deficitStartDate) {
            localStorage.setItem('fitcoach_deficit_start_date', deficitStartDate);
        }
    }, [deficitStartDate]);

    const [isDeficitModalOpen, setIsDeficitModalOpen] = useState(false);
    const [isDeficitBreakdownOpen, setIsDeficitBreakdownOpen] = useState(false);
    const [showCelebrationMessage, setShowCelebrationMessage] = useState(false);

    // Nutrition Goals Selection (Target calories/macros)
    const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
    const [customTargets, setCustomTargets] = useState<{
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
    }>(() => {
        const saved = localStorage.getItem('fitcoach_custom_targets');
        if (saved) return JSON.parse(saved);

        // Fallback to plan targets
        return {
            calories: plan.nutrition?.targetCalories || 2000,
            protein: plan.nutrition?.meals?.reduce((acc, m) => acc + (m.targetProtein || 0), 0) || 150,
            carbs: plan.nutrition?.meals?.reduce((acc, m) => acc + (m.targetCarbs || 0), 0) || 200,
            fats: plan.nutrition?.meals?.reduce((acc, m) => acc + (m.targetFats || 0), 0) || 60
        };
    });


    // Save custom targets when they change
    useEffect(() => {
        localStorage.setItem('fitcoach_custom_targets', JSON.stringify(customTargets));
    }, [customTargets]);

    // Auto-sync Google Fit if token is valid
    useEffect(() => {
        const tryAutoSync = async () => {
            if (GoogleFitWebService.restoreSession()) {
                handleGoogleFitImport();
            }
        };
        tryAutoSync();
    }, []);


    // Modals State
    const [isFoodModalOpen, setFoodModalOpen] = useState(false);
    const [isExerciseModalOpen, setExerciseModalOpen] = useState(false);
    const [isFoodPreferencesModalOpen, setIsFoodPreferencesModalOpen] = useState(false);

    // Food Preferences State
    const [foodPreferences, setFoodPreferences] = useState<string[]>(() => {
        const saved = localStorage.getItem('fitcoach_food_preferences');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('fitcoach_food_preferences', JSON.stringify(foodPreferences));
        // We cannot update user prop here, but localStorage is source of truth for next reload
    }, [foodPreferences]);

    // Camera Modal State
    const [isCameraOpen, setCameraOpen] = useState(false);
    const [cameraMode, setCameraMode] = useState<'log' | 'fruit'>('log'); // Novo estado para saber se é log de comida ou análise de fruta
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzedFood, setAnalyzedFood] = useState<FoodItem | null>(null);
    const [fruitAnalysis, setFruitAnalysis] = useState<FruitAnalysis | null>(null); // Novo estado para resultado da fruta
    const [cameraTargetMealId, setCameraTargetMealId] = useState<string | null>(null);

    // Modal Salvar Opção Personalizada
    const [isSaveModalOpen, setSaveModalOpen] = useState(false);
    const [mealIdToSave, setMealIdToSave] = useState<string | null>(null);
    const [newOptionName, setNewOptionName] = useState('');

    // Modal Salvar Dia (Planejamento)
    const [isPlanDayModalOpen, setPlanDayModalOpen] = useState(false);
    const [householdSizeInput, setHouseholdSizeInput] = useState(1);

    const [currentMealIdForAdd, setCurrentMealIdForAdd] = useState<string | null>(null);
    const [currentDayForAddExercise, setCurrentDayForAddExercise] = useState<string | null>(null);
    const [foodSearchTerm, setFoodSearchTerm] = useState('');
    const [foodModalMode, setFoodModalMode] = useState<'library' | 'manual'>('library');
    const [newManualFood, setNewManualFood] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '', portionValue: '1', portionUnit: 'unidade' });

    // State for Editing Food
    const [isEditFoodModalOpen, setIsEditFoodModalOpen] = useState(false);
    const [editingFoodData, setEditingFoodData] = useState<{ mealId: string, index: number, food: FoodItem } | null>(null);
    const [editFoodForm, setEditFoodForm] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '', portionValue: '', portionUnit: '' });
    const [baseEditValues, setBaseEditValues] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0, portionValue: 0 });

    // Exercise Modal State
    const [exerciseModalMode, setExerciseModalMode] = useState<'library' | 'manual'>('library');
    const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
    const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('Todos');

    // Exercise Inputs
    const [newExercise, setNewExercise] = useState<Partial<Exercise>>({
        name: '', sets: 3, reps: '10-12', rest: '60s', notes: ''
    });

    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const todayWorkout = plan.workout?.weeklySchedule?.[todayIndex] || plan.workout?.weeklySchedule?.[0] || { focus: "Descanso", exercises: [] };

    // Helpers
    const getDateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    // Extra Calories State
    const [extraCalories, setExtraCalories] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('fitcoach_extra_calories');
        return saved ? JSON.parse(saved) : {};
    });
    const [isExtraCaloriesModalOpen, setExtraCaloriesModalOpen] = useState(false);
    const [newExtraCalories, setNewExtraCalories] = useState('');
    const [editingExtraDate, setEditingExtraDate] = useState<string | null>(null);

    // Persist extra calories
    useEffect(() => {
        localStorage.setItem('fitcoach_extra_calories', JSON.stringify(extraCalories));
    }, [extraCalories]);

    const handleOpenExtraCaloriesModal = (dateKey: string, currentVal: number) => {
        setEditingExtraDate(dateKey);
        setNewExtraCalories(currentVal.toString());
        setExtraCaloriesModalOpen(true);
    };

    const handleSaveExtraCalories = () => {
        if (editingExtraDate) {
            const val = parseInt(newExtraCalories) || 0;
            setExtraCalories(prev => ({
                ...prev,
                [editingExtraDate]: val
            }));
            setExtraCaloriesModalOpen(false);
            setEditingExtraDate(null);
        }
    };

    const todayKey = getDateKey(new Date());
    const selectedDateKey = getDateKey(selectedDate);

    const getMealOptions = (meal: Meal): MealOption[] => {
        const custom = customOptions[meal.id] || [];
        return [...(meal.options || []), ...custom];
    };

    const getOptionIndexForDate = (options: MealOption[], dateKey: string) => {
        if (options.length === 0) return 0;

        const date = new Date(dateKey + 'T12:00:00');
        const dayOfWeek = date.getDay(); // 0-Sun, 1-Mon...
        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
        const shortDayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toLowerCase().replace('.', '');

        // 1. Try name match
        const nameMatchIndex = options.findIndex(opt => {
            const lowName = opt.name.toLowerCase();
            return lowName.includes(dayName) || lowName.includes(shortDayName);
        });
        if (nameMatchIndex !== -1) return nameMatchIndex;

        // 2. Fallback to Monday-based index (0-Mon, 6-Sun)
        const mondayBasedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const result = mondayBasedIndex % options.length;

        // Ensure we never return NaN
        if (isNaN(result)) return 0;
        return result;
    };

    const handleSmartImport = async (content: string, type: 'image' | 'text') => {
        setImportStatus('loading');
        setImportError(null);
        try {
            const imported = await EdgeFunctionService.parsePlan(content, type, importDistributeByDays);

            // Auto toggle based on what was found
            const hasMeals = (imported.nutrition?.meals?.length || 0) > 0;
            const hasWorkout = (imported.workout?.weeklySchedule?.length || 0) > 0;

            setImportDietSelected(hasMeals);
            setImportWorkoutSelected(hasWorkout);

            setImportedPlan(imported);
            setImportStatus('review');
        } catch (error: any) {
            setImportError(error.message || 'Erro ao processar plano');
            setImportStatus('idle');
        }
    };

    const cleanDayNamesFromImportedPlan = () => {
        if (!importedPlan) return;

        const daysToStrip = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
        const stripPattern = new RegExp(`^ (${daysToStrip.join('|')}) (-feira) ? (:)?\\s * `, 'i');

        const newPlan = { ...importedPlan };
        if (newPlan.nutrition?.meals) {
            newPlan.nutrition.meals = newPlan.nutrition.meals.map(meal => ({
                ...meal,
                options: (meal.options || []).map(opt => ({
                    ...opt,
                    name: opt.name.replace(stripPattern, '').trim() || opt.name
                }))
            }));
        }
        setImportedPlan(newPlan);
    };

    const confirmSmartImport = async () => {
        if (importedPlan) {
            // Backup current plan and selections
            const currentMealCount = plan.nutrition?.meals?.length || 0;
            if (currentMealCount >= 3) {
                setBackupPlan(plan);
                setBackupSelections(mealSelections);
                localStorage.setItem('fitcoach_backup_plan', JSON.stringify(plan));
                localStorage.setItem('fitcoach_backup_selections', JSON.stringify(mealSelections));
            }

            // SMART MERGE: Build the final plan based on selections
            const finalPlan = { ...plan };

            if (importDietSelected && importedPlan.nutrition) {
                finalPlan.nutrition = importedPlan.nutrition;
            }

            if (importWorkoutSelected && importedPlan.workout) {
                finalPlan.workout = importedPlan.workout;
            }

            // Apply merged plan
            onUpdatePlan(finalPlan);

            // Handle meal selections only if diet was imported
            if (importDietSelected && finalPlan.nutrition?.meals) {
                const newSelections = { ...mealSelections };
                const today = new Date();

                for (let i = 0; i < 7; i++) {
                    const futureDate = new Date(today);
                    futureDate.setDate(today.getDate() + i);
                    const dKey = getDateKey(futureDate);

                    finalPlan.nutrition.meals.forEach(meal => {
                        const sKey = `${dKey}_${meal.id} `;
                        const opts = getMealOptions(meal);
                        if (opts.length > 0) {
                            newSelections[sKey] = getOptionIndexForDate(opts, dKey);
                        }
                    });
                }
                setMealSelections(newSelections);
                localStorage.setItem('fitcoach_selections', JSON.stringify(newSelections));
            }

            setIsSmartImportModalOpen(false);
            setImportedPlan(null);
            setImportStatus('idle');
        }
    };

    const undoImport = () => {
        if (backupPlan) {
            onUpdatePlan(backupPlan);
            if (Object.keys(backupSelections).length > 0) {
                setMealSelections(backupSelections);
                localStorage.setItem('fitcoach_selections', JSON.stringify(backupSelections));
            }
            setBackupPlan(null);
            setBackupSelections({});
            localStorage.removeItem('fitcoach_backup_plan');
            localStorage.removeItem('fitcoach_backup_selections');
        }
    };

    const handleRepairPlan = async () => {
        if (confirm("Seu plano parece incompleto. Deseja tentar restaurar o plano original da IA?")) {
            setImportStatus('loading');
            try {
                const repairedPlan = await EdgeFunctionService.generatePlan(user);
                onUpdatePlan(repairedPlan);
                alert("Plano restaurado com sucesso!");
            } catch (error) {
                alert("Erro ao restaurar: " + (error as any).message);
            } finally {
                setImportStatus('idle');
            }
        }
    };

    const handleAddMeal = () => {
        const mealName = prompt("Qual o nome da nova refeição? (Ex: Lanche da Tarde)");
        if (!mealName) return;

        const newMeal: Meal = {
            id: `meal - ${Date.now()} `,
            name: mealName,
            time: "16:00",
            calories: 0,
            macros: { protein: 0, carbs: 0, fats: 0 },
            options: [
                {
                    id: `opt - ${Date.now()} `,
                    name: "Opção Padrão",
                    description: "Clique em 'Adicionar Alimento' para montar esta refeição",
                    ingredients: [],
                    calories: 0,
                    macros: { protein: 0, carbs: 0, fats: 0 }
                }
            ]
        };

        const newPlan = { ...plan };
        if (!newPlan.nutrition) {
            newPlan.nutrition = {
                bmr: 0,
                tdee: 0,
                targetCalories: 2000,
                waterIntake: 2000,
                meals: []
            };
        }
        newPlan.nutrition.meals = [...(newPlan.nutrition.meals || []), newMeal];
        onUpdatePlan(newPlan);
        setExpandedMeal(newMeal.id);
    };

    const handleGoogleFitImport = async () => {
        if (importingGoogleFit) return;

        setImportingGoogleFit(true);
        try {
            // 1. Conectar via Google Identity Services
            await GoogleFitWebService.connect();

            // 2. Importar dados dos últimos 7 dias
            const data = await GoogleFitWebService.importData(7);

            // 3. Mesclar dados de passos e calorias por data
            const merged: any[] = [];
            const allDates = Array.from(new Set([
                ...data.steps.map((s: any) => s.date),
                ...data.calories.map((c: any) => c.date)
            ]));

            allDates.forEach(date => {
                const s = data.steps.find((item: any) => item.date === date);
                const c = data.calories.find((item: any) => item.date === date);
                merged.push({
                    date,
                    steps: s?.steps || 0,
                    calories_burned: c?.calories || 0
                });
            });

            // 4. Atualizar estado e cache
            setGoogleFitData(merged);
            localStorage.setItem('google_fit_cache', JSON.stringify(merged));

            // 5. Salvar no Supabase (Upsert)
            if (userId && merged.length > 0) {
                const upsertData = merged.map(item => ({
                    user_id: userId,
                    date: item.date,
                    steps: item.steps,
                    calories_burned: item.calories_burned,
                    source: 'google_fit_import'
                }));

                const { error: upsertError } = await supabase
                    .from('smartwatch_data')
                    .upsert(upsertData, { onConflict: 'user_id,date' });

                if (upsertError) {
                    console.error("Erro ao salvar no Supabase:", upsertError);
                }
            }

            alert("Google Fit sincronizado!");
        } catch (error: any) {
            console.error("Erro no Google Fit:", error);
            alert("Não foi possível sincronizar com o Google Fit. Verifique se as janelas pop-up estão permitidas.");
        } finally {
            setImportingGoogleFit(false);
        }
    };

    const fetchGoogleFitData = async () => {
        // 1. Tentar carregar do cache local para resposta rápida
        const cache = localStorage.getItem('google_fit_cache');
        if (cache) {
            try {
                setGoogleFitData(JSON.parse(cache));
            } catch (e) {
                console.error("Erro ao carregar cache do Google Fit:", e);
            }
        }

        // 2. Buscar dados mais recentes do Supabase
        if (userId) {
            setLoadingGoogleFitData(true);
            try {
                const { data, error } = await supabase
                    .from('smartwatch_data')
                    .select('date, steps, calories_burned')
                    .eq('user_id', userId)
                    .order('date', { ascending: false })
                    .limit(30);

                if (error) throw error;

                if (data && data.length > 0) {
                    const formattedData = data.map(item => ({
                        date: item.date,
                        steps: item.steps,
                        calories_burned: item.calories_burned
                    }));
                    setGoogleFitData(formattedData);
                    localStorage.setItem('google_fit_cache', JSON.stringify(formattedData));
                }
            } catch (err) {
                console.error("Erro ao buscar dados do Supabase:", err);
            } finally {
                setLoadingGoogleFitData(false);
            }
        }
    };

    const calculateBMR = (): number => {
        if (!user || !user.weight || !user.height || !user.age) return 2000;
        const weight = user.weight;
        const height = user.height;
        const age = user.age;

        if (user.gender === 'male' || user.gender === 'masculino') {
            return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
        } else {
            return Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
        }
    };

    const getGoogleFitDataForDate = (dateKey: string) => {
        const data = googleFitData.find(d => d.date === dateKey);
        return data || { steps: 0, calories_burned: 0, date: dateKey };
    };

    const parseIngredientAmount = (amountStr: string) => {
        const s = amountStr.toLowerCase().trim();
        // 1. Metric at START
        const metricStart = s.match(/^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l)\b/);
        if (metricStart) {
            let val = parseFloat(metricStart[1].replace(',', '.'));
            let unit = metricStart[2];
            if (unit === 'kg') { val *= 1000; unit = 'g'; }
            if (unit === 'l') { val *= 1000; unit = 'ml'; }
            return { value: val, unit };
        }
        // 2. Unit at START
        const unitStart = s.match(/^(\d+(?:[.,]\d+)?)\s*(unidade|fatia|scoop|pote|xícara|colher|copo)/);
        if (unitStart) {
            let val = parseFloat(unitStart[1].replace(',', '.'));
            let unit = unitStart[2];
            if (unit.startsWith('unidade')) unit = 'un';
            return { value: val, unit };
        }
        // 3. Fallback: Metric ANYWHERE
        const metricAny = s.match(/(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l)\b/);
        if (metricAny) {
            let val = parseFloat(metricAny[1].replace(',', '.'));
            let unit = metricAny[2];
            if (unit === 'kg') { val *= 1000; unit = 'g'; }
            if (unit === 'l') { val *= 1000; unit = 'ml'; }
            return { value: val, unit };
        }
        // 4. Fallback: Unit ANYWHERE
        const unitAny = s.match(/(\d+(?:[.,]\d+)?)\s*(unidade|fatia|scoop|pote|xícara|colher|copo)/);
        if (unitAny) {
            let val = parseFloat(unitAny[1].replace(',', '.'));
            let unit = unitAny[2];
            if (unit.startsWith('unidade')) unit = 'un';
            return { value: val, unit };
        }
        // 5. Number only (assume unit)
        const numberOnly = s.match(/^(\d+(?:[.,]\d+)?)\s*$/);
        if (numberOnly) {
            return { value: parseFloat(numberOnly[1].replace(',', '.')), unit: 'un' };
        }
        return { value: 1, unit: 'item' };
    };

    const estimateIngredientCalories = (ingredientName: string, amountStr: string): number => {
        const normalizedName = ingredientName.toLowerCase().trim();
        const food = foodDatabase.find(f => normalizedName.includes(f.name.toLowerCase()) || f.name.toLowerCase().includes(normalizedName));

        if (!food) return 0;

        const { value, unit } = parseIngredientAmount(amountStr);
        let multiplier = 1;

        if (food.portion.includes('100g') && unit === 'g') {
            multiplier = value / 100;
        } else if (unit === 'un' || unit === 'fatia' || unit === 'colher') {
            multiplier = value;
        }

        return Math.round(food.calories * multiplier);
    };

    const getComputedMealCalories = (meal: Meal, dateKey: string) => {
        const dayLog = dietHistory[dateKey] || {};
        const logged = dayLog[meal.id];

        if (logged && logged.length > 0) {
            return Math.round(logged.reduce((sum, item) => sum + item.calories, 0));
        }

        const selectionKey = `${dateKey}_${meal.id} `;
        let optionIndex = mealSelections[selectionKey];
        const allOptions = getMealOptions(meal);

        if (optionIndex === undefined) {
            optionIndex = getOptionIndexForDate(allOptions, dateKey);
        }

        const selectedOption = allOptions[optionIndex];
        if (!selectedOption) return meal.calories || 0;

        let totalCalories = selectedOption.calories || meal.calories || 0;

        // Deduct Excluded Ingredients
        const excludedIndices = excludedIngredients[selectionKey] || [];
        if (excludedIndices.length > 0) {
            let deduction = 0;
            excludedIndices.forEach(idx => {
                const ing = selectedOption.ingredients[idx];
                if (ing) {
                    const est = estimateIngredientCalories(ing.name, ing.amount);
                    if (est === 0 && totalCalories > 0) {
                        // Fallback: distribute evenly if unknown
                        deduction += (totalCalories / selectedOption.ingredients.length);
                    } else {
                        deduction += est;
                    }
                }
            });
            totalCalories = Math.max(0, Math.round(totalCalories - deduction));
        }

        return totalCalories;
    };

    // Load from localStorage
    useEffect(() => {
        const savedSelections = localStorage.getItem('fitcoach_selections');
        if (savedSelections) setMealSelections(JSON.parse(savedSelections));

        const savedHistory = localStorage.getItem('fitcoach_history');
        if (savedHistory) setDietHistory(JSON.parse(savedHistory));

        const savedCustomOptions = localStorage.getItem('fitcoach_custom_options');
        if (savedCustomOptions) setCustomOptions(JSON.parse(savedCustomOptions));

        const savedExcludedIngredients = localStorage.getItem('fitcoach_excluded_ingredients');
        if (savedExcludedIngredients) setExcludedIngredients(JSON.parse(savedExcludedIngredients));

        const savedDaysStorage = localStorage.getItem('fitcoach_saved_days');
        if (savedDaysStorage) setSavedDays(JSON.parse(savedDaysStorage));

        const savedChecks = localStorage.getItem('fitcoach_shopping_checks');
        if (savedChecks) setCheckedItems(new Set(JSON.parse(savedChecks)));

        const savedWorkouts = localStorage.getItem('fitcoach_workout_log');
        if (savedWorkouts) setWorkoutLog(new Set(JSON.parse(savedWorkouts)));

        const savedConsumed = localStorage.getItem('fitcoach_consumed_meals');
        if (savedConsumed) setConsumedMeals(new Set(JSON.parse(savedConsumed)));

        const savedClosedDays = localStorage.getItem('fitcoach_closed_days');
        if (savedClosedDays) setClosedDays(new Set(JSON.parse(savedClosedDays)));

        const savedCustomWorkouts = localStorage.getItem('fitcoach_custom_workouts');
        if (savedCustomWorkouts) setCustomWorkouts(JSON.parse(savedCustomWorkouts));

        const savedBackup = localStorage.getItem('fitcoach_backup_plan');
        if (savedBackup) setBackupPlan(JSON.parse(savedBackup));

        const savedBackupSels = localStorage.getItem('fitcoach_backup_selections');
        if (savedBackupSels) setBackupSelections(JSON.parse(savedBackupSels));

    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('fitcoach_selections', JSON.stringify(mealSelections));
    }, [mealSelections]);

    useEffect(() => {
        localStorage.setItem('fitcoach_history', JSON.stringify(dietHistory));
    }, [dietHistory]);

    useEffect(() => {
        if (backupPlan) {
            localStorage.setItem('fitcoach_backup_plan', JSON.stringify(backupPlan));
        } else {
            localStorage.removeItem('fitcoach_backup_plan');
        }
    }, [backupPlan]);

    useEffect(() => {
        localStorage.setItem('fitcoach_backup_selections', JSON.stringify(backupSelections));
    }, [backupSelections]);

    useEffect(() => {
        localStorage.setItem('fitcoach_custom_options', JSON.stringify(customOptions));
    }, [customOptions]);

    useEffect(() => {
        localStorage.setItem('fitcoach_excluded_ingredients', JSON.stringify(excludedIngredients));
    }, [excludedIngredients]);

    useEffect(() => {
        localStorage.setItem('fitcoach_saved_days', JSON.stringify(savedDays));
    }, [savedDays]);

    useEffect(() => {
        localStorage.setItem('fitcoach_shopping_checks', JSON.stringify([...checkedItems]));
    }, [checkedItems]);

    useEffect(() => {
        localStorage.setItem('fitcoach_workout_log', JSON.stringify([...workoutLog]));
    }, [workoutLog]);

    useEffect(() => {
        localStorage.setItem('fitcoach_consumed_meals', JSON.stringify([...consumedMeals]));
    }, [consumedMeals]);

    useEffect(() => {
        localStorage.setItem('fitcoach_closed_days', JSON.stringify([...closedDays]));
    }, [closedDays]);

    useEffect(() => {
        localStorage.setItem('fitcoach_custom_workouts', JSON.stringify(customWorkouts));
    }, [customWorkouts]);

    // Fetch Google Fit data on mount
    useEffect(() => {
        if (user) {
            fetchGoogleFitData();
        }
    }, []);

    // Save deficit goal to localStorage
    useEffect(() => {
        localStorage.setItem('fitcoach_deficit_goal', deficitGoal.toString());
    }, [deficitGoal]);

    // Fetch User Measurements from Supabase
    useEffect(() => {
        const fetchMeasurements = async () => {
            if (!userId) return;
            setLoadingMeasurements(true);
            try {
                const { data, error } = await supabase
                    .from('user_measurements')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: true });

                if (error) {
                    console.error('Error fetching measurements:', error);
                    return;
                }

                if (data) {
                    const weights: Record<string, number> = {};
                    const bodyFats: Record<string, number> = {};
                    const waists: Record<string, number> = {};

                    data.forEach((row: any) => {
                        const dateKey = row.date; // already YYYY-MM-DD from Supabase date type
                        if (row.weight) weights[dateKey] = Number(row.weight);
                        if (row.body_fat) bodyFats[dateKey] = Number(row.body_fat);
                        if (row.waist) waists[dateKey] = Number(row.waist);
                    });

                    setWeightHistory(weights);
                    setBodyFatHistory(bodyFats);
                    setWaistHistory(waists);
                }
            } catch (err) {
                console.error('Unexpected error fetching measurements:', err);
            } finally {
                setLoadingMeasurements(false);
            }
        };

        fetchMeasurements();
    }, [userId]);

    // --- CLOUD SYNC LOGIC ---

    // 1. Fetch Cloud Data when user or week changes
    useEffect(() => {
        const fetchCloudData = async () => {
            if (!userId) return;

            const today = new Date();
            const pastDate = new Date();
            pastDate.setDate(today.getDate() - 30);

            const { data, error } = await supabase
                .from('user_daily_tracking')
                .select('*')
                .eq('user_id', userId)
                .gte('date', pastDate.toISOString().split('T')[0]);

            if (error) {
                console.error("Error fetching cloud data:", error);
                return;
            }

            if (data && data.length > 0) {
                const cloudConsumed = new Set<string>();
                const cloudWorkoutLog = new Set<string>();
                const cloudClosedDays = new Set<string>();
                const cloudSelections: Record<string, number> = {};

                data.forEach((row: any) => {
                    const dKey = row.date;

                    if (row.consumed_meals && Array.isArray(row.consumed_meals)) {
                        row.consumed_meals.forEach((mId: string) => {
                            cloudConsumed.add(`${dKey}_${mId}`);
                        });
                    }

                    if (row.workout_completed) {
                        cloudWorkoutLog.add(dKey);
                    }

                    if (row.closed_day) {
                        cloudClosedDays.add(dKey);
                    }

                    if (row.meal_selections) {
                        Object.entries(row.meal_selections).forEach(([mId, optIdx]) => {
                            cloudSelections[`${dKey}_${mId}`] = Number(optIdx);
                        });
                    }

                    if (row.extra_calories) {
                        setExtraCalories(prev => ({ ...prev, [dKey]: row.extra_calories }));
                    }
                });

                setConsumedMeals(prev => {
                    const next = new Set(prev);
                    cloudConsumed.forEach(k => next.add(k));
                    return next;
                });
                setWorkoutLog(prev => {
                    const next = new Set(prev);
                    cloudWorkoutLog.forEach(k => next.add(k));
                    return next;
                });
                setClosedDays(prev => {
                    const next = new Set(prev);
                    cloudClosedDays.forEach(k => next.add(k));
                    return next;
                });
                setMealSelections(prev => ({ ...prev, ...cloudSelections }));
            }
        };

        fetchCloudData();
    }, [userId]);

    // 2. Debounced Save to Cloud for SINGLE DAY changes
    useEffect(() => {
        if (!userId) return;

        const syncForDate = async (dateKey: string) => {
            const consumedList: string[] = [];
            consumedMeals.forEach(k => {
                if (k.startsWith(dateKey)) {
                    const parts = k.split('_');
                    if (parts.length > 1) consumedList.push(parts[1]);
                }
            });

            const isWorkoutDone = workoutLog.has(dateKey);
            const isClosed = closedDays.has(dateKey);

            const daySelections: Record<string, number> = {};
            Object.entries(mealSelections).forEach(([k, v]) => {
                if (k.startsWith(dateKey)) {
                    const parts = k.split('_');
                    if (parts.length > 1) daySelections[parts[1]] = v as number;
                }
            });

            const dayExtraCals = extraCalories[dateKey] || 0;

            const payload = {
                user_id: userId,
                date: dateKey,
                consumed_meals: consumedList,
                workout_completed: isWorkoutDone,
                closed_day: isClosed,
                extra_calories: dayExtraCals,
                meal_selections: daySelections,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('user_daily_tracking')
                .upsert(payload, { onConflict: 'user_id, date' });

            if (error) console.error("Sync Error for " + dateKey + ":", error);
        };

        const timer = setTimeout(() => {
            syncForDate(selectedDateKey);
            if (selectedDateKey !== todayKey) {
                syncForDate(todayKey);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [consumedMeals, workoutLog, closedDays, mealSelections, selectedDateKey, userId]);

    // --- ACTIONS ---

    // Function to handle meal analysis from camera
    const handleMealAnalysis = (mealId: string, analysis: MealAnalysis) => {
        setDietHistory(prev => {
            const dayLog = prev[todayKey] || {};

            // Replace existing foods with new analyzed foods (don't accumulate)
            const newMealLog = [];
            analysis.foods.forEach(food => {
                newMealLog.push({
                    id: `analyzed-${Date.now()}-${Math.random()}`,
                    name: food.name,
                    calories: food.calories,
                    protein: food.protein,
                    carbs: food.carbs,
                    fats: food.fats,
                    fiber: 0,
                    quantity: food.portion,
                    unit: 'porção'
                });
            });

            return {
                ...prev,
                [todayKey]: { ...dayLog, [mealId]: newMealLog }
            };
        });

        // Mark meal as consumed
        toggleMealConsumption(mealId, todayKey);

        // Also save as selected option for this meal in diet tab
        setMealSelections(prev => ({
            ...prev,
            [`${todayKey}_${mealId} `]: 0 // Select first option (the analyzed one)
        }));
    };

    // Function to open camera modal
    const openMealCamera = (mealId: string, mealName: string) => {
        setSelectedMealForCamera({ id: mealId, name: mealName });
        setCameraModalOpen(true);
    };





    // --- ACTIONS ---

    const toggleWorkoutCompletion = (dateKey: string) => {
        const newLog = new Set(workoutLog);
        if (newLog.has(dateKey)) newLog.delete(dateKey);
        else newLog.add(dateKey);
        setWorkoutLog(newLog);
    };

    const toggleMealConsumption = (mealId: string, dateKey: string) => {
        const key = `${dateKey}_${mealId}`;
        const newConsumed = new Set(consumedMeals);
        if (newConsumed.has(key)) newConsumed.delete(key);
        else newConsumed.add(key);
        setConsumedMeals(newConsumed);
    };

    // --- WORKOUT MANAGEMENT ACTIONS ---

    const handleOpenExerciseModal = (dayName: string) => {
        setCurrentDayForAddExercise(dayName);
        setNewExercise({ name: '', sets: 3, reps: '10-12', rest: '60s', notes: '' });
        setExerciseModalMode('library');
        setExerciseSearchTerm('');
        setSelectedMuscleGroup('Todos');
        setExerciseModalOpen(true);
    };

    const handleSelectFromLibrary = (ex: LibraryExercise) => {
        setNewExercise({
            name: ex.name,
            sets: ex.defaultSets,
            reps: ex.defaultReps,
            rest: ex.defaultRest,
            notes: ''
        });
        setExerciseModalMode('manual');
    };

    const handleAddExercise = () => {
        if (currentDayForAddExercise && newExercise.name) {
            setCustomWorkouts(prev => {
                const existingDay = prev[currentDayForAddExercise];
                let exercisesList: Exercise[] = [];

                if (existingDay) {
                    exercisesList = [...existingDay];
                } else {
                    const originalSession = (plan.workout?.weeklySchedule || []).find(s => s.dayName === currentDayForAddExercise);
                    exercisesList = originalSession ? [...originalSession.exercises] : [];
                }

                exercisesList.push(newExercise as Exercise);

                return { ...prev, [currentDayForAddExercise]: exercisesList };
            });
            setExerciseModalOpen(false);
        }
    };

    const handleRemoveExercise = (dayName: string, index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Remover este exercício do treino?")) return;

        setCustomWorkouts(prev => {
            const existingDay = prev[dayName];
            let exercisesList: Exercise[] = [];

            if (existingDay) {
                exercisesList = [...existingDay];
            } else {
                const originalSession = (plan.workout?.weeklySchedule || []).find(s => s.dayName === dayName);
                exercisesList = originalSession ? [...originalSession.exercises] : [];
            }

            exercisesList.splice(index, 1);
            return { ...prev, [dayName]: exercisesList };
        });
    };

    const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const filteredExercises = useMemo(() => {
        let list = exerciseDatabase;
        if (selectedMuscleGroup !== 'Todos') {
            list = list.filter(ex => ex.group === selectedMuscleGroup);
        }
        if (exerciseSearchTerm) {
            const lower = removeAccents(exerciseSearchTerm.toLowerCase());
            list = list.filter(ex => removeAccents(ex.name.toLowerCase()).includes(lower));
        }
        return list;
    }, [exerciseSearchTerm, selectedMuscleGroup]);

    // --- CALCULA TOTAIS ---

    const getCaloriesForDate = (dateKey: string, onlyConsumed: boolean = false) => {
        const dayLog = dietHistory[dateKey] || {};
        let total = 0;

        (plan.nutrition?.meals || []).forEach(meal => {
            const isConsumed = consumedMeals.has(`${dateKey}_${meal.id}`);

            if (onlyConsumed && !isConsumed) {
                return;
            }

            total += getComputedMealCalories(meal, dateKey);
        });

        return Math.round(total);
    };

    const getDailyMacros = (dateKey: string) => {
        const targets = {
            protein: customTargets.protein,
            carbs: customTargets.carbs,
            fats: customTargets.fats,
            calories: customTargets.calories
        };
        const consumed = { protein: 0, carbs: 0, fats: 0 };
        const dayLog = dietHistory[dateKey] || {};

        (plan.nutrition?.meals || []).forEach(meal => {
            if (consumedMeals.has(`${dateKey}_${meal.id}`)) {
                const logged = dayLog[meal.id];

                if (logged && logged.length > 0) {
                    logged.forEach(item => {
                        consumed.protein += item.protein;
                        consumed.carbs += item.carbs;
                        consumed.fats += item.fats;
                    });
                } else {
                    // Check selected option
                    const optionIndex = mealSelections[`${dateKey}_${meal.id}`] || 0;

                    if (optionIndex === 0) {
                        consumed.protein += meal.macros?.protein || 0;
                        consumed.carbs += meal.macros?.carbs || 0;
                        consumed.fats += meal.macros?.fats || 0;
                    } else {
                        const allOptions = getMealOptions(meal);
                        const selectedOption = allOptions[optionIndex];

                        if (selectedOption && selectedOption.macros) {
                            consumed.protein += selectedOption.macros.protein || 0;
                            consumed.carbs += selectedOption.macros.carbs || 0;
                            consumed.fats += selectedOption.macros.fats || 0;
                        } else {
                            // Fallback
                            consumed.protein += meal.macros?.protein || 0;
                            consumed.carbs += meal.macros?.carbs || 0;
                            consumed.fats += meal.macros?.fats || 0;
                        }
                    }
                }
            }
        });

        return { consumed, targets };
    };

    const getWeeklyWorkoutCount = () => {
        const curr = new Date();
        const first = curr.getDate() - curr.getDay();

        let count = 0;
        for (let i = 0; i < 7; i++) {
            const next = new Date(curr.getTime());
            next.setDate(first + i);
            const dKey = getDateKey(next);
            if (workoutLog.has(dKey)) count++;
        }
        return count;
    };

    const getWeeklyDeficit = () => {
        let totalBalance = 0;
        const bmr = calculateBMR();
        const today = new Date();
        const todayKey = getDateKey(today);

        // Helper to calculate daily balance with overrides
        const calculateDailyBalance = (dKey: string) => {
            const isDayClosed = closedDays.has(dKey);
            const planMeals = plan.nutrition?.meals || [];

            // If the plan has no meals, we can't judge completion except via "Close Day"
            if (planMeals.length === 0 && !isDayClosed) {
                return 0;
            }

            let effectiveBMR = 0;
            const currentMealIds = new Set(planMeals.map(m => m.id));
            const consumedThisDay = Array.from(consumedMeals).filter((k: any) => {
                const key = String(k);
                if (!key.startsWith(dKey)) return false;
                const mealId = key.split('_')[1];
                return currentMealIds.has(mealId);
            });

            // Strict check: day must be explicitly closed OR all current plan meals must be marked consumed
            const isAllMealsMarked = planMeals.length > 0 && consumedThisDay.length >= planMeals.length;

            if (isDayClosed || isAllMealsMarked) {
                effectiveBMR = bmr;
            } else {
                // User Requirement: Skip calculation if day is not finished/closed
                return 0;
            }

            const fitData = getGoogleFitDataForDate(dKey);
            const manualExtra = extraCalories[dKey];
            const consumedCals = getCaloriesForDate(dKey, true);

            let activeBurn = 0;
            const fitCals = fitData.calories_burned || 0;

            if (manualExtra !== undefined) {
                activeBurn = manualExtra;
            } else if (fitCals > 0) {
                activeBurn = Math.max(0, fitCals - bmr);
            }

            const totalBurned = effectiveBMR + activeBurn;
            const balance = totalBurned - consumedCals;

            // Consistency check: only positive balance contributes to the weight loss "stored deficit"
            return Math.max(0, balance);
        };

        if (deficitStartDate) {
            // Forward Cycle: Sum TMB/Activity only for valid passed days
            const [y, m, d] = deficitStartDate.split('-').map(Number);
            const startDate = new Date(y, m - 1, d);

            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                const dKey = getDateKey(date);

                // Only count up to today (inclusive)
                if (dKey > todayKey) continue;

                totalBalance += calculateDailyBalance(dKey);
            }
        } else {
            // Standard: Last 7 days
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dKey = getDateKey(date);

                totalBalance += calculateDailyBalance(dKey);
            }
        }

        return Math.round(totalBalance);
    };

    const selectedDayPlannedCalories = getCaloriesForDate(selectedDateKey, false);
    const displayConsumedCalories = getCaloriesForDate(selectedDateKey, true);
    const weeklyWorkoutsDone = getWeeklyWorkoutCount();
    const weeklyDeficit = getWeeklyDeficit();
    const weeklyFrequencyTarget = user.workoutFrequency || 3;
    const displayMacros = getDailyMacros(selectedDateKey);

    const triggerCelebration = () => {
        if ((window as any).confetti) {
            const confetti = (window as any).confetti;
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                // since particles fall down, start a bit higher than random
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            // Show written message
            setShowCelebrationMessage(true);
            setTimeout(() => setShowCelebrationMessage(false), 5000);
        }
    };

    // --- ACTIONS ---

    const toggleExercise = (dayName: string, exerciseName: string) => {
        const key = `${dayName}-${exerciseName}`;
        const newSet = new Set(completedExercises);
        if (newSet.has(key)) newSet.delete(key);
        else newSet.add(key);
        setCompletedExercises(newSet);
    };

    const handleSelectOption = (mealId: string, optionIndex: number) => {
        const key = `${selectedDateKey}_${mealId}`;
        setMealSelections(prev => ({
            ...prev,
            [key]: optionIndex
        }));

        // Reset customizations (dietHistory) and exclusions when switching options
        // This ensures the user sees the fresh default ingredients of the new option
        setDietHistory(prev => {
            const dayLog = prev[selectedDateKey] || {};
            // If we have customizations for this meal, remove them for this day
            if (dayLog[mealId]) {
                const newDayLog = { ...dayLog };
                delete newDayLog[mealId];
                return { ...prev, [selectedDateKey]: newDayLog };
            }
            return prev;
        });

        // Also clear exclusions
        setExcludedIngredients(prev => {
            if (prev[key]) {
                const newEx = { ...prev };
                delete newEx[key];
                return newEx;
            }
            return prev;
        });
    };

    const handleOpenFoodModal = (mealId: string) => {
        setCurrentMealIdForAdd(mealId);
        setFoodSearchTerm('');
        setFoodModalOpen(true);
    };
    const handleAddFood = (food: FoodItem) => {
        const targetDateKey = cameraTargetMealId ? todayKey : selectedDateKey;
        const targetMealId = cameraTargetMealId || currentMealIdForAdd;

        if (targetMealId) {
            setDietHistory(prev => {
                const dayLog = prev[targetDateKey] || {};
                const mealLog = dayLog[targetMealId] || [];
                return {
                    ...prev,
                    [targetDateKey]: { ...dayLog, [targetMealId]: [...mealLog, food] }
                };
            });

            if (cameraTargetMealId) {
                const key = `${todayKey}_${cameraTargetMealId}`;
                const newConsumed = new Set(consumedMeals);
                newConsumed.add(key);
                setConsumedMeals(newConsumed);
            }

            setFoodModalOpen(false);
            setCameraOpen(false);
            setAnalyzedFood(null);
            setCameraTargetMealId(null);
        }
    };

    const handleOpenEditFood = (mealId: string, index: number, food: FoodItem) => {
        setEditingFoodData({ mealId, index, food });

        // Parse portion logic
        const portionStr = food.portion || '';

        // Try to finding grams in parentheses first, e.g. "1 concha (100g)"
        const parenMatch = portionStr.match(/\((\d+)\s*g\)/i);
        // Otherwise look for leading number
        const leadingMatch = portionStr.match(/^(\d+)\s*(.*)$/);

        let pValue = '';
        let pUnit = '';

        if (parenMatch) {
            pValue = parenMatch[1];
            pUnit = 'g';
        } else if (leadingMatch) {
            pValue = leadingMatch[1];
            pUnit = leadingMatch[2].trim();
        }

        const pValueNum = parseFloat(pValue) || 0;

        const initialValues = {
            name: food.name,
            calories: String(food.calories),
            protein: String(food.protein || 0),
            carbs: String(food.carbs || 0),
            fats: String(food.fats || 0),
            portionValue: pValue,
            portionUnit: pUnit || 'g'
        };

        setEditFoodForm(initialValues);
        setBaseEditValues({
            calories: food.calories,
            protein: food.protein || 0,
            carbs: food.carbs || 0,
            fats: food.fats || 0,
            portionValue: pValueNum
        });
        setIsEditFoodModalOpen(true);
    };

    // Auto-scale calories and macros when portion value changes in Edit Modal
    useEffect(() => {
        if (!isEditFoodModalOpen || !baseEditValues.portionValue) return;

        const currentValue = parseFloat(editFoodForm.portionValue);
        if (isNaN(currentValue) || currentValue <= 0) return;

        const ratio = currentValue / baseEditValues.portionValue;

        setEditFoodForm(prev => ({
            ...prev,
            calories: String(Math.round(baseEditValues.calories * ratio)),
            protein: String(Number((baseEditValues.protein * ratio).toFixed(1))),
            carbs: String(Number((baseEditValues.carbs * ratio).toFixed(1))),
            fats: String(Number((baseEditValues.fats * ratio).toFixed(1)))
        }));
    }, [editFoodForm.portionValue, isEditFoodModalOpen, baseEditValues]);

    const handleConfirmEditFood = () => {
        if (!editingFoodData || !editFoodForm.name) return;

        // Combine value and unit
        const combinedPortion = `${editFoodForm.portionValue}${editFoodForm.portionUnit}`;

        const updatedFood: FoodItem = {
            ...editingFoodData.food,
            name: editFoodForm.name,
            calories: Number(editFoodForm.calories),
            protein: Number(editFoodForm.protein) || 0,
            carbs: Number(editFoodForm.carbs) || 0,
            fats: Number(editFoodForm.fats) || 0,
            portion: combinedPortion
        };

        setDietHistory(prev => {
            const dayLog = prev[selectedDateKey] || {};
            const mealLog = [...(dayLog[editingFoodData.mealId] || [])];
            mealLog[editingFoodData.index] = updatedFood;
            return {
                ...prev,
                [selectedDateKey]: { ...dayLog, [editingFoodData.mealId]: mealLog }
            };
        });

        setIsEditFoodModalOpen(false);
        setEditingFoodData(null);
    };

    const handleAddManualFood = () => {
        if (!newManualFood.name || !newManualFood.calories) return;

        // Combine value and unit
        const combinedPortion = `${newManualFood.portionValue}${newManualFood.portionUnit}`;

        const food: FoodItem = {
            id: `manual-${Date.now()}`,
            name: newManualFood.name,
            calories: Number(newManualFood.calories),
            protein: Number(newManualFood.protein) || 0,
            carbs: Number(newManualFood.carbs) || 0,
            fats: Number(newManualFood.fats) || 0,
            portion: combinedPortion,
            category: 'meal'
        };

        handleAddFood(food);
        // Reset form
        setNewManualFood({ name: '', calories: '', protein: '', carbs: '', fats: '', portionValue: '1', portionUnit: 'unidade' });
    };

    const handleRemoveFood = (mealId: string, index: number) => {
        setDietHistory(prev => {
            const dayLog = prev[selectedDateKey] || {};
            const mealLog = [...(dayLog[mealId] || [])];
            mealLog.splice(index, 1);
            return { ...prev, [selectedDateKey]: { ...dayLog, [mealId]: mealLog } };
        });
    };

    // --- CAMERA & GEMINI VISION LOGIC ---

    const startCamera = async (mealId: string | null = null, mode: 'log' | 'fruit' = 'log') => {
        setCameraMode(mode);
        setAnalyzedFood(null);
        setFruitAnalysis(null);

        if (mode === 'log' && mealId) {
            setCameraTargetMealId(mealId);
        } else {
            setCameraTargetMealId(null);
        }

        setCameraOpen(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setCameraStream(stream);
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.warn("Back camera not found, trying fallback...", err);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setCameraStream(stream);
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err2) {
                console.error("No camera found:", err2);
                alert("Não foi possível acessar a câmera. Verifique se o dispositivo possui câmera e se as permissões foram concedidas.");
                setCameraOpen(false);
                setCameraTargetMealId(null);
            }
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setCameraOpen(false);
        setIsAnalyzing(false);
        setCameraTargetMealId(null);
    };

    const captureAndAnalyze = async () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

            setIsAnalyzing(true);
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            try {
                if (cameraMode === 'log') {
                    const response = await ai.models.generateContent({
                        model: 'gemini-3-flash-preview',
                        contents: {
                            parts: [
                                { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                                { text: "Identifique o alimento principal nesta imagem e estime os macros (calorias, proteína, carbos, gordura) para uma porção padrão de consumo. Retorne apenas JSON." }
                            ]
                        },
                        config: {
                            responseMimeType: 'application/json',
                            responseSchema: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    calories: { type: Type.NUMBER },
                                    protein: { type: Type.NUMBER },
                                    carbs: { type: Type.NUMBER },
                                    fats: { type: Type.NUMBER },
                                    portion: { type: Type.STRING },
                                },
                                required: ["name", "calories", "protein", "carbs", "fats", "portion"]
                            }
                        }
                    });

                    const resultText = response.text;
                    if (resultText) {
                        const data = JSON.parse(resultText);
                        const food: FoodItem = {
                            id: `scanned-${Date.now()}`,
                            name: data.name,
                            calories: data.calories,
                            protein: data.protein,
                            carbs: data.carbs,
                            fats: data.fats,
                            portion: data.portion,
                            category: 'meal'
                        };
                        setAnalyzedFood(food);
                    }
                } else {
                    // FRUIT PICKER MODE
                    const response = await ai.models.generateContent({
                        model: 'gemini-3-flash-preview',
                        contents: {
                            parts: [
                                { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                                { text: "Atue como um especialista em agronomia. Identifique a fruta ou vegetal na imagem. Analise visualmente se ela está madura, doce ou boa para consumo com base na cor, casca, manchas ou talos. Para melancia procure mancha amarela. Retorne JSON." }
                            ]
                        },
                        config: {
                            responseMimeType: 'application/json',
                            responseSchema: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "Nome da fruta" },
                                    quality: { type: Type.STRING, enum: ["Excelente", "Boa", "Ruim", "Verde"] },
                                    sweetness: { type: Type.STRING, description: "Nível de doçura estimado ou sabor" },
                                    details: { type: Type.STRING, description: "Explicação visual curta do motivo da qualidade" },
                                    tips: { type: Type.STRING, description: "Dica de como escolher essa fruta melhor" },
                                },
                                required: ["name", "quality", "sweetness", "details", "tips"]
                            }
                        }
                    });

                    const resultText = response.text;
                    if (resultText) {
                        const data = JSON.parse(resultText);
                        setFruitAnalysis(data as FruitAnalysis);
                    }
                }
            } catch (error) {
                console.error("Gemini Vision Error:", error);
                alert("Não foi possível analisar a imagem. Tente novamente.");
            } finally {
                setIsAnalyzing(false);
            }
        }
    };


    // Custom Option Logic
    const handleSaveCustomOptionClick = (mealId: string, e: React.MouseEvent) => {
        e.preventDefault();
        const dayLog = dietHistory[selectedDateKey] || {};
        const currentItems = dayLog[mealId] || [];

        if (currentItems.length === 0) {
            alert("Adicione alimentos antes de salvar como opção.");
            return;
        }

        setMealIdToSave(mealId);
        setNewOptionName('');
        setSaveModalOpen(true);
    };

    const confirmSaveOption = () => {
        if (!mealIdToSave || !newOptionName.trim()) return;

        const mealId = mealIdToSave;
        const dayLog = dietHistory[selectedDateKey] || {};
        const currentItems = dayLog[mealId] || [];

        // Calculate stats for this custom option
        const stats = currentItems.reduce((acc, item) => ({
            calories: acc.calories + item.calories,
            protein: acc.protein + item.protein,
            carbs: acc.carbs + item.carbs,
            fats: acc.fats + item.fats
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

        const newOption: MealOption = {
            id: `custom-${Date.now()}`,
            name: newOptionName,
            description: "Opção personalizada criada por você.",
            ingredients: currentItems.map(item => ({
                name: item.name,
                amount: item.portion
            })),
            calories: Math.round(stats.calories),
            macros: {
                protein: Math.round(stats.protein),
                carbs: Math.round(stats.carbs),
                fats: Math.round(stats.fats)
            }
        };

        setCustomOptions(prev => {
            const existing = prev[mealId] || [];
            return {
                ...prev,
                [mealId]: [...existing, newOption]
            };
        });

        const meal = plan.nutrition.meals.find(m => m.id === mealId);
        if (meal) {
            const originalLength = meal.options.length;
            const existingCustomLength = (customOptions[mealId] || []).length;
            const newIndex = originalLength + existingCustomLength;
            handleSelectOption(mealId, newIndex);
        }

        setSaveModalOpen(false);
        setMealIdToSave(null);
    };

    const handleDeleteOption = (mealId: string, optionId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        // Only custom options can be deleted now
        if (String(optionId).startsWith('custom-')) {
            if (!window.confirm("Tem certeza que deseja diminuir esta opção personalizada?")) return;
            setCustomOptions(prev => {
                const existing = prev[mealId] || [];
                return {
                    ...prev,
                    [mealId]: existing.filter(opt => opt.id !== optionId)
                };
            });
        }
    };

    const handleToggleIngredient = (mealId: string, ingredientIndex: number) => {
        const key = `${selectedDateKey}_${mealId}`;
        setExcludedIngredients(prev => {
            const currentList = prev[key] || [];
            if (currentList.includes(ingredientIndex)) {
                return { ...prev, [key]: currentList.filter(i => i !== ingredientIndex) };
            } else {
                return { ...prev, [key]: [...currentList, ingredientIndex] };
            }
        });
    };


    // --- SAVE DAY / PLAN LOGIC ---
    const handleOpenPlanDayModal = () => {
        // Se já estiver salvo, pegamos o valor atual, senão padrão 1
        const currentInfo = savedDays[selectedDateKey];
        setHouseholdSizeInput(currentInfo ? currentInfo.householdSize : 1);
        setPlanDayModalOpen(true);
    };

    const confirmPlanDay = () => {
        setSavedDays(prev => ({
            ...prev,
            [selectedDateKey]: {
                isSaved: true,
                householdSize: householdSizeInput
            }
        }));
        setPlanDayModalOpen(false);
    };

    const handleUnsaveDay = () => {
        if (window.confirm("Remover este dia do planejamento da lista de compras?")) {
            setSavedDays(prev => {
                const copy = { ...prev };
                delete copy[selectedDateKey];
                return copy;
            });
        }
    };

    const handleToggleShoppingItem = (itemName: string) => {
        const newSet = new Set(checkedItems);
        if (newSet.has(itemName)) {
            newSet.delete(itemName);
        } else {
            newSet.add(itemName);
        }
        setCheckedItems(newSet);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleGenerate = () => {
        setIsSmartImportModalOpen(true);
    };

    const handleSavePreferences = (newPreferences: string[]) => {
        setFoodPreferences(newPreferences);
        setIsFoodPreferencesModalOpen(false);

        if (window.confirm("Deseja regenerar seu plano alimentar agora com base nas novas preferências?")) {
            if (user) {
                // IMPORTANT: We need to pass the NEW preferences to generatePlan because setState is async
                // and user state update in useEffect might not have happened yet
                const updatedUser = { ...user, foodPreferences: newPreferences };
                try {
                    const newPlan = generatePlan(updatedUser);

                    // 1. Update Parent State (for good measure)
                    onUpdatePlan(newPlan);

                    // 2. EXPLICITLY Save to LocalStorage immediately (bypass prop delay)
                    localStorage.setItem('fitcoach_plan', JSON.stringify(newPlan));
                    localStorage.setItem('fitcoach_user', JSON.stringify(updatedUser)); // Save prefs too

                    // 3. Clear all "modification" history
                    localStorage.removeItem('fitcoach_history');
                    localStorage.removeItem('fitcoach_excluded_ingredients');
                    localStorage.removeItem('fitcoach_selections');
                    localStorage.removeItem('fitcoach_custom_options');

                    // 4. Reload after a brief moment to ensure writes complete
                    setTimeout(() => {
                        window.location.reload();
                    }, 100);

                } catch (error) {
                    console.error("Error regenerating plan:", error);
                    alert("Erro ao regenerar o plano. Tente novamente mais tarde.");
                }
            }
        }
    };

    const handleResetClick = () => {
        if (window.confirm("Deseja refazer sua avaliação? Isso apagará seu plano atual.")) {
            onReset();
        }
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setActiveTab('diet');
    };

    const filteredFoods = useMemo(() => {
        if (!foodSearchTerm) return foodDatabase;
        const lower = removeAccents(foodSearchTerm.toLowerCase());
        return foodDatabase.filter(f => removeAccents(f.name.toLowerCase()).includes(lower));
    }, [foodSearchTerm]);

    // --- SHOPPING LIST CALCULATOR & PARSER ---

    const calculatedShoppingList = useMemo(() => {
        const itemsMap: Record<string, ShoppingItem & { breakdown: { days: number, people: number } }> = {};

        // Agora iteramos APENAS sobre os dias salvos (savedDays)
        const savedDates = Object.keys(savedDays);

        if (savedDates.length === 0) return [];

        savedDates.forEach(dKey => {
            const savedInfo = savedDays[dKey] as SavedDayInfo;
            if (!savedInfo || !savedInfo.isSaved) return;

            const peopleCount = savedInfo.householdSize;

            plan.nutrition.meals.forEach(meal => {
                const selectionKey = `${dKey}_${meal.id}`;

                // LOGICA DE SELEÇÃO PADRÃO BASEADA NO DIA
                let selectedIdx = mealSelections[selectionKey];
                const allOptions = getMealOptions(meal);

                if (selectedIdx === undefined) {
                    const dayOfWeek = new Date(dKey + 'T12:00:00').getDay(); // 0-6 (Sun-Sat)
                    selectedIdx = dayOfWeek % allOptions.length;
                }

                const selectedOption = allOptions[selectedIdx];

                if (selectedOption) {
                    (selectedOption.ingredients || []).forEach(ingredient => {
                        const cleanName = ingredient.name.trim();
                        const { value, unit } = parseIngredientAmount(ingredient.amount);
                        const totalValue = value * peopleCount;

                        const mapKey = `${cleanName}__${unit} `;

                        if (!itemsMap[mapKey]) {
                            itemsMap[mapKey] = {
                                name: cleanName,
                                category: getIngredientCategory(cleanName),
                                quantity: 0,
                                unit: unit,
                                breakdown: { days: 0, people: 0 }
                            };
                        }
                        itemsMap[mapKey].quantity += totalValue;
                        itemsMap[mapKey].breakdown.days += 1;
                        itemsMap[mapKey].breakdown.people += peopleCount;
                    });
                }
            });
        });

        return Object.values(itemsMap).sort((a, b) => a.category.localeCompare(b.category));
    }, [plan.nutrition.meals, mealSelections, customOptions, savedDays]);

    const formatShoppingQuantity = (qty: number, unit: string) => {
        if (unit === 'g') {
            if (qty >= 1000) return `${(qty / 1000).toFixed(1).replace('.0', '')} kg`;
            return `${Math.ceil(qty)} g`;
        }
        if (unit === 'ml') {
            if (qty >= 1000) return `${(qty / 1000).toFixed(1).replace('.0', '')} L`;
            return `${Math.ceil(qty)} ml`;
        }
        return `${Math.ceil(qty)} ${unit}${qty > 1 && unit !== 'un' && !unit.endsWith('s') ? 's' : ''} `;
    };

    const handleShare = async () => {
        const activeList = calculatedShoppingList.filter(item => !checkedItems.has(`${item.name}__${item.unit} `));

        if (activeList.length === 0) {
            alert("Sua lista de pendências está vazia!");
            return;
        }

        let text = "*Lista de Compras - FitCoach Pro*\n\n";

        const grouped = activeList.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {} as Record<string, typeof activeList>);

        Object.entries(grouped).forEach(([cat, items]: [string, any[]]) => {
            text += `* ${cat}*\n`;
            items.forEach(item => {
                text += `[] ${item.name} - ${formatShoppingQuantity(item.quantity, item.unit)} \n`;
            });
            text += "\n";
        });

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Lista de Compras FitCoach',
                    text: text,
                });
            } else {
                await navigator.clipboard.writeText(text);
                alert("Lista copiada para a área de transferência!");
            }
        } catch (err) {
            console.error('Error sharing:', err);
            alert("Não foi possível compartilhar a lista.");
        }
    };

    // --- RENDERERS ---

    // Helper to get days in month
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // --- PREMIUM UI COMPONENTS ---

    const PremiumLineChart = ({ data, color, yLabel }: { data: { date: string, value: number }[], color: string, yLabel: string }) => {
        if (data.length < 2) {
            return (
                <div className="h-48 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                    <p>Dados insuficientes para o gráfico.</p>
                    <p className="text-[10px]">Pelo menos 2 registros necessários.</p>
                </div>
            );
        }

        const width = 400;
        const height = 200;
        const padding = 20;

        const values = data.map(d => d.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const range = maxVal - minVal || 1;

        const getY = (val: number) => height - padding - ((val - minVal) / range) * (height - 2 * padding);
        const getX = (index: number) => padding + (index / (data.length - 1)) * (width - 2 * padding);

        // Generate Path Points
        const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));

        // Bézier Curve Calculation (Catmull-Rom like)
        let dPath = `M ${points[0].x} ${points[0].y} `;
        for (let i = 0; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];
            const cp1x = curr.x + (next.x - curr.x) / 2;
            dPath += ` C ${cp1x} ${curr.y}, ${cp1x} ${next.y}, ${next.x} ${next.y} `;
        }

        const areaPath = `${dPath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

        return (
            <div className="relative group w-full h-full">
                <svg viewBox={`0 0 ${width} ${height} `} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id={`gradient - ${color.replace('#', '')} `} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area Gradient */}
                    <path d={areaPath} fill={`url(#gradient - ${color.replace('#', '')})`} />

                    {/* Main Curve */}
                    <path
                        d={dPath}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-sm"
                    />

                    {/* Data Points */}
                    {points.map((p, i) => (
                        <g key={i} className="group/point">
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r="4"
                                fill="white"
                                stroke={color}
                                strokeWidth="2"
                                className="transition-all duration-300 group-hover/point:r-6"
                            />
                            {/* Hover tooltip logic simplified for SVG */}
                            <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-200 pointer-events-none">
                                <rect
                                    x={p.x - 25}
                                    y={p.y - 35}
                                    width="50"
                                    height="25"
                                    rx="6"
                                    fill="#1f2937"
                                />
                                <text
                                    x={p.x}
                                    y={p.y - 18}
                                    textAnchor="middle"
                                    fill="white"
                                    style={{ fontSize: '10px', fontWeight: 'bold' }}
                                >
                                    {data[i].value}{yLabel}
                                </text>
                            </g>
                        </g>
                    ))}
                </svg>
            </div>
        );
    };

    const renderProgress = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        // Calculate Monthly Calorie Goal Adherence
        const getCalorieStatus = (day: number) => {
            const date = new Date(currentYear, currentMonth, day);
            const dKey = getDateKey(date);
            // Skip future days
            if (date > today) return 'future';

            const planned = getCaloriesForDate(dKey, false); // Planned total
            const consumed = getCaloriesForDate(dKey, true); // Actually consumed/checked

            if (consumed === 0 && !dietHistory[dKey]) return 'empty';

            // Tolerance of 10%
            const diff = Math.abs(planned - consumed);
            const tolerance = planned * 0.10;

            if (diff <= tolerance) return 'success';
            if (consumed > planned + tolerance) return 'over';
            return 'under';
        };

        // Prepare Chart Data
        const sortedWeightDates = Object.keys(weightHistory).sort();
        const weightChartData = sortedWeightDates.map(date => ({ date, value: weightHistory[date] }));

        const sortedFatDates = Object.keys(bodyFatHistory).sort();
        const fatChartData = sortedFatDates.map(date => ({ date, value: bodyFatHistory[date] }));

        const sortedWaistDates = Object.keys(waistHistory).sort();
        const waistChartData = sortedWaistDates.map(date => ({ date, value: waistHistory[date] }));

        return (
            <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Evolução Mensal</h2>
                    <button
                        onClick={() => setIsMeasurementModalOpen(true)}
                        className="bg-brand-600 dark:bg-brand-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-brand-700 dark:hover:bg-brand-600 active:scale-95 transition-all shadow-lg shadow-brand-200 dark:shadow-brand-900/40"
                    >
                        <Plus className="w-4 h-4" /> Registrar Medidas
                    </button>
                </div>

                {/* GOOGLE FIT ACTIVITY CHARTS */}
                {googleFitData.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        <div className="col-span-full">
                            <h2 className="text-xl font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                                Atividade Física (Google Fit) - Últimos 30 Dias
                            </h2>
                        </div>

                        {/* STEPS CHART */}
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-green-500 dark:text-green-400" /> Passos Diários
                                </h3>
                                {(() => {
                                    const totalSteps = googleFitData.reduce((sum, d) => sum + d.steps, 0);
                                    const avgSteps = Math.round(totalSteps / googleFitData.length);
                                    return (
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-green-600 dark:text-green-400">
                                                {avgSteps.toLocaleString()}
                                            </div>
                                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500">média/dia</div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="h-48">
                                <PremiumLineChart
                                    data={googleFitData.map(d => ({
                                        label: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                                        value: d.steps
                                    }))}
                                    color="#10b981"
                                    yLabel=""
                                />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-xl text-center border border-transparent dark:border-green-900/50">
                                    <div className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-1">Total</div>
                                    <div className="text-lg font-black text-green-900 dark:text-green-200">
                                        {googleFitData.reduce((sum, d) => sum + d.steps, 0).toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-xl text-center border border-transparent dark:border-green-900/50">
                                    <div className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-1">Melhor Dia</div>
                                    <div className="text-lg font-black text-green-900 dark:text-green-200">
                                        {Math.max(...googleFitData.map(d => d.steps)).toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-xl text-center border border-transparent dark:border-green-900/50">
                                    <div className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-1">Meta 10k</div>
                                    <div className="text-lg font-black text-green-900 dark:text-green-200">
                                        {googleFitData.filter(d => d.steps >= 10000).length}/{googleFitData.length}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CALORIES BURNED CHART */}
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400" /> Calorias Queimadas
                                </h3>
                                {(() => {
                                    const totalCalories = googleFitData.reduce((sum, d) => sum + d.calories_burned, 0);
                                    const avgCalories = Math.round(totalCalories / googleFitData.length);
                                    return (
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
                                                {avgCalories}
                                            </div>
                                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500">média/dia</div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="h-48">
                                <PremiumLineChart
                                    data={googleFitData.map(d => ({
                                        label: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                                        value: d.calories_burned
                                    }))}
                                    color="#f97316"
                                    yLabel=" kcal"
                                />
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-xl text-center border border-transparent dark:border-orange-900/50">
                                    <div className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase mb-1">Total</div>
                                    <div className="text-lg font-black text-orange-900 dark:text-orange-200">
                                        {googleFitData.reduce((sum, d) => sum + d.calories_burned, 0).toLocaleString()} kcal
                                    </div>
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-xl text-center border border-transparent dark:border-orange-900/50">
                                    <div className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase mb-1">Melhor Dia</div>
                                    <div className="text-lg font-black text-orange-900 dark:text-orange-200">
                                        {Math.max(...googleFitData.map(d => d.calories_burned))} kcal
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-6">
                    <h2 className="text-xl font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Scale className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                        Medidas e Composição Corporal
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* WEIGHT CHART */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-brand-500 dark:text-brand-400" /> Peso Corporal
                            </h3>
                            {weightChartData.length > 0 && (
                                <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
                                    {weightChartData[weightChartData.length - 1].value}<span className="text-xs font-bold text-gray-400 dark:text-gray-500 ml-1">kg</span>
                                </span>
                            )}
                        </div>
                        <div className="h-48">
                            <PremiumLineChart data={weightChartData.slice(-10)} color="#6366f1" yLabel="kg" />
                        </div>
                    </div>

                    {/* BODY FAT CHART */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-rose-500 dark:text-rose-400" /> Gordura Corporal
                            </h3>
                            {fatChartData.length > 0 && (
                                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                    {fatChartData[fatChartData.length - 1].value}<span className="text-xs font-bold text-gray-400 dark:text-gray-500 ml-1">%</span>
                                </span>
                            )}
                        </div>
                        <div className="h-48">
                            <PremiumLineChart data={fatChartData.slice(-10)} color="#f43f5e" yLabel="%" />
                        </div>
                    </div>

                    {/* WAIST CHART */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <ScanLine className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> Medida Abdominal
                            </h3>
                            {waistChartData.length > 0 && (
                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                    {waistChartData[waistChartData.length - 1].value}<span className="text-xs font-bold text-gray-400 dark:text-gray-500 ml-1">cm</span>
                                </span>
                            )}
                        </div>
                        <div className="h-48">
                            <PremiumLineChart data={waistChartData.slice(-10)} color="#10b981" yLabel="cm" />
                        </div>
                    </div>
                </div>


                {/* MEASUREMENT MODAL */}
                {isMeasurementModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-800">
                            <h3 className="font-bold text-xl mb-4 text-gray-800 dark:text-white">Registrar Medidas</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">Peso (kg)</label>
                                    <input
                                        type="number"
                                        value={newMeasurement.weight}
                                        onChange={e => setNewMeasurement({ ...newMeasurement, weight: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold text-gray-900 dark:text-white transition-colors"
                                        placeholder="Ex: 75.5"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">Gordura Corporal % (Opcional)</label>
                                    <input
                                        type="number"
                                        value={newMeasurement.bodyFat}
                                        onChange={e => setNewMeasurement({ ...newMeasurement, bodyFat: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold text-gray-900 dark:text-white transition-colors"
                                        placeholder="Ex: 15"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">Medida Abdominal (cm)</label>
                                    <input
                                        type="number"
                                        value={newMeasurement.waist}
                                        onChange={e => setNewMeasurement({ ...newMeasurement, waist: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold text-gray-900 dark:text-white transition-colors"
                                        placeholder="Ex: 85"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setIsMeasurementModalOpen(false)}
                                    className="flex-1 py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!newMeasurement.weight) return;
                                        // Use selectedDateKey to respect the date navigation
                                        const dateToSave = selectedDateKey || getDateKey(new Date());

                                        // Optimistic UI Update first
                                        setWeightHistory(prev => ({ ...prev, [dateToSave]: Number(newMeasurement.weight) }));
                                        if (newMeasurement.bodyFat) {
                                            setBodyFatHistory(prev => ({ ...prev, [dateToSave]: Number(newMeasurement.bodyFat) }));
                                        }
                                        if (newMeasurement.waist) {
                                            setWaistHistory(prev => ({ ...prev, [dateToSave]: Number(newMeasurement.waist) }));
                                        }

                                        // Persist to Supabase
                                        try {
                                            const payload: any = {
                                                user_id: userId,
                                                date: dateToSave,
                                                weight: Number(newMeasurement.weight)
                                            };
                                            if (newMeasurement.bodyFat) payload.body_fat = Number(newMeasurement.bodyFat);
                                            if (newMeasurement.waist) payload.waist = Number(newMeasurement.waist);

                                            const { error } = await supabase
                                                .from('user_measurements')
                                                .upsert(payload, { onConflict: 'user_id,date' });

                                            if (error) {
                                                console.error("Error saving measurement to Supabase:", error);
                                                alert("Erro ao salvar na nuvem, mas salvo localmente.");
                                            }
                                        } catch (err) {
                                            console.error("Unexpected error saving measurement:", err);
                                        }

                                        setIsMeasurementModalOpen(false);
                                        setNewMeasurement({ weight: '', bodyFat: '', waist: '' });
                                    }}
                                    className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-200"
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        );
    };

    const renderDeficitBreakdownModal = () => {
        if (!isDeficitBreakdownOpen) return null;

        const bmr = calculateBMR();
        const today = new Date();
        const todayKey = getDateKey(today);
        const days = [];

        if (deficitStartDate) {
            // Forward cycle: Start Date + 6 days
            const [y, m, d] = deficitStartDate.split('-').map(Number);
            const startDate = new Date(y, m - 1, d);

            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                const dKey = getDateKey(date);

                const isFuture = dKey > todayKey;

                if (isFuture) {
                    days.push({ date, dKey, bmr, extra: 0, consumed: 0, balance: bmr, isFuture: true });
                } else {
                    const fitData = getGoogleFitDataForDate(dKey);
                    const consumed = getCaloriesForDate(dKey, true);
                    const manualExtra = extraCalories[dKey];
                    const totalFit = fitData.calories_burned || 0;

                    let extra = 0;
                    if (manualExtra !== undefined) {
                        extra = manualExtra;
                    } else if (totalFit > 0) {
                        extra = Math.max(0, totalFit - bmr);
                    }

                    const balance = (bmr + extra) - consumed;
                    days.push({ date, dKey, bmr, extra, consumed, balance, isFuture: false });
                }
            }
        } else {
            // Standard: Last 7 days
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dKey = getDateKey(date);

                const fitData = getGoogleFitDataForDate(dKey);
                const consumed = getCaloriesForDate(dKey, true);
                const manualExtra = extraCalories[dKey];
                const totalFit = fitData.calories_burned || 0;

                let extra = 0;
                if (manualExtra !== undefined) {
                    extra = manualExtra;
                } else if (totalFit > 0) {
                    extra = Math.max(0, totalFit - bmr);
                }

                const balance = (bmr + extra) - consumed;
                days.push({ date, dKey, bmr, extra, consumed, balance, isFuture: false });
            }
        }

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-800 shadow-2xl">
                    <div className="bg-brand-600 dark:bg-brand-500 p-6 text-white relative">
                        <button
                            onClick={() => setIsDeficitBreakdownOpen(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-black flex items-center gap-2">
                            <TrendingUp className="w-6 h-6" />
                            Resumo de Déficit
                        </h2>
                        <p className="text-brand-100 dark:text-brand-200 text-sm mt-1">
                            {deficitStartDate
                                ? `Ciclo de 7 dias (Início: ${new Date(Number(deficitStartDate.split('-')[0]), Number(deficitStartDate.split('-')[1]) - 1, Number(deficitStartDate.split('-')[2])).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })})`
                                : "Últimos 7 dias acumulados"
                            }
                        </p>
                    </div>

                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-3">
                            {days.map((day, idx) => {
                                return (
                                    <div key={day.dKey} className={`rounded-2xl p-4 border transition-colors ${day.dKey === todayKey ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-900/50' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800'} ${day.isFuture ? 'opacity-70 dashed-border' : ''}`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex flex-col">
                                                <h3 className={`font-bold ${day.dKey === todayKey ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {day.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
                                                    {day.dKey === todayKey && " (Hoje)"}
                                                </h3>
                                                {day.isFuture && <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Projeção (TMB)</span>}
                                            </div>
                                            <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${day.balance >= 0 ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'}`}>
                                                {day.balance >= 0 ? `+${day.balance} kcal` : `${day.balance} kcal`}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="text-center">
                                                <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase">TMB</p>
                                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{day.bmr}</p>
                                            </div>
                                            <button
                                                onClick={() => handleOpenExtraCaloriesModal(day.dKey, day.extra)}
                                                className="text-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors py-1 -my-1"
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase">Atividade</p>
                                                    <Edit2 className="w-2 h-2 text-gray-400 dark:text-gray-500" />
                                                </div>
                                                <p className="text-xs font-bold text-brand-600 dark:text-brand-400">+{day.extra}</p>
                                            </button>
                                            <div className="text-center border-l border-gray-200 dark:border-gray-800">
                                                <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase">Consumo</p>
                                                <p className="text-xs font-black text-orange-600 dark:text-orange-400">-{day.consumed}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Saldo Semanal</p>
                                <p className="text-2xl font-black text-brand-600 dark:text-brand-400">{weeklyDeficit} kcal</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Queima Estimada</p>
                                <p className="text-lg font-black text-gray-800 dark:text-white">
                                    {(weeklyDeficit / 7700).toFixed(2)} kg
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsDeficitBreakdownOpen(false)}
                            className="w-full py-4 bg-brand-600 dark:bg-brand-500 text-white font-bold rounded-2xl shadow-lg shadow-brand-100 dark:shadow-brand-900/40 transition-transform active:scale-[0.98]"
                        >
                            Fechar Resumo
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderOverview = () => {
        const displayWorkoutDone = workoutLog.has(selectedDateKey);

        return (
            <div className="space-y-6 animate-in fade-in duration-300 pb-20">
                {/* COMPACT ACTIVITY ROW (GOOGLE FIT) */}
                {googleFitData.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors">
                        {(() => {
                            const todayData = getGoogleFitDataForDate(todayKey);
                            const bmr = calculateBMR();
                            const googleFitTotal = todayData.calories_burned || 0;

                            // If we have Google Fit data, use it as the source of truth for Total.
                            // If it's less than BMR (e.g. start of day), fallback to BMR.
                            const totalExpended = googleFitTotal > 0 ? Math.max(googleFitTotal, bmr) : bmr;

                            // Calculate "Active" portion for display
                            const activeCalories = Math.max(0, totalExpended - bmr);

                            const stepsGoal = 10000;
                            const stepsProgress = Math.min((todayData.steps / stepsGoal) * 100, 100);

                            return (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                                            <Footprints className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Passos</p>
                                            <p className="text-sm font-black text-gray-800 dark:text-gray-200">{todayData.steps.toLocaleString()}<span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 ml-1">/ {stepsGoal.toLocaleString()}</span></p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="bg-orange-100 dark:bg-orange-950/40 p-2 rounded-lg">
                                            <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Atividade</p>
                                            <p className="text-sm font-black text-gray-800 dark:text-gray-200">
                                                {activeCalories}<span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 ml-1">kcal</span>
                                                {googleFitTotal > 0 && googleFitTotal < bmr && (
                                                    <span className="block text-[9px] text-gray-400 dark:text-gray-500 font-medium">Fit Total: {googleFitTotal}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Gasto Total</p>
                                            <p className="text-sm font-black text-gray-800 dark:text-gray-200">{totalExpended}<span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 ml-1">kcal</span></p>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}


                {/* HEADER GAUGES */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
                    {/* Date Navigator in Dashboard */}
                    <div className="flex items-center justify-between mb-6 px-2">
                        <button onClick={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() - 1);
                            setSelectedDate(d);
                        }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <ChevronLeft className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </button>

                        <div className="text-center">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                {selectedDateKey === todayKey ? 'Resumo de Hoje' : `Resumo de ${selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} `}
                            </h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Histórico e Controle</p>
                        </div>

                        <button onClick={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() + 1);
                            setSelectedDate(d);
                        }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </button>
                    </div>

                    <div className="flex justify-around items-center">

                        <div className="relative">
                            <ModernGauge
                                value={displayConsumedCalories}
                                max={customTargets.calories}
                                type="calories"
                                label={selectedDateKey === todayKey ? "Calorias (Hoje)" : "Calorias (Dia)"}
                                suffix="kcal"
                                icon={<Flame className="w-5 h-5 text-orange-500" />}
                            />
                            <button
                                onClick={() => setIsGoalsModalOpen(true)}
                                className="absolute top-2 right-2 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-800/50 text-orange-600 dark:text-orange-400 p-1.5 rounded-lg transition-colors"
                                title="Editar metas de nutrição"
                            >
                                <Settings2 className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="relative group">
                            <div
                                onClick={() => setIsDeficitBreakdownOpen(true)}
                                className="cursor-pointer transition-transform hover:scale-[1.02]"
                            >
                                <ModernGauge
                                    value={Math.max(0, 7700 - Math.max(0, weeklyDeficit))}
                                    max={7700}
                                    type="deficit"
                                    label="Falta para 1kg"
                                    suffix="kcal"
                                    icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
                                />
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="bg-blue-50 dark:bg-blue-900/30 text-[9px] font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800/50 flex items-center gap-1 mt-1">
                                    Meta 1kg
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            alert("Cálculo Estimado:\n7.700 kcal acumuladas equivalem a aproximadamente 1kg de gordura corporal (Regra de Wishnofsky).\n\nEste valor é uma estimativa científica e pode variar dependendo do metabolismo individual, composição corporal e outros fatores biológicos.");
                                        }}
                                        className="hover:text-blue-800 dark:hover:text-blue-300"
                                    >
                                        <Info className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsDeficitModalOpen(true);
                                }}
                                className="absolute top-2 right-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg transition-colors z-10"
                                title="Editar meta de deficit"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        {/* MACROS CARD */}
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm h-full transition-colors">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Droplets className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                                Macronutrientes ({selectedDateKey === todayKey ? 'Hoje' : 'Dia'})
                            </h3>

                            <div className="space-y-4">
                                {/* PROTEIN */}
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                                            <Beef className="w-3.5 h-3.5" /> Proteínas
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{Math.round(displayMacros.consumed.protein)}</span> / {displayMacros.targets.protein}g
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-indigo-50 dark:bg-indigo-950/40 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min((displayMacros.consumed.protein / displayMacros.targets.protein) * 100, 100)}% ` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* CARBS */}
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                                            <Wheat className="w-3.5 h-3.5" /> Carboidratos
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{Math.round(displayMacros.consumed.carbs)}</span> / {displayMacros.targets.carbs}g
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-amber-50 dark:bg-amber-950/40 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min((displayMacros.consumed.carbs / displayMacros.targets.carbs) * 100, 100)}% ` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* FATS */}
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 dark:text-rose-300">
                                            <Droplets className="w-3.5 h-3.5" /> Gorduras
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{Math.round(displayMacros.consumed.fats)}</span> / {displayMacros.targets.fats}g
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-rose-50 dark:bg-rose-950/40 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-rose-500 dark:bg-rose-400 rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min((displayMacros.consumed.fats / displayMacros.targets.fats) * 100, 100)}% ` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* QUICK ACTIONS */}
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                                Ações Rápidas
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => startCamera(null, 'log')}
                                    className="flex flex-col items-center justify-center p-4 bg-orange-50/50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl hover:bg-orange-100/50 dark:hover:bg-orange-900/30 transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-200/20 dark:bg-orange-900/40 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                                    <div className="bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/30 p-3 rounded-xl shadow-[0_8px_16px_-4px_rgba(249,115,22,0.3)] dark:shadow-orange-900/20 border border-orange-100 dark:border-orange-800 mb-3 group-hover:scale-110 transition-transform">
                                        <Camera className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <span className="text-xs font-black text-orange-900 dark:text-orange-300 uppercase tracking-tight">Análise IA</span>
                                    <span className="text-[9px] text-orange-600/70 dark:text-orange-500 font-bold">Foto de Comida</span>
                                </button>

                                <button
                                    onClick={handleGoogleFitImport}
                                    className="flex flex-col items-center justify-center p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200/20 dark:bg-blue-900/40 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                                    <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/30 p-3 rounded-xl shadow-[0_8px_16px_-4px_rgba(59,130,246,0.3)] dark:shadow-blue-900/20 border border-blue-100 dark:border-blue-800 mb-3 group-hover:scale-110 transition-transform">
                                        <RefreshCw className={`w-6 h-6 text-blue-600 dark:text-blue-400 ${(loadingGoogleFitData || importingGoogleFit) ? 'animate-spin' : ''}`} />
                                    </div>
                                    <span className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-tight">Sincronizar</span>
                                    <span className="text-[9px] text-blue-600/70 dark:text-blue-500 font-bold">Smartwatch</span>
                                </button>
                            </div>
                        </div>

                        {/* MEAL CHECK-IN */}
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                                <Utensils className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                                Refeições de {selectedDateKey === todayKey ? 'Hoje' : selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </h3>
                            <div className="space-y-2">
                                {(plan.nutrition?.meals || []).map(meal => {
                                    const key = `${selectedDateKey}_${meal.id}`;
                                    const isDone = consumedMeals.has(key);
                                    return (
                                        <button
                                            key={meal.id}
                                            onClick={() => {
                                                const newConsumed = new Set(consumedMeals);
                                                let isNewlyDone = false;
                                                if (isDone) {
                                                    newConsumed.delete(key);
                                                } else {
                                                    newConsumed.add(key);
                                                    isNewlyDone = true;
                                                }
                                                setConsumedMeals(newConsumed);

                                                // Celebrate if this was the last meal
                                                if (isNewlyDone) {
                                                    const pMeals = plan.nutrition?.meals || [];
                                                    const mIds = pMeals.map(m => m.id);
                                                    const markedCount = Array.from(consumedMeals).filter((k: any) => {
                                                        const sk = String(k);
                                                        return sk.startsWith(selectedDateKey) && mIds.includes(sk.split('_')[1]);
                                                    }).length;

                                                    if (markedCount + 1 >= pMeals.length && pMeals.length > 0) {
                                                        triggerCelebration();
                                                    }
                                                }
                                            }}
                                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isDone ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 opacity-75' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-900'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isDone ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 dark:border-gray-600'}`}>
                                                    {isDone && <Check className="w-3.5 h-3.5" />}
                                                </div>
                                                <span className={`text-sm font-bold ${isDone ? 'text-green-800 dark:text-green-300 line-through' : 'text-gray-700 dark:text-gray-200'}`}>{meal.name}</span>
                                            </div>
                                            {!isDone && <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{meal.time}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* WORKOUT CHECK-IN */}
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                                <Dumbbell className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                                Treino de Hoje
                            </h3>
                            <button
                                onClick={() => {
                                    const newLog = new Set(workoutLog);
                                    if (displayWorkoutDone) newLog.delete(selectedDateKey);
                                    else newLog.add(selectedDateKey);
                                    setWorkoutLog(newLog);
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${displayWorkoutDone ? 'bg-brand-50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-800' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-brand-200 dark:hover:border-brand-900'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${displayWorkoutDone ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-200 dark:border-gray-600 text-transparent'}`}>
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-sm font-bold ${displayWorkoutDone ? 'text-brand-900 dark:text-brand-300' : 'text-gray-800 dark:text-gray-200'}`}>{todayWorkout.focus}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{(todayWorkout.exercises || []).length} exercícios planejados</p>
                                    </div>
                                </div>
                                {!displayWorkoutDone && (
                                    <div className="bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 p-2 rounded-lg">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                )}
                            </button>
                        </div>

                        {/* CONNECT GOOGLE FIT OPTIONAL PROMPT */}
                        {googleFitData.length === 0 && (
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
                                        <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-blue-900 dark:text-blue-200">Conectar Google Fit</p>
                                        <p className="text-[10px] text-blue-700 dark:text-blue-400">Sincronize passos e calorias automaticamente</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleGoogleFitImport}
                                    className="w-full py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all"
                                >
                                    Conectar Agora
                                </button>
                            </div>
                        )}

                        {/* END DAY BUTTON - Manual Deficit Lock */}
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                                <Lock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                Encerrar o Dia
                            </h3>
                            <button
                                onClick={() => {
                                    const newClosed = new Set(closedDays);
                                    if (newClosed.has(selectedDateKey)) {
                                        newClosed.delete(selectedDateKey);
                                    } else {
                                        const confirmText = "Tem certeza que deseja encerrar o dia?\n\nIsso confirmará que você NÃO comerá mais nada hoje, e o déficit será calculado com o que foi registrado até agora.";
                                        if (confirm(confirmText)) {
                                            newClosed.add(selectedDateKey);
                                            triggerCelebration();
                                        } else {
                                            return;
                                        }
                                    }
                                    setClosedDays(newClosed);
                                }}
                                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${closedDays.has(selectedDateKey)
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    : 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-95'
                                    }`}
                            >
                                {closedDays.has(selectedDateKey) ? (
                                    <>
                                        <Unlock className="w-4 h-4" /> Reabrir Dia (Registrar mais)
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" /> Confirmar Encerramento (Dormir)
                                    </>
                                )}
                            </button>
                            <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-2 px-2 leading-tight">
                                Use isso se você fez jejum ou não vai realizar todas as refeições. O déficit será calculado com o que está marcado.
                            </p>
                        </div>
                    </div>
                </div>
            </div >
        );
    };


    const renderWorkout = () => (
        <div className="space-y-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* UNDO BUTTON */}
            {backupPlan && (
                <div className="bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 p-3 rounded-xl flex items-center justify-between shadow-sm transition-colors">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-brand-600 dark:text-brand-400 animate-spin-slow" />
                        <span className="text-xs font-bold text-brand-800 dark:text-brand-300">Você está usando um plano importado</span>
                    </div>
                    <button
                        onClick={undoImport}
                        className="text-[10px] font-black uppercase text-brand-700 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-200 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-brand-100 dark:border-brand-700 shadow-sm transition-all active:scale-95"
                    >
                        Restaurar Sistema
                    </button>
                </div>
            )}
            {/* GLOBAL IMPORT BUTTON */}
            <div className="bg-gradient-to-br from-indigo-600 to-brand-600 dark:from-indigo-700 dark:to-brand-700 p-4 rounded-2xl shadow-lg shadow-brand-100 dark:shadow-brand-900/40 flex items-center justify-between group transition-colors">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Plano do Personal?</h3>
                        <p className="text-indigo-100 text-[10px]">Importe via foto ou texto usando IA</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsSmartImportModalOpen(true)}
                    className="bg-white dark:bg-gray-100 text-indigo-600 dark:text-indigo-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all hover:bg-indigo-50 dark:hover:bg-white"
                >
                    Importar AI
                </button>
            </div>

            {/* List of workout days */}
            {(plan.workout?.weeklySchedule || []).map((session, index) => {
                const isExpanded = expandedDay === session.dayName;
                const isToday = plan.workout?.weeklySchedule && session.dayName === plan.workout.weeklySchedule[todayIndex]?.dayName;

                // Use customized list if available, otherwise default
                const displayExercises = customWorkouts[session.dayName] || session.exercises || [];
                const isCustomized = !!customWorkouts[session.dayName];

                return (
                    <div key={session.dayName} className={`bg-white dark:bg-gray-900 rounded-xl border transition-all duration-300 ${isExpanded ? 'border-brand-500 shadow-md' : 'border-gray-200 dark:border-gray-800'} `}>
                        <button
                            onClick={() => setExpandedDay(isExpanded ? null : session.dayName)}
                            className="w-full flex items-center justify-between p-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isToday ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'} `}>
                                    <CalendarDays className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900 dark:text-white">{session.dayName}</h3>
                                        {isCustomized && <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] px-1.5 rounded-full font-bold flex items-center gap-0.5"><PenSquare className="w-2.5 h-2.5" /> Editado</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{session.focus}</p>
                                </div>
                            </div>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
                        </button>

                        {isExpanded && (
                            <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                                {displayExercises.length === 0 ? (
                                    <p className="text-center text-gray-400 dark:text-gray-500 py-4 italic">Dia de Descanso Merecido! 😴</p>
                                ) : (
                                    <div className="space-y-3">
                                        {displayExercises.map((ex, i) => {
                                            const key = `${session.dayName}-${ex.name}`;
                                            const isDone = completedExercises.has(key);
                                            return (
                                                <div key={i} className="flex gap-3 items-start group py-2 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                                                    <button
                                                        onClick={() => toggleExercise(session.dayName, ex.name)}
                                                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isDone ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
                                                            }`}
                                                    >
                                                        {isDone && <Check className="w-3.5 h-3.5 text-white" />}
                                                    </button>
                                                    <div className={`flex-1 ${isDone ? 'opacity-50' : ''}`}>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <p className={`font-bold text-sm leading-tight ${isDone ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                                                    {ex.name}
                                                                </p>
                                                                <button
                                                                    onClick={(e) => handleRemoveExercise(session.dayName, i, e)}
                                                                    className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-0.5"
                                                                    title="Remover exercício"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                                <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                                                                    <span className="font-bold text-gray-800 dark:text-white">{ex.sets}</span> séries
                                                                </span>
                                                                <span className="text-gray-300 dark:text-gray-600 pl-1">x</span>
                                                                <span className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                                                                    <span className="font-bold text-gray-800 dark:text-white">{ex.reps}</span> reps
                                                                </span>
                                                                {ex.rest && (
                                                                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                                                                        ⏳ {ex.rest}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {ex.notes && (
                                                                <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/10 p-1.5 rounded-lg border border-amber-100 dark:border-amber-900/30 mt-1 flex items-start gap-1.5 leading-snug">
                                                                    <span className="mt-0.5">💡</span> {ex.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Add Exercise Button */}
                                <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
                                    <button
                                        onClick={() => handleOpenExerciseModal(session.dayName)}
                                        className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Adicionar Exercício / Aparelho
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderDiet = () => {
        const isSaved = savedDays[selectedDateKey]?.isSaved;

        return (
            <div className="space-y-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">

                {/* UNDO BUTTON */}
                {backupPlan && (
                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-3 rounded-xl flex items-center justify-between shadow-sm transition-colors">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-orange-600 dark:text-orange-400 animate-spin-slow" />
                            <span className="text-xs font-bold text-orange-800 dark:text-orange-300">Você está usando uma dieta importada</span>
                        </div>
                        <button
                            onClick={undoImport}
                            className="text-[10px] font-black uppercase text-orange-700 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-200 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-orange-100 dark:border-orange-700 shadow-sm transition-all active:scale-95"
                        >
                            Restaurar Sistema
                        </button>
                    </div>
                )}

                {/* GLOBAL IMPORT BUTTON */}
                <div className="bg-gradient-to-br from-orange-500 to-rose-500 dark:from-orange-600 dark:to-rose-600 p-4 rounded-2xl shadow-lg shadow-orange-100 dark:shadow-orange-900/40 flex items-center justify-between group transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <Utensils className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">Plano da Nutri?</h3>
                            <p className="text-orange-100 text-[10px]">Tire uma foto e a IA monta sua dieta</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsSmartImportModalOpen(true)}
                        className="bg-white dark:bg-gray-100 text-orange-600 dark:text-orange-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all hover:bg-orange-50 dark:hover:bg-white"
                    >
                        Importar AI
                    </button>
                </div>

                {/* Date Navigator */}
                <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-sm sticky top-0 z-10 transition-colors">
                    <button onClick={() => {
                        const d = new Date(selectedDate);
                        d.setDate(d.getDate() - 1);
                        handleDateSelect(d);
                    }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    <div className="text-center">
                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Planejamento</p>
                        <div className="flex items-center gap-2 justify-center">
                            <CalendarRange className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                            <span className="font-bold text-gray-800 dark:text-gray-100">
                                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })}
                            </span>
                        </div>
                    </div>

                    <button onClick={() => {
                        const d = new Date(selectedDate);
                        d.setDate(d.getDate() + 1);
                        handleDateSelect(d);
                    }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Diet Actions Toolbar */}
                <div className="flex justify-end gap-2 px-1">
                    <button
                        onClick={() => setIsFoodPreferencesModalOpen(true)}
                        className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-colors shadow-sm"
                    >
                        <Carrot className="w-3.5 h-3.5" /> Personalizar Paladar
                    </button>
                    <button
                        onClick={() => setIsGoalsModalOpen(true)}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    >
                        <Settings2 className="w-3.5 h-3.5" /> Editar Metas
                    </button>
                </div>

                {/* Daily Summary */}
                <div className="bg-brand-50 dark:bg-brand-950/20 rounded-xl p-4 border border-brand-100 dark:border-brand-900/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-brand-900 dark:text-brand-300">Meta Diária</h3>
                        <span className="text-xs font-bold bg-white dark:bg-gray-800 text-brand-700 dark:text-brand-400 px-2 py-1 rounded shadow-sm">
                            {selectedDayPlannedCalories} / {plan.nutrition?.targetCalories || 2000} kcal
                        </span>
                    </div>
                    {/* Save Day Button */}
                    {isSaved ? (
                        <button
                            onClick={handleUnsaveDay}
                            className="w-full py-2 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Dia Salvo na Lista
                        </button>
                    ) : (
                        <button
                            onClick={handleOpenPlanDayModal}
                            className="w-full py-2 bg-brand-600 dark:bg-brand-500 text-white shadow-md shadow-brand-200 dark:shadow-brand-900/40 rounded-lg font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <ShoppingBasket className="w-4 h-4" />
                            Adicionar à Lista de Compras
                        </button>
                    )}
                </div>

                {/* Meals List */}
                <div className="space-y-4">
                    {(!plan.nutrition?.meals || plan.nutrition.meals.length === 0) && (
                        <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
                            <Utensils className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium italic">Nenhuma refeição encontrada neste plano.</p>
                            {backupPlan && (
                                <div className="flex flex-col items-center gap-4 mt-4">
                                    <button
                                        onClick={undoImport}
                                        className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold text-sm shadow-md"
                                    >
                                        Clique para Restaurar Plano Anterior
                                    </button>
                                    <div className="flex gap-2">
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {(plan.nutrition?.meals || []).map(meal => {
                        const selectionKey = `${selectedDateKey}_${meal.id}`;

                        // --- AUTO ROTATION LOGIC ---
                        let selectedOptionIndex = mealSelections[selectionKey];
                        const options = getMealOptions(meal);

                        if (selectedOptionIndex === undefined) {
                            selectedOptionIndex = getOptionIndexForDate(options, selectedDateKey);
                        }

                        const selectedOption = options[selectedOptionIndex];

                        // Check if customized items exist for this day/meal
                        const customItems = dietHistory[selectedDateKey]?.[meal.id];
                        // Fix: treat empty array as "not customized" to match calorie logic
                        const hasCustomItems = customItems && customItems.length > 0;
                        const displayItems = hasCustomItems ? customItems : (selectedOption?.ingredients || []);

                        const isExpanded = expandedMeal === meal.id;

                        return (
                            <div key={meal.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden transition-colors">
                                <div
                                    className="p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 cursor-pointer"
                                    onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const key = `${selectedDateKey}_${meal.id}`;
                                                const isDone = consumedMeals.has(key);
                                                const newConsumed = new Set(consumedMeals);
                                                if (isDone) newConsumed.delete(key);
                                                else newConsumed.add(key);
                                                setConsumedMeals(newConsumed);
                                            }}
                                            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${consumedMeals.has(`${selectedDateKey}_${meal.id}`) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 dark:border-gray-700 text-transparent hover:border-brand-300 dark:hover:border-brand-600'}`}
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <div>
                                            <h4 className={`font-bold transition-all ${consumedMeals.has(`${selectedDateKey}_${meal.id}`) ? 'text-green-700 dark:text-green-400 line-through opacity-70' : 'text-gray-900 dark:text-white'}`}>{meal.name}</h4>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{meal.time} • {getComputedMealCalories(meal, selectedDateKey)} kcal</span>
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                                </div>

                                {isExpanded && (
                                    <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                                        {/* Option Selector */}
                                        <div className="mb-4">
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Opção do Cardápio</label>

                                            <select
                                                value={selectedOptionIndex}
                                                onChange={(e) => handleSelectOption(meal.id, Number(e.target.value))}
                                                className="w-full p-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                                            >
                                                {options.map((opt, idx) => (
                                                    <option key={opt.id} value={idx}>{opt.name}</option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{selectedOption?.description || ""}</p>
                                        </div>

                                        {/* Ingredients List */}
                                        <div className="space-y-2 mb-4">
                                            {displayItems.map((item, idx) => {
                                                const isExcluded = (excludedIngredients[`${selectedDateKey}_${meal.id}`] || []).includes(idx) && !customItems;

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`flex justify-between items-center text-sm p-2 rounded border border-gray-100 dark:border-gray-800 transition-all cursor-pointer ${isExcluded ? 'bg-gray-100 dark:bg-gray-800 opacity-60' : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                            } `}
                                                        onClick={() => !hasCustomItems && handleToggleIngredient(meal.id, idx)}
                                                        title={hasCustomItems ? "" : "Clique para riscar/incluir este item"}
                                                    >
                                                        <span className={`text-gray-700 dark:text-gray-200 ${isExcluded ? 'line-through text-gray-400 dark:text-gray-500' : ''} `}>
                                                            <span className="font-bold">{(item as FoodItem).portion || (item as any).amount}</span> {(item as FoodItem).name || (item as any).name}
                                                        </span>
                                                        {hasCustomItems && (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenEditFood(meal.id, idx, item as FoodItem); }}
                                                                    className="text-brand-400 hover:text-brand-600 p-1"
                                                                    title="Editar alimento"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleRemoveFood(meal.id, idx); }}
                                                                    className="text-red-400 hover:text-red-600 p-1"
                                                                    title="Remover alimento"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenFoodModal(meal.id)}
                                                className="flex-1 py-2 px-3 bg-white dark:bg-gray-800 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-400 text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-brand-50 dark:hover:bg-brand-900/40 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" /> Adicionar Alimento
                                            </button>

                                            {customItems && customItems.length > 0 && (
                                                <button
                                                    onClick={(e) => handleSaveCustomOptionClick(meal.id, e)}
                                                    className="flex-1 py-2 px-3 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors"
                                                >
                                                    <Save className="w-3 h-3" /> Salvar Opção
                                                </button>
                                            )}
                                        </div>

                                        {/* Delete Custom Option Button (if selected is custom) */}
                                        {selectedOption && String(selectedOption.id).startsWith('custom-') && (
                                            <button
                                                onClick={(e) => handleDeleteOption(meal.id, selectedOption.id, e)}
                                                className="mt-2 w-full text-xs text-red-500 underline flex items-center justify-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" /> Excluir esta opção personalizada
                                            </button>
                                        )}

                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <button
                        onClick={handleAddMeal}
                        className="w-full py-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all flex flex-col items-center justify-center gap-2 font-bold group"
                    >
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-full group-hover:bg-brand-100 dark:group-hover:bg-brand-900/40 transition-colors">
                            <PlusCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-sm">Adicionar Nova Refeição</span>
                    </button>
                </div>
            </div>
        )
    };

    const renderShopping = () => {
        const activeItems = calculatedShoppingList.filter(i => !checkedItems.has(`${i.name}__${i.unit}`));
        const completedItemsList = calculatedShoppingList.filter(i => checkedItems.has(`${i.name}__${i.unit}`));

        // REMOVIDO: O bloco "if (calculatedShoppingList.length === 0)" que retornava cedo demais.
        // Agora renderizamos o Header Card primeiro e depois verificamos se a lista está vazia.

        return (
            <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">

                {/* Header Card - SEMPRE VISÍVEL */}
                <div className="bg-brand-600 dark:bg-brand-700 text-white rounded-2xl p-6 shadow-lg shadow-brand-200 dark:shadow-brand-900/40">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold">Lista de Compras</h2>
                            <p className="text-brand-100 text-sm">Baseado nos dias planejados.</p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => startCamera(null, 'fruit')}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-md transition-all border border-white/30 group/ai active:scale-95 shadow-inner"
                                title="IA Escolhedor de Frutas"
                            >
                                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-wider text-white">Escolhedor IA</span>
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-2.5 bg-white/20 rounded-xl hover:bg-white/30 backdrop-blur-md transition-all border border-white/30 active:scale-95"
                            >
                                <Share2 className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Saved Days Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {Object.entries(savedDays).map(([date, info]) => {
                            const savedInfo = info as SavedDayInfo;
                            if (!savedInfo.isSaved) return null;
                            const d = new Date(date);
                            return (
                                <div key={date} className="flex-shrink-0 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 text-xs">
                                    <span className="font-bold block">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                                    <span>{d.getDate()}/{d.getMonth() + 1} ({savedInfo.householdSize}p)</span>
                                </div>
                            )
                        })}
                        {Object.keys(savedDays).length === 0 && (
                            <span className="text-xs text-brand-200 italic">Nenhum dia planejado ainda.</span>
                        )}
                    </div>
                </div>

                {/* Content: Empty State OU Lista */}
                {calculatedShoppingList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl transition-colors">
                        <ShoppingBasket className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-center px-8 text-sm">Sua lista está vazia.</p>
                        <p className="text-center px-8 text-xs mt-2">Vá na aba <strong>Dieta</strong> e adicione dias ao seu planejamento para gerar a lista.</p>
                    </div>
                ) : (
                    <>
                        {/* List */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm transition-colors">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 font-bold text-gray-700 dark:text-gray-200 flex justify-between">
                                <span>Itens Pendentes ({activeItems.length})</span>
                                <button onClick={handlePrint} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                                    <Printer className="w-4 h-4" />
                                </button>
                            </div>

                            {activeItems.map((item, idx) => {
                                const key = `${item.name}__${item.unit}`;
                                return (
                                    <div key={key} className={`flex items-center p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>
                                        <button
                                            onClick={() => handleToggleShoppingItem(key)}
                                            className="w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-700 mr-4 flex items-center justify-center text-white hover:border-brand-400 dark:hover:border-brand-600"
                                        >
                                        </button>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800 dark:text-gray-100">{item.name}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">{item.category}</p>
                                        </div>
                                        <div className="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                                            {formatShoppingQuantity(item.quantity, item.unit)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Completed Items Accordion */}
                        {completedItemsList.length > 0 && (
                            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden transition-colors">
                                <button
                                    onClick={() => setShowCompletedItems(!showCompletedItems)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-sm font-medium"
                                >
                                    <span>Itens Comprados ({completedItemsList.length})</span>
                                    {showCompletedItems ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                                </button>

                                {showCompletedItems && (
                                    <div className="bg-gray-50/50 dark:bg-gray-800/30">
                                        {completedItemsList.map((item) => {
                                            const key = `${item.name}__${item.unit}`;
                                            return (
                                                <div key={key} className="flex items-center p-4 border-t border-gray-100 dark:border-gray-800 opacity-60">
                                                    <button
                                                        onClick={() => handleToggleShoppingItem(key)}
                                                        className="w-6 h-6 rounded border-2 border-green-500 bg-green-500 mr-4 flex items-center justify-center text-white"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <div className="flex-1 line-through text-gray-500 dark:text-gray-400">
                                                        {item.name}
                                                    </div>
                                                    <div className="text-gray-400 dark:text-gray-500 text-sm">
                                                        {formatShoppingQuantity(item.quantity, item.unit)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const renderCalendar = () => {
        // Basic calendar logic for current month
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

        const blanks = Array(firstDayOfWeek).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const monthName = calendarMonth.toLocaleString('pt-BR', { month: 'long' });

        if (calendarMode === 'menu') {
            return (
                <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm text-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Central de Calendários</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Escolha o que você deseja visualizar:</p>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => setCalendarMode('workout')}
                                className="bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/40 border border-brand-200 dark:border-brand-800 p-4 rounded-xl flex items-center gap-4 transition-colors group text-left"
                            >
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-full border border-brand-100 dark:border-brand-900 shadow-sm group-hover:scale-110 transition-transform">
                                    <Dumbbell className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-900 dark:text-brand-300">Histórico de Treinos</h3>
                                    <p className="text-xs text-brand-700 dark:text-brand-500">Veja sua constância e dias treinados.</p>
                                </div>
                                <ChevronRight className="ml-auto text-brand-400 dark:text-brand-600 w-5 h-5" />
                            </button>

                            <button
                                onClick={() => setCalendarMode('diet')}
                                className="bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/40 border border-orange-200 dark:border-orange-800 p-4 rounded-xl flex items-center gap-4 transition-colors group text-left"
                            >
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-full border border-orange-100 dark:border-orange-900 shadow-sm group-hover:scale-110 transition-transform">
                                    <Apple className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-orange-900 dark:text-orange-300">Planejamento de Dieta</h3>
                                    <p className="text-xs text-orange-700 dark:text-orange-500">Dias planejados e salvos.</p>
                                </div>
                                <ChevronRight className="ml-auto text-orange-400 dark:text-orange-600 w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        const isDiet = calendarMode === 'diet';

        // Logic to get workout details for the SELECTED date (below legend)
        const selectedDayOfWeek = selectedDate.getDay();
        const selectedWorkoutSession = plan.workout?.weeklySchedule?.[selectedDayOfWeek];
        const selectedWorkoutExercises = selectedWorkoutSession ? (customWorkouts[selectedWorkoutSession.dayName] || selectedWorkoutSession.exercises || []) : [];
        const isSelectedDayDone = workoutLog.has(getDateKey(selectedDate));

        return (
            <div className="space-y-6 pb-20 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCalendarMode('menu')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 flex items-center gap-1 text-sm font-bold transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${isDiet ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400' : 'bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400'} `}>
                        {isDiet ? 'Calendário de Dieta' : 'Calendário de Treinos'}
                    </span>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    {/* Header Month Nav */}
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => {
                            const d = new Date(calendarMonth);
                            d.setMonth(d.getMonth() - 1);
                            setCalendarMonth(d);
                        }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><ChevronLeft className="w-6 h-6 text-gray-400 dark:text-gray-500" /></button>

                        <h3 className="font-bold text-gray-900 dark:text-white text-lg capitalize">{monthName} {year}</h3>

                        <button onClick={() => {
                            const d = new Date(calendarMonth);
                            d.setMonth(d.getMonth() + 1);
                            setCalendarMonth(d);
                        }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><ChevronRight className="w-6 h-6 text-gray-400 dark:text-gray-500" /></button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                            <div key={i} className="text-xs font-bold text-gray-400 dark:text-gray-500">{d}</div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {blanks.map((_, i) => (
                            <div key={`blank - ${i} `} className="h-10"></div>
                        ))}

                        {days.map(day => {
                            const dateObj = new Date(year, month, day);
                            const dKey = getDateKey(dateObj);
                            const isToday = dKey === todayKey;
                            const isSelected = dKey === getDateKey(selectedDate);

                            let statusIndicator = null;

                            if (isDiet) {
                                const isSaved = savedDays[dKey]?.isSaved;
                                if (isSaved) {
                                    statusIndicator = <div className="absolute bottom-1 right-1/2 translate-x-1/2 w-1.5 h-1.5 bg-green-500 rounded-full"></div>;
                                }
                            } else {
                                // Workout
                                const isDone = workoutLog.has(dKey);
                                const dayIndex = dateObj.getDay();
                                const session = plan.workout?.weeklySchedule?.[dayIndex];

                                if (isDone) {
                                    statusIndicator = (
                                        <div className="absolute bottom-0.5 left-0.5 right-0.5 bg-green-100 border border-green-200 rounded text-[7px] sm:text-[9px] text-green-800 font-bold px-0.5 truncate leading-tight">
                                            {session?.focus || 'Treino'}
                                        </div>
                                    );
                                }
                            }

                            return (
                                <button
                                    key={day}
                                    onClick={() => {
                                        setSelectedDate(dateObj);
                                        if (isDiet) {
                                            setActiveTab('diet');
                                        }
                                    }}
                                    className={`h - 12 rounded - lg flex flex - col items - center justify - center relative transition - all border 
                    ${isToday ? 'ring-1 ring-brand-100 dark:ring-brand-900 font-bold' : ''}
                    ${isSelected ? (isDiet ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40' : 'border-brand-500 bg-brand-50 dark:bg-brand-950/40') : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}
                    ${!isDiet && workoutLog.has(dKey) && !isSelected ? 'bg-green-50/50 dark:bg-green-950/20' : ''}
                    text - gray - 700 dark:text-gray-300
    `}
                                >
                                    <span className={`z - 10 ${statusIndicator ? 'mb-2' : ''} `}>{day}</span>
                                    {statusIndicator}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className={`p-4 rounded-xl border ${isDiet ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/50' : 'bg-brand-50 dark:bg-brand-950/20 border-brand-100 dark:border-brand-900/50'} `}>
                    <h4 className={`font-bold text-sm mb-2 flex items-center gap-2 ${isDiet ? 'text-orange-800 dark:text-orange-300' : 'text-brand-800 dark:text-brand-300'} `}>
                        <CalendarRange className="w-4 h-4" />
                        Legenda
                    </h4>
                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                        {isDiet ? (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Dia Planejado e Salvo</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-100 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded flex items-center justify-center text-[8px] font-bold text-green-800 dark:text-green-400">T</div>
                                <span>Treino Realizado (com foco)</span>
                            </div>
                        )}
                        {isDiet ? (
                            <p className="mt-2 text-orange-700 dark:text-orange-400 italic">Clique em um dia para ver ou editar a dieta.</p>
                        ) : (
                            <p className="mt-2 text-brand-700 dark:text-brand-400 italic">Clique em um dia acima para ver os detalhes do treino.</p>
                        )}
                    </div>
                </div>

                {/* WORKOUT SUMMARY FOR SELECTED DATE (ONLY IN WORKOUT MODE) */}
                {!isDiet && selectedWorkoutExercises && (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 mt-4 transition-colors">
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                </p>
                                {isSelectedDayDone ? (
                                    <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Realizado
                                    </span>
                                ) : (
                                    selectedWorkoutExercises.length > 0 && <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full text-xs font-bold">Pendente</span>
                                )}
                            </div>

                            <div>
                                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest block mb-0.5">Foco do Treino</span>
                                <h3 className="font-black text-gray-900 dark:text-white text-2xl flex items-center gap-2 leading-none">
                                    {selectedWorkoutSession.focus}
                                </h3>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {selectedWorkoutExercises.length === 0 ? (
                                <div className="p-6 text-center text-gray-400 text-sm">
                                    Dia de Descanso
                                </div>
                            ) : (
                                selectedWorkoutExercises.map((ex, i) => (
                                    <div key={i} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-brand-50 w-8 h-8 rounded flex items-center justify-center text-brand-600 font-bold text-xs">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-800">{ex.name}</p>
                                                <p className="text-xs text-gray-500">{ex.sets} séries x {ex.reps}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {selectedWorkoutExercises.length > 0 && !isSelectedDayDone && (
                            <div className="p-3 bg-gray-50 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        toggleWorkoutCompletion(getDateKey(selectedDate));
                                    }}
                                    className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
                                >
                                    Marcar como Concluído
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };



    const renderSmartImportModal = () => {
        if (!isSmartImportModalOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
                <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-transparent dark:border-gray-800">
                    <div className="p-6 bg-brand-600 dark:bg-brand-500 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 animate-pulse text-amber-300" />
                            <div>
                                <h3 className="font-bold text-xl text-white">Importação Inteligente</h3>
                                <p className="text-brand-100 dark:text-brand-200 text-xs">A IA montará seu plano automaticamente</p>
                            </div>
                        </div>
                        <button onClick={() => setIsSmartImportModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">
                        {importStatus === 'idle' && (
                            <div className="space-y-6">
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-xl flex gap-3">
                                    <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-lg h-fit">
                                        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-bold">
                                        Tire uma foto, envie um **PDF** ou cole o texto que você recebeu. A IA montará seu plano automaticamente!
                                    </p>
                                </div>

                                {/* Info Card: Distribuição Semanal (Mandatória) */}
                                <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 p-4 rounded-2xl flex items-start gap-4">
                                    <div className="bg-brand-100 dark:bg-brand-900/40 p-2 rounded-xl">
                                        <CalendarRange className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 dark:text-white text-sm">Distribuição Semanal</h4>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                                            O app mapeará seu cardápio e treinos para cada dia da semana automaticamente seguindo seu documento.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/*,application/pdf';
                                            input.onchange = (e: any) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (re) => {
                                                        const base64 = re.target?.result as string;
                                                        handleSmartImport(base64, 'image');
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            };
                                            input.click();
                                        }}
                                        className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-all text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 group bg-gray-50 dark:bg-gray-800"
                                    >
                                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 transition-colors">
                                            <Camera className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-sm">Foto / PDF</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            const text = prompt("Cole aqui o texto do seu plano (dieta ou treino):");
                                            if (text) handleSmartImport(text, 'text');
                                        }}
                                        className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-all text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 group bg-gray-50 dark:bg-gray-800"
                                    >
                                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 transition-colors">
                                            <PenSquare className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-sm">Colar Texto</span>
                                    </button>
                                </div>

                                {importError && <p className="text-red-500 text-xs text-center font-bold bg-red-50 p-2 rounded-lg">{importError}</p>}
                            </div>
                        )}

                        {importStatus === 'loading' && (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <div className="relative">
                                    <Loader2 className="w-12 h-12 text-brand-600 dark:text-brand-400 animate-spin" />
                                    <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400 animate-bounce" />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-gray-800 dark:text-white text-lg">Processando Plano...</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Lendo seu arquivo com inteligência artificial</p>
                                </div>
                            </div>
                        )}

                        {importStatus === 'review' && importedPlan && (
                            <div className="space-y-6">
                                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 rounded-xl flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-green-800 dark:text-green-300 font-bold">Resumo da Importação</p>
                                        <p className="text-xs text-green-600 dark:text-green-400">Confira abaixo o que conseguimos extrair:</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-2">Nutrição</h4>
                                        <p className="text-sm font-bold text-gray-800 dark:text-white">{(importedPlan.nutrition?.meals || []).length} Refeições</p>
                                        <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">{importedPlan.nutrition?.targetCalories || 0} kcal diárias</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase mb-2">Treino</h4>
                                        <p className="text-sm font-bold text-gray-800 dark:text-white">{(importedPlan.workout?.weeklySchedule || []).filter(d => d.exercises && d.exercises.length > 0).length} Dias Ativos</p>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{importedPlan.workout?.methodology ? importedPlan.workout.methodology.substring(0, 30) : ''}...</p>
                                    </div>
                                </div>

                                <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-xl border border-brand-100 dark:border-brand-800 mb-4">
                                    <h4 className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase mb-3">Escolha o que importar:</h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={importDietSelected}
                                                    onChange={e => setImportDietSelected(e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-10 h-6 rounded-full transition-colors ${importDietSelected ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-700'} `}></div>
                                                <div className={`absolute top-1 left-1 bg-white dark:bg-gray-200 w-4 h-4 rounded-full transition-transform ${importDietSelected ? 'translate-x-4' : ''} `}></div>
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-gray-800 dark:text-white">Importar Dieta</span>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Substitui sua dieta atual</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={importWorkoutSelected}
                                                    onChange={e => setImportWorkoutSelected(e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-10 h-6 rounded-full transition-colors ${importWorkoutSelected ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'} `}></div>
                                                <div className={`absolute top-1 left-1 bg-white dark:bg-gray-200 w-4 h-4 rounded-full transition-transform ${importWorkoutSelected ? 'translate-x-4' : ''} `}></div>
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-gray-800 dark:text-white">Importar Treino</span>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Substitui seu treino atual</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Botão Limpar Dias */}
                                <button
                                    onClick={cleanDayNamesFromImportedPlan}
                                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-200 dark:hover:border-brand-800 transition-all text-xs font-bold"
                                >
                                    <Eraser className="w-4 h-4" /> Limpar Nomes de Dias das Opções
                                </button>

                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setImportStatus('idle')} className="flex-1 py-4 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all">
                                        Tentar Novamente
                                    </button>
                                    <button onClick={confirmSmartImport} className="flex-1 py-4 bg-brand-600 dark:bg-brand-500 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 dark:shadow-brand-900/40 active:scale-95 transition-all text-sm">
                                        Confirmar e Salvar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
            {/* TOP BAR */}
            <div className="bg-white dark:bg-gray-900 sticky top-0 z-20 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-brand-600 dark:bg-brand-500 text-white p-1.5 rounded-lg">
                        <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-none tracking-tight text-gray-900 dark:text-white">FitCoach<span className="text-brand-600 dark:text-brand-400">Pro</span></h1>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase">Personal AI Trainer</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleDarkMode}
                        className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-300 border border-transparent dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
                    >
                        {isDarkMode ? <Flame className="w-5 h-5 text-orange-400 fill-orange-400/20" /> : <Droplets className="w-5 h-5 text-blue-500 fill-blue-500/20" />}
                    </button>
                    {(plan.nutrition?.meals?.length || 0) < 3 && !backupPlan && (
                        <button
                            onClick={handleRepairPlan}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 rounded-lg text-[10px] font-black uppercase border border-orange-200 dark:border-orange-800/50 animate-pulse hover:bg-orange-200 transition-all"
                        >
                            <RefreshCw className="w-3 h-3" /> Consertar Plano
                        </button>
                    )}
                    <button onClick={handleResetClick} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 p-4 pb-24 overflow-y-auto">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'workout' && renderWorkout()}
                {activeTab === 'diet' && renderDiet()}
                {activeTab === 'shopping' && renderShopping()}
                {activeTab === 'calendar' && renderCalendar()}
                {activeTab === 'progress' && renderProgress()}
            </div>

            {/* BOTTOM NAV */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="w-full max-w-md mx-auto px-6 pb-6 pt-3 flex justify-between items-center">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Resumo' },
                        { id: 'workout', icon: Dumbbell, label: 'Treino' },
                        { id: 'diet', icon: Apple, label: 'Dieta' },
                        { id: 'progress', icon: TrendingUp, label: 'Evolução' },
                        { id: 'calendar', icon: CalendarRange, label: 'Agenda' },
                        { id: 'shopping', icon: ShoppingBasket, label: 'Lista' },
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-brand-600 dark:text-brand-400 -translate-y-1' : 'text-gray-400 dark:text-gray-600'}`}
                            >
                                <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-brand-50 dark:bg-brand-900/40' : 'bg-transparent'}`}>
                                    <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                                </div>
                                <span className={`text-[9px] font-bold ${isActive ? 'opacity-100' : 'opacity-0 h-0 w-0 overflow-hidden'}`}>{tab.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* MODALS */}

            {/* ADD FOOD MODAL */}
            {isFoodModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300 border border-transparent dark:border-gray-800">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Adicionar Alimento</h3>
                            <div className="flex items-center gap-2">
                                {currentMealIdForAdd && (
                                    <button
                                        onClick={() => startCamera(currentMealIdForAdd, 'log')}
                                        className="p-2 bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-full hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors"
                                        title="Analisar foto do alimento"
                                    >
                                        <Camera className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={() => setFoodModalOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full"><X className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Meal Selector inside Modal if none selected or for change */}
                        <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase whitespace-nowrap">Destino:</span>
                            {(plan.nutrition?.meals || []).map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setCurrentMealIdForAdd(m.id)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${currentMealIdForAdd === m.id
                                        ? 'bg-brand-600 dark:bg-brand-500 text-white shadow-sm'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mx-4 mb-2">
                            <button
                                onClick={() => setFoodModalMode('library')}
                                className={`flex-1 py-1.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${foodModalMode === 'library' ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                <Search className="w-3.5 h-3.5" /> Buscar
                            </button>
                            <button
                                onClick={() => setFoodModalMode('manual')}
                                className={`flex-1 py-1.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${foodModalMode === 'manual' ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                <Edit3 className="w-3.5 h-3.5" /> Manual
                            </button>
                        </div>

                        {foodModalMode === 'library' ? (
                            <>
                                <div className="p-4 pt-0">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Buscar alimento (ex: Arroz, Frango)..."
                                            value={foodSearchTerm}
                                            onChange={(e) => setFoodSearchTerm(e.target.value)}
                                            className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-brand-500 dark:focus:border-brand-400 outline-none text-gray-900 dark:text-white"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
                                    {filteredFoods.map(food => (
                                        <button
                                            key={food.id}
                                            onClick={() => handleAddFood(food)}
                                            className="w-full flex justify-between items-center p-3 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                                        >
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white">{food.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{food.portion} • {food.calories} kcal</p>
                                            </div>
                                            <div className="bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 p-2 rounded-lg">
                                                <Plus className="w-4 h-4" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Alimento</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Pão de Queijo Caseiro"
                                        value={newManualFood.name}
                                        onChange={(e) => setNewManualFood({ ...newManualFood, name: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-brand-500 dark:focus:ring-brand-400 outline-none font-bold text-gray-900 dark:text-white"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Calorias (kcal)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={newManualFood.calories}
                                            onChange={(e) => setNewManualFood({ ...newManualFood, calories: e.target.value })}
                                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-brand-500 dark:focus:ring-brand-400 outline-none text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Porção</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="1"
                                                value={newManualFood.portionValue}
                                                onChange={(e) => setNewManualFood({ ...newManualFood, portionValue: e.target.value })}
                                                className="w-24 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-brand-500 dark:focus:ring-brand-400 outline-none font-bold text-gray-900 dark:text-white"
                                            />
                                            <div className="flex-1 relative">
                                                <select
                                                    value={newManualFood.portionUnit}
                                                    onChange={(e) => setNewManualFood({ ...newManualFood, portionUnit: e.target.value })}
                                                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-brand-500 dark:focus:ring-brand-400 outline-none appearance-none font-bold text-gray-700 dark:text-gray-200"
                                                >
                                                    <option value="g">gramas (g)</option>
                                                    <option value="unidade">unidade</option>
                                                    <option value="ml">ml</option>
                                                    <option value="fatia">fatia</option>
                                                    <option value="colher">colher</option>
                                                    <option value="xícara">xícara</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Macros Opcionais</p>
                                    <div className="flex gap-2">
                                        <div className="flex-1 text-center">
                                            <label className="block text-[10px] font-bold text-indigo-700 mb-1">Prot (g)</label>
                                            <input
                                                type="number"
                                                className="w-full p-2 text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white font-bold"
                                                value={newManualFood.protein}
                                                onChange={(e) => setNewManualFood({ ...newManualFood, protein: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex-1 text-center">
                                            <label className="block text-[10px] font-bold text-amber-700 mb-1">Carb (g)</label>
                                            <input
                                                type="number"
                                                className="w-full p-2 text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white font-bold"
                                                value={newManualFood.carbs}
                                                onChange={(e) => setNewManualFood({ ...newManualFood, carbs: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex-1 text-center">
                                            <label className="block text-[10px] font-bold text-rose-700 mb-1">Gord (g)</label>
                                            <input
                                                type="number"
                                                className="w-full p-2 text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white font-bold"
                                                value={newManualFood.fats}
                                                onChange={(e) => setNewManualFood({ ...newManualFood, fats: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddManualFood}
                                    disabled={!newManualFood.name || !newManualFood.calories}
                                    className="w-full py-3 bg-brand-600 dark:bg-brand-500 font-bold rounded-xl text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/40 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 dark:hover:bg-brand-600 transition-colors"
                                >
                                    Adicionar Alimento
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* EDIT FOOD MODAL */}
            {isEditFoodModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 border border-transparent dark:border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Editar Alimento</h3>
                            <button onClick={() => setIsEditFoodModalOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome do Alimento</label>
                                <input
                                    type="text"
                                    value={editFoodForm.name}
                                    onChange={(e) => setEditFoodForm({ ...editFoodForm, name: e.target.value })}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-brand-500 outline-none font-bold text-gray-700 dark:text-gray-200"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Calorias (kcal)</label>
                                    <input
                                        type="number"
                                        value={editFoodForm.calories}
                                        onChange={(e) => setEditFoodForm({ ...editFoodForm, calories: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-brand-500 outline-none text-gray-900 dark:text-white font-bold"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Porção / Medida</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={editFoodForm.portionValue}
                                            onChange={(e) => setEditFoodForm({ ...editFoodForm, portionValue: e.target.value })}
                                            className="w-24 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-brand-500 outline-none text-gray-700 dark:text-gray-200 font-bold"
                                        />
                                        <div className="flex-1 relative">
                                            <select
                                                value={editFoodForm.portionUnit}
                                                onChange={(e) => setEditFoodForm({ ...editFoodForm, portionUnit: e.target.value })}
                                                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-brand-500 outline-none appearance-none font-bold text-gray-700"
                                            >
                                                <option value="g">gramas (g)</option>
                                                <option value="unidade">unidade</option>
                                                <option value="ml">ml</option>
                                                <option value="fatia">fatia</option>
                                                <option value="colher">colher</option>
                                                <option value="xícara">xícara</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Macronutrientes</p>
                                <div className="flex gap-3">
                                    <div className="flex-1 text-center">
                                        <label className="block text-[10px] font-bold text-indigo-600 mb-1">Prot(g)</label>
                                        <input
                                            type="number"
                                            value={editFoodForm.protein}
                                            onChange={(e) => setEditFoodForm({ ...editFoodForm, protein: e.target.value })}
                                            className="w-full p-2 text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white font-bold"
                                        />
                                    </div>
                                    <div className="flex-1 text-center">
                                        <label className="block text-[10px] font-bold text-amber-600 mb-1">Carb(g)</label>
                                        <input
                                            type="number"
                                            value={editFoodForm.carbs}
                                            onChange={(e) => setEditFoodForm({ ...editFoodForm, carbs: e.target.value })}
                                            className="w-full p-2 text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white font-bold"
                                        />
                                    </div>
                                    <div className="flex-1 text-center">
                                        <label className="block text-[10px] font-bold text-rose-600 mb-1">Gord(g)</label>
                                        <input
                                            type="number"
                                            value={editFoodForm.fats}
                                            onChange={(e) => setEditFoodForm({ ...editFoodForm, fats: e.target.value })}
                                            className="w-full p-2 text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirmEditFood}
                                className="w-full py-3 bg-brand-600 font-bold rounded-xl text-white shadow-lg shadow-brand-200 hover:bg-brand-700 transition-colors"
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CAMERA MODAL */}
            {isCameraOpen && (
                <div className="fixed inset-0 bg-black z-[60] flex flex-col">
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
                        <span className="text-white font-bold drop-shadow-md">
                            {cameraMode === 'fruit' ? 'IA Sommelier de Frutas' : 'Food Lens AI'}
                        </span>
                        <button onClick={stopCamera} className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {isAnalyzing && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                                <Loader2 className="w-12 h-12 animate-spin text-brand-500 mb-4" />
                                <p className="font-bold text-lg">Analisando...</p>
                                <p className="text-sm text-gray-300">
                                    {cameraMode === 'fruit' ? 'Verificando maturação...' : 'Calculando calorias...'}
                                </p>
                            </div>
                        )}

                        {/* RESULT: FOOD LOG */}
                        {analyzedFood && !isAnalyzing && cameraMode === 'log' && (
                            <div className="absolute bottom-24 left-4 right-4 bg-white dark:bg-gray-900 rounded-xl p-4 shadow-2xl z-20 animate-in slide-in-from-bottom-10 border border-transparent dark:border-gray-800">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-900 dark:text-white">{analyzedFood.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{analyzedFood.portion}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-black text-2xl text-brand-600 dark:text-brand-400">{analyzedFood.calories}</span>
                                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Kcal</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-4">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-xs font-bold flex-1 text-center">P: {analyzedFood.protein}g</div>
                                    <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded text-xs font-bold flex-1 text-center">C: {analyzedFood.carbs}g</div>
                                    <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-2 py-1 rounded text-xs font-bold flex-1 text-center">G: {analyzedFood.fats}g</div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => startCamera(cameraTargetMealId, 'log')} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 font-bold rounded-lg text-gray-600 dark:text-gray-400">Tentar Novamente</button>
                                    <button onClick={() => handleAddFood(analyzedFood)} className="flex-1 py-3 bg-brand-600 dark:bg-brand-500 font-bold rounded-lg text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/40">Adicionar</button>
                                </div>
                            </div>
                        )}

                        {/* RESULT: FRUIT ANALYSIS */}
                        {fruitAnalysis && !isAnalyzing && cameraMode === 'fruit' && (
                            <div className="absolute bottom-24 left-4 right-4 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-2xl z-20 animate-in slide-in-from-bottom-10 border border-green-100 dark:border-green-900/30">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full border border-green-100 dark:border-green-900/30">Resultado da Análise</span>
                                        <h3 className="font-bold text-2xl text-gray-900 dark:text-white mt-2">{fruitAnalysis.name}</h3>
                                    </div>
                                    <div className={`text-center px-3 py-2 rounded-lg ${fruitAnalysis.quality === 'Excelente' || fruitAnalysis.quality === 'Boa'
                                        ? 'bg-green-500 dark:bg-green-600 text-white'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                        } `}>
                                        <span className="block font-black text-sm">{fruitAnalysis.quality}</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="font-bold text-gray-700 dark:text-gray-200 text-sm mb-1">Doçura: <span className="text-gray-900 dark:text-white">{fruitAnalysis.sweetness}</span></p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">{fruitAnalysis.details}</p>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Dica de Especialista
                                    </p>
                                    <p className="text-xs text-blue-800 dark:text-blue-200">{fruitAnalysis.tips}</p>
                                </div>

                                <button onClick={() => startCamera(null, 'fruit')} className="w-full mt-4 py-3 bg-gray-900 dark:bg-gray-800 font-bold rounded-xl text-white shadow-lg">
                                    Analisar Outra
                                </button>
                            </div>
                        )}
                    </div>

                    {!analyzedFood && !fruitAnalysis && !isAnalyzing && (
                        <div className="p-8 bg-black flex justify-center items-center pb-safe">
                            <button
                                onClick={captureAndAnalyze}
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 hover:scale-105 transition-transform"
                            >
                                <div className="w-full h-full bg-white rounded-full"></div>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ADD EXERCISE MODAL */}
            {isExerciseModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 h-[85vh] flex flex-col border border-transparent dark:border-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Adicionar Exercício</h3>
                            <button onClick={() => setExerciseModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                            <button
                                onClick={() => setExerciseModalMode('library')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${exerciseModalMode === 'library' ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                <BookOpen className="w-4 h-4" /> Biblioteca
                            </button>
                            <button
                                onClick={() => setExerciseModalMode('manual')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${exerciseModalMode === 'manual' ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                <Edit3 className="w-4 h-4" /> Manual
                            </button>
                        </div>

                        {exerciseModalMode === 'library' ? (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Search & Filters */}
                                <div className="mb-2">
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Buscar exercício..."
                                            value={exerciseSearchTerm}
                                            onChange={(e) => setExerciseSearchTerm(e.target.value)}
                                            className="w-full pl-9 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-brand-500 dark:focus:ring-brand-400 outline-none text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen', 'Cardio'].map(group => (
                                            <button
                                                key={group}
                                                onClick={() => setSelectedMuscleGroup(group)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedMuscleGroup === group
                                                    ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800'
                                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-gray-700'
                                                    }`}
                                            >
                                                {group}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* List */}
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                    {filteredExercises.map(ex => (
                                        <button
                                            key={ex.id}
                                            onClick={() => handleSelectFromLibrary(ex)}
                                            className="w-full text-left p-3 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex justify-between items-center group"
                                        >
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white text-sm">{ex.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{ex.group}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-500" />
                                        </button>
                                    ))}
                                    {filteredExercises.length === 0 && (
                                        <p className="text-center text-gray-400 text-sm mt-4">Nenhum exercício encontrado.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Exercício / Aparelho</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Leg Press 45"
                                        value={newExercise.name}
                                        onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-brand-500 dark:focus:ring-brand-400 outline-none font-medium text-gray-900 dark:text-white"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Séries</label>
                                        <input
                                            type="number"
                                            value={newExercise.sets}
                                            onChange={e => setNewExercise({ ...newExercise, sets: Number(e.target.value) })}
                                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-brand-500 dark:focus:ring-brand-400 outline-none text-gray-900 dark:text-white font-bold"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Repetições</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: 10-12"
                                            value={newExercise.reps}
                                            onChange={e => setNewExercise({ ...newExercise, reps: e.target.value })}
                                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-brand-500 dark:focus:ring-brand-400 outline-none text-gray-900 dark:text-white font-bold"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descanso (Sugestão)</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 60s"
                                        value={newExercise.rest}
                                        onChange={e => setNewExercise({ ...newExercise, rest: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-brand-500 dark:focus:ring-brand-400 outline-none text-gray-900 dark:text-white font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notas (Carga / Técnica)</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 20kg cada lado, descida lenta"
                                        value={newExercise.notes}
                                        onChange={e => setNewExercise({ ...newExercise, notes: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-brand-500 dark:focus:ring-brand-400 outline-none text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}

                        {exerciseModalMode === 'manual' && (
                            <div className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={handleAddExercise}
                                    disabled={!newExercise.name}
                                    className="w-full py-3 bg-brand-600 dark:bg-brand-500 disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:cursor-not-allowed font-bold rounded-xl text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/40 hover:bg-brand-700 dark:hover:bg-brand-600 transition-colors"
                                >
                                    Confirmar e Adicionar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SAVE OPTION MODAL */}
            {isSaveModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-800">
                        <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Salvar Opção Personalizada</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Dê um nome para esta combinação de alimentos para usá-la facilmente depois.</p>
                        <input
                            type="text"
                            placeholder="Ex: Meu Café da Manhã Favorito"
                            value={newOptionName}
                            onChange={e => setNewOptionName(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mb-4 focus:ring-brand-500 outline-none text-gray-900 dark:text-white font-bold"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setSaveModalOpen(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 font-bold rounded-xl text-gray-600 dark:text-gray-400">Cancelar</button>
                            <button onClick={confirmSaveOption} className="flex-1 py-3 bg-brand-600 dark:bg-brand-500 font-bold rounded-xl text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/40">Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* PLAN DAY MODAL */}
            {isPlanDayModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-4 text-brand-600 dark:text-brand-400">
                            <ShoppingBasket className="w-6 h-6" />
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Adicionar à Lista</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Isso irá calcular os ingredientes necessários para as refeições deste dia e adicionar à sua lista de compras.
                        </p>

                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Cozinhar para quantas pessoas?</label>
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={() => setHouseholdSizeInput(Math.max(1, householdSizeInput - 1))}
                                className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <span className="text-xl font-bold text-gray-600 dark:text-gray-400">-</span>
                            </button>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white w-8 text-center">{householdSizeInput}</span>
                            <button
                                onClick={() => setHouseholdSizeInput(householdSizeInput + 1)}
                                className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <span className="text-xl font-bold text-gray-600 dark:text-gray-400">+</span>
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setPlanDayModalOpen(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 font-bold rounded-xl text-gray-600 dark:text-gray-400">Cancelar</button>
                            <button onClick={confirmPlanDay} className="flex-1 py-3 bg-brand-600 dark:bg-brand-500 font-bold rounded-xl text-white shadow-lg shadow-brand-200 dark:shadow-brand-900/40">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MEAL CAMERA MODAL */}
            {cameraModalOpen && selectedMealForCamera && (
                <MealCameraModal
                    isOpen={cameraModalOpen}
                    onClose={() => setCameraModalOpen(false)}
                    mealId={selectedMealForCamera.id}
                    mealName={selectedMealForCamera.name}
                    onFoodAnalyzed={handleMealAnalysis}
                />
            )}

            {/* DEFICIT GOAL MODAL */}
            {isDeficitModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-800">
                        <h3 className="font-bold text-xl mb-2 text-gray-800 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            Meta de Déficit Calórico
                        </h3>
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2 text-center">Meta de Déficit Semanal</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-6 px-4">Defina o acúmulo de queima calórica que você deseja alcançar nos últimos 7 dias.</p>

                        <div className="flex items-center justify-between mb-8 px-4">
                            <button
                                onClick={() => setDeficitGoal(Math.max(500, deficitGoal - 500))}
                                className="w-12 h-12 rounded-full border-2 border-blue-100 dark:border-blue-900/40 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-95 transition-all"
                            >
                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">-</span>
                            </button>
                            <div className="flex-1 text-center">
                                <div className="text-4xl font-black text-blue-600 dark:text-blue-400">{deficitGoal}</div>
                                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight">kcal acumuladas</div>
                            </div>
                            <button
                                onClick={() => setDeficitGoal(Math.min(15000, deficitGoal + 500))}
                                className="w-12 h-12 rounded-full border-2 border-blue-100 dark:border-blue-900/40 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-95 transition-all"
                            >
                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">+</span>
                            </button>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-2xl mb-6 mx-4 border border-transparent dark:border-blue-900/50">
                            <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase mb-2 tracking-wider">Equivalência Estimada</div>
                            <div className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                                Com este déficit, você perderá cerca de <strong className="text-blue-600 dark:text-blue-400">{(deficitGoal / 7700).toFixed(2)} kg</strong> de gordura por semana.
                                <div className="text-[10px] text-blue-400 dark:text-blue-500 mt-2 italic font-medium">
                                    * Referência: 7.700 kcal = 1kg de gordura. Os resultados reais podem variar conforme o metabolismo individual.
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                const todayKey = getDateKey(new Date());
                                setDeficitStartDate(todayKey);
                                alert("Contagem de déficit reiniciada a partir de hoje!");
                            }}
                            className="w-[calc(100%-2rem)] mx-4 py-3 mb-6 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center justify-center gap-2"
                        >
                            <CalendarRange className="w-4 h-4" />
                            Começar contagem hoje
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeficitModalOpen(false)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 font-bold rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={() => setIsDeficitModalOpen(false)}
                                className="flex-1 py-3 bg-blue-600 dark:bg-blue-500 font-bold rounded-xl text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/40 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* GOALS MODAL */}
            {isGoalsModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white">Editar Metas Diárias</h3>
                            <button
                                onClick={() => {
                                    // Reset to plan defaults
                                    const defaults = {
                                        calories: plan.nutrition?.targetCalories || 2000,
                                        protein: plan.nutrition?.meals?.reduce((acc, m) => acc + (m.macros?.protein || 0), 0) || 150,
                                        carbs: plan.nutrition?.meals?.reduce((acc, m) => acc + (m.macros?.carbs || 0), 0) || 200,
                                        fats: plan.nutrition?.meals?.reduce((acc, m) => acc + (m.macros?.fats || 0), 0) || 60
                                    };
                                    setCustomTargets(defaults);
                                }}
                                className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline uppercase"
                            >
                                Resetar para o Plano
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meta de Calorias (kcal)</label>
                                <input
                                    type="number"
                                    value={customTargets.calories}
                                    onChange={e => setCustomTargets({ ...customTargets, calories: Number(e.target.value) })}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Proteína (g)</label>
                                    <input
                                        type="number"
                                        value={customTargets.protein}
                                        onChange={e => setCustomTargets({ ...customTargets, protein: Number(e.target.value) })}
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-800 dark:text-white text-center"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Carbos (g)</label>
                                    <input
                                        type="number"
                                        value={customTargets.carbs}
                                        onChange={e => setCustomTargets({ ...customTargets, carbs: Number(e.target.value) })}
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-800 dark:text-white text-center"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Gordura (g)</label>
                                    <input
                                        type="number"
                                        value={customTargets.fats}
                                        onChange={e => setCustomTargets({ ...customTargets, fats: Number(e.target.value) })}
                                        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-800 dark:text-white text-center"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsGoalsModalOpen(false)}
                            className="w-full mt-8 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-100 active:scale-95 transition-all"
                        >
                            Salvar Metas
                        </button>
                        <button
                            onClick={() => setIsGoalsModalOpen(false)}
                            className="w-full mt-2 py-3 text-gray-400 dark:text-gray-500 text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Food Preferences Modal */}
            <FoodPreferencesModal
                isOpen={isFoodPreferencesModalOpen}
                onClose={() => setIsFoodPreferencesModalOpen(false)}
                currentPreferences={foodPreferences}
                onSave={handleSavePreferences}
            />

            {renderSmartImportModal()}
            {renderDeficitBreakdownModal()}

            {/* EXTRA CALORIES MODAL */}
            {isExtraCaloriesModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 dark:text-white">Calorias Extras</h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">Ajuste Manual</p>
                            </div>
                            <button onClick={() => setExtraCaloriesModalOpen(false)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Calorias Ativas (Relógio/Treino)</label>
                            <input
                                type="number"
                                value={newExtraCalories}
                                onChange={(e) => setNewExtraCalories(e.target.value)}
                                className="w-full text-4xl font-black text-center text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-900/50 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                autoFocus
                            />
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2 font-medium">Isso será somado ao seu metabolismo basal.</p>
                        </div>

                        <button
                            onClick={handleSaveExtraCalories}
                            className="w-full py-4 bg-brand-600 dark:bg-brand-500 text-white font-bold rounded-2xl shadow-lg shadow-brand-100 dark:shadow-brand-900/40 active:scale-[0.98] transition-all"
                        >
                            Salvar Ajuste
                        </button>
                    </div>
                </div>
            )}

            {/* CELEBRATION MESSAGE OVERLAY */}
            {showCelebrationMessage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4 animate-in fade-in duration-300">
                    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-2 border-brand-500 rounded-3xl p-8 shadow-[0_20px_50px_rgba(34,197,94,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-50 duration-500 flex flex-col items-center text-center max-w-xs">
                        <div className="bg-brand-100 dark:bg-brand-900/40 p-4 rounded-full mb-4 ring-8 ring-brand-50 dark:ring-brand-900/20">
                            <Flame className="w-12 h-12 text-brand-600 dark:text-brand-400 animate-bounce" />
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">META BATIDA!</h2>
                        <p className="text-gray-600 dark:text-gray-400 font-bold text-lg leading-tight">Seu déficit do dia foi garantido com sucesso. 🚀</p>
                        <div className="h-1 w-12 bg-brand-500 rounded-full mt-4"></div>
                        <p className="text-[10px] text-brand-600 dark:text-brand-400 font-black uppercase tracking-widest mt-4">Foco no objetivo!</p>
                    </div>
                </div>
            )}

        </div>
    );
};
