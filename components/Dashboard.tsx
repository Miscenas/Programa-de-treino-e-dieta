import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FullPlan, UserProfile, FoodItem, ShoppingItem, MealOption, Meal, Exercise, Gender } from '../types';
import { Droplets, Flame, Dumbbell, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Apple, ShoppingBasket, Printer, Clock, RefreshCw, LayoutDashboard, Plus, PlusCircle, Search, X, Trash2, CalendarRange, ChevronLeft, ChevronRight, Check, Save, Star, Users, CheckSquare, Square, ArrowDown, Share2, Circle, PlayCircle, Beef, Wheat, Sandwich, ArrowLeft, PenSquare, BookOpen, Edit3, Camera, Aperture, Loader2, Sparkles, ScanLine, Utensils, Scale, TrendingUp, ListChecks, Eraser, Activity } from 'lucide-react';
import { foodDatabase } from '../services/foodDatabase';
import { getIngredientCategory } from '../services/expertSystem';
import { exerciseDatabase, LibraryExercise } from '../services/exerciseDatabase';
import { GoogleGenAI, Type } from "@google/genai";
import { NutritionDashboard } from './NutritionDashboard';
import { MealCameraModal } from './MealCameraModal';
import { EdgeFunctionService } from '../services/edgeFunctionService';
import { GoogleFitWebService } from '../services/googleFitWebService';
import { supabase } from '../services/supabaseClient';

interface Props {
    plan: FullPlan;
    user: UserProfile;
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

    const gradientId = `grad-${type}`;
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
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={colors.start} />
                        <stop offset="100%" stopColor={colors.end} />
                    </linearGradient>
                    <filter id={`glow-${type}`} x="-20%" y="-20%" width="140%" height="140%">
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
                    strokeDasharray={`${arcLength} ${circumference}`}
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
                    strokeDasharray={`${arcLength} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(${rotation} ${center} ${center})`}
                    className="transition-all duration-1000 ease-out"
                    filter={`url(#glow-${type})`}
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center mt-3">
                <div className="text-gray-400 mb-0.5 scale-90">{icon}</div>
                <span className="text-2xl font-black text-gray-800 leading-none tracking-tight">{value}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{suffix} / {max}</span>
            </div>

            <span className="text-xs font-bold text-gray-500 -mt-2 whitespace-nowrap">{label}</span>
        </div>
    );
};

export const Dashboard: React.FC<Props> = ({ plan, user, onReset, onUpdatePlan }) => {
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

    // --- PROGRESS TRACKING STATE ---
    // Map DateString (YYYY-MM-DD) -> number
    const [weightHistory, setWeightHistory] = useState<Record<string, number>>({});
    const [bodyFatHistory, setBodyFatHistory] = useState<Record<string, number>>({});
    const [waistHistory, setWaistHistory] = useState<Record<string, number>>({});

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
        return saved ? parseInt(saved) : 500; // Default 500 kcal
    });
    const [isDeficitModalOpen, setIsDeficitModalOpen] = useState(false);


    // Modals State
    const [isFoodModalOpen, setFoodModalOpen] = useState(false);
    const [isExerciseModalOpen, setExerciseModalOpen] = useState(false);

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
    const [newManualFood, setNewManualFood] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '', portion: '1 porção' });

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
        return mondayBasedIndex % options.length;
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

        const selectionKey = `${dateKey}_${meal.id}`;
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
            [`${todayKey}_${mealId}`]: 0 // Select first option (the analyzed one)
        }));
    };

    // Function to open camera modal
    const openMealCamera = (mealId: string, mealName: string) => {
        setSelectedMealForCamera({ id: mealId, name: mealName });
        setCameraModalOpen(true);
    };

    // --- GOOGLE FIT INTEGRATION ---

    const handleGoogleFitImport = async () => {
        setImportingGoogleFit(true);

        try {
            // Connect to Google Fit
            await GoogleFitWebService.connect();

            // Import data from last 30 days
            const data = await GoogleFitWebService.importData(30);

            // Get current user ID from auth
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const userId = authUser?.id || 'demo-user';

            // Save to Supabase
            for (let i = 0; i < data.steps.length; i++) {
                const stepData = data.steps[i];
                const calorieData = data.calories.find(c => c.date === stepData.date);

                // Use upsert to handle duplicates
                const { error } = await supabase.from('smartwatch_data').upsert({
                    user_id: userId,
                    date: stepData.date,
                    steps: stepData.steps,
                    calories_burned: calorieData?.calories || 0,
                    source: 'google_fit_import',
                    created_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,date'
                });

                if (error) {
                    console.error('Error saving smartwatch data:', error);
                }
            }

            alert(`✅ Dados do Google Fit importados com sucesso!\n\n📊 ${data.steps.length} dias de dados salvos.`);
            console.log('Google Fit data imported successfully:', data);

            // Recarregar dados para exibir
            await fetchGoogleFitData();

        } catch (error) {
            console.error('Erro ao importar Google Fit:', error);
            alert('❌ Falha ao importar dados do Google Fit.\n\nVerifique se você configurou o REACT_APP_GOOGLE_CLIENT_ID nas variáveis de ambiente.');
        } finally {
            setImportingGoogleFit(false);
        }
    };

    // --- GOOGLE FIT DATA FETCHING ---

    const fetchGoogleFitData = async () => {
        setLoadingGoogleFitData(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const userId = authUser?.id || 'demo-user';

            // Buscar dados dos últimos 30 dias
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('smartwatch_data')
                .select('date, steps, calories_burned')
                .eq('user_id', userId)
                .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
                .order('date', { ascending: true });

            if (error) {
                console.error('Error fetching Google Fit data:', error);
                return;
            }

            setGoogleFitData(data || []);
        } catch (error) {
            console.error('Error fetching Google Fit data:', error);
        } finally {
            setLoadingGoogleFitData(false);
        }
    };

    // Calcular Taxa Metabólica Basal (TMB) usando fórmula Harris-Benedict
    const calculateBMR = (): number => {
        if (user.gender === Gender.Male) {
            return Math.round(88.362 + (13.397 * user.weight) + (4.799 * user.height) - (5.677 * user.age));
        } else {
            return Math.round(447.593 + (9.247 * user.weight) + (3.098 * user.height) - (4.330 * user.age));
        }
    };

    // Obter dados do Google Fit para uma data específica
    const getGoogleFitDataForDate = (dateKey: string) => {
        return googleFitData.find(d => d.date === dateKey) || { steps: 0, calories_burned: 0 };
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

    const filteredExercises = useMemo(() => {
        let list = exerciseDatabase;
        if (selectedMuscleGroup !== 'Todos') {
            list = list.filter(ex => ex.group === selectedMuscleGroup);
        }
        if (exerciseSearchTerm) {
            const lower = exerciseSearchTerm.toLowerCase();
            list = list.filter(ex => ex.name.toLowerCase().includes(lower));
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
        const targets = { protein: 0, carbs: 0, fats: 0 };
        const consumed = { protein: 0, carbs: 0, fats: 0 };
        const dayLog = dietHistory[dateKey] || {};

        (plan.nutrition?.meals || []).forEach(meal => {
            targets.protein += meal.macros?.protein || 0;
            targets.carbs += meal.macros?.carbs || 0;
            targets.fats += meal.macros?.fats || 0;

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
            } else {
                // Not consumed, check if a different option is selected to update targets?
                // Actually user requested counters to update. Gauges usually show "Consumed" vs "Target".
                // If the user SWAPS an option, the "Target" or "Planned" might change?
                // The prompt says "contadores de calorias". Usually implies "Consumed" or the "Daily Total" gauge.
                // If "Calorias (Hoje)" gauge relies on "todayConsumedCalories", that is only CONSUMED.
                // But maybe they mean the "Resumo da Dieta" or simply expecting the gauge to fill up differently?
                // Wait, if I haven't consumed it, the gauge is 0.
                // Maybe they mean the PLANNED total?
                // "getCaloriesForDate(dateKey, false)" calculates PLANNED.

                // Let's update the logic for PLANNED (when onlyConsumed is false).
            }
        });

        return { targets, consumed };
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

    const selectedDayPlannedCalories = getCaloriesForDate(selectedDateKey, false);
    const todayConsumedCalories = getCaloriesForDate(todayKey, true);
    const weeklyWorkoutsDone = getWeeklyWorkoutCount();
    const weeklyFrequencyTarget = user.workoutFrequency || 3;
    const todayMacros = getDailyMacros(todayKey);

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

    const handleAddManualFood = () => {
        if (!newManualFood.name || !newManualFood.calories) return;

        const food: FoodItem = {
            id: `manual-${Date.now()}`,
            name: newManualFood.name,
            calories: Number(newManualFood.calories),
            protein: Number(newManualFood.protein) || 0,
            carbs: Number(newManualFood.carbs) || 0,
            fats: Number(newManualFood.fats) || 0,
            portion: newManualFood.portion || '1 porção',
            category: 'meal'
        };

        handleAddFood(food);
        // Reset form
        setNewManualFood({ name: '', calories: '', protein: '', carbs: '', fats: '', portion: '1 porção' });
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
        return foodDatabase.filter(f => f.name.toLowerCase().includes(foodSearchTerm.toLowerCase()));
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

                        const mapKey = `${cleanName}__${unit}`;

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
        return `${Math.ceil(qty)} ${unit}${qty > 1 && unit !== 'un' && !unit.endsWith('s') ? 's' : ''}`;
    };

    const handleShare = async () => {
        const activeList = calculatedShoppingList.filter(item => !checkedItems.has(`${item.name}__${item.unit}`));

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
            text += `*${cat}*\n`;
            items.forEach(item => {
                text += `[ ] ${item.name} - ${formatShoppingQuantity(item.quantity, item.unit)}\n`;
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
        let dPath = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];
            const cp1x = curr.x + (next.x - curr.x) / 2;
            dPath += ` C ${cp1x} ${curr.y}, ${cp1x} ${next.y}, ${next.x} ${next.y}`;
        }

        const areaPath = `${dPath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

        return (
            <div className="relative group w-full h-full">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area Gradient */}
                    <path d={areaPath} fill={`url(#gradient-${color.replace('#', '')})`} />

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
                    <h2 className="text-2xl font-bold text-gray-800">Evolução Mensal</h2>
                    <button
                        onClick={() => setIsMeasurementModalOpen(true)}
                        className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-brand-700 active:scale-95 transition-all shadow-lg shadow-brand-200"
                    >
                        <Plus className="w-4 h-4" /> Registrar Medidas
                    </button>
                </div>

                {/* GOOGLE FIT ACTIVITY CHARTS */}
                {googleFitData.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        <div className="col-span-full">
                            <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                                <Activity className="w-6 h-6 text-green-600" />
                                Atividade Física (Google Fit) - Últimos 30 Dias
                            </h2>
                        </div>

                        {/* STEPS CHART */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-green-500" /> Passos Diários
                                </h3>
                                {(() => {
                                    const totalSteps = googleFitData.reduce((sum, d) => sum + d.steps, 0);
                                    const avgSteps = Math.round(totalSteps / googleFitData.length);
                                    return (
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-green-600">
                                                {avgSteps.toLocaleString()}
                                            </div>
                                            <div className="text-xs font-bold text-gray-400">média/dia</div>
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
                                <div className="bg-green-50 p-3 rounded-xl text-center">
                                    <div className="text-xs font-semibold text-green-700 uppercase mb-1">Total</div>
                                    <div className="text-lg font-black text-green-900">
                                        {googleFitData.reduce((sum, d) => sum + d.steps, 0).toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-green-50 p-3 rounded-xl text-center">
                                    <div className="text-xs font-semibold text-green-700 uppercase mb-1">Melhor Dia</div>
                                    <div className="text-lg font-black text-green-900">
                                        {Math.max(...googleFitData.map(d => d.steps)).toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-green-50 p-3 rounded-xl text-center">
                                    <div className="text-xs font-semibold text-green-700 uppercase mb-1">Meta 10k</div>
                                    <div className="text-lg font-black text-green-900">
                                        {googleFitData.filter(d => d.steps >= 10000).length}/{googleFitData.length}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CALORIES BURNED CHART */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-orange-500" /> Calorias Queimadas
                                </h3>
                                {(() => {
                                    const totalCalories = googleFitData.reduce((sum, d) => sum + d.calories_burned, 0);
                                    const avgCalories = Math.round(totalCalories / googleFitData.length);
                                    return (
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-orange-600">
                                                {avgCalories}
                                            </div>
                                            <div className="text-xs font-bold text-gray-400">média/dia</div>
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
                                <div className="bg-orange-50 p-3 rounded-xl text-center">
                                    <div className="text-xs font-semibold text-orange-700 uppercase mb-1">Total</div>
                                    <div className="text-lg font-black text-orange-900">
                                        {googleFitData.reduce((sum, d) => sum + d.calories_burned, 0).toLocaleString()} kcal
                                    </div>
                                </div>
                                <div className="bg-orange-50 p-3 rounded-xl text-center">
                                    <div className="text-xs font-semibold text-orange-700 uppercase mb-1">Melhor Dia</div>
                                    <div className="text-lg font-black text-orange-900">
                                        {Math.max(...googleFitData.map(d => d.calories_burned))} kcal
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-6">
                    <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                        <Scale className="w-6 h-6 text-brand-600" />
                        Medidas e Composição Corporal
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* WEIGHT CHART */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-brand-500" /> Peso Corporal
                            </h3>
                            {weightChartData.length > 0 && (
                                <span className="text-2xl font-black text-brand-600">
                                    {weightChartData[weightChartData.length - 1].value}<span className="text-xs font-bold text-gray-400 ml-1">kg</span>
                                </span>
                            )}
                        </div>
                        <div className="h-48">
                            <PremiumLineChart data={weightChartData.slice(-10)} color="#6366f1" yLabel="kg" />
                        </div>
                    </div>

                    {/* BODY FAT CHART */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-rose-500" /> Gordura Corporal
                            </h3>
                            {fatChartData.length > 0 && (
                                <span className="text-2xl font-black text-rose-600">
                                    {fatChartData[fatChartData.length - 1].value}<span className="text-xs font-bold text-gray-400 ml-1">%</span>
                                </span>
                            )}
                        </div>
                        <div className="h-48">
                            <PremiumLineChart data={fatChartData.slice(-10)} color="#f43f5e" yLabel="%" />
                        </div>
                    </div>

                    {/* WAIST CHART */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <ScanLine className="w-5 h-5 text-emerald-500" /> Medida Abdominal
                            </h3>
                            {waistChartData.length > 0 && (
                                <span className="text-2xl font-black text-emerald-600">
                                    {waistChartData[waistChartData.length - 1].value}<span className="text-xs font-bold text-gray-400 ml-1">cm</span>
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
                        <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="font-bold text-xl mb-4 text-gray-800">Registrar Medidas</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1">Peso (kg)</label>
                                    <input
                                        type="number"
                                        value={newMeasurement.weight}
                                        onChange={e => setNewMeasurement({ ...newMeasurement, weight: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold text-gray-900"
                                        placeholder="Ex: 75.5"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1">Gordura Corporal % (Opcional)</label>
                                    <input
                                        type="number"
                                        value={newMeasurement.bodyFat}
                                        onChange={e => setNewMeasurement({ ...newMeasurement, bodyFat: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold text-gray-900"
                                        placeholder="Ex: 15"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1">Medida Abdominal (cm)</label>
                                    <input
                                        type="number"
                                        value={newMeasurement.waist}
                                        onChange={e => setNewMeasurement({ ...newMeasurement, waist: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold text-gray-900"
                                        placeholder="Ex: 85"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setIsMeasurementModalOpen(false)}
                                    className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        if (!newMeasurement.weight) return;
                                        const todayKey = getDateKey(new Date());
                                        setWeightHistory(prev => ({ ...prev, [todayKey]: Number(newMeasurement.weight) }));
                                        if (newMeasurement.bodyFat) {
                                            setBodyFatHistory(prev => ({ ...prev, [todayKey]: Number(newMeasurement.bodyFat) }));
                                        }
                                        if (newMeasurement.waist) {
                                            setWaistHistory(prev => ({ ...prev, [todayKey]: Number(newMeasurement.waist) }));
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

    const renderOverview = () => {
        const isWorkoutDoneToday = workoutLog.has(todayKey);

        return (
            <div className="space-y-6 animate-in fade-in duration-300 pb-20">
                {/* UNDO BUTTON IN OVERVIEW */}
                {backupPlan && (
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-center justify-between shadow-sm border-l-4 border-l-orange-500">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-full">
                                <RefreshCw className="w-5 h-5 text-orange-600 animate-spin-slow" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-orange-900">Plano Alternativo Ativo</h4>
                                <p className="text-[10px] text-orange-700">Você pode voltar ao plano original a qualquer momento.</p>
                            </div>
                        </div>
                        <button
                            onClick={undoImport}
                            className="bg-white text-orange-700 px-4 py-2 rounded-xl text-xs font-black uppercase shadow-sm border border-orange-100 active:scale-95 transition-all"
                        >
                            Restaurar
                        </button>
                    </div>
                )}

                {/* GOOGLE FIT IMPORT BUTTON */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">Sincronizar Google Fit</h3>
                            <p className="text-blue-100 text-[10px]">Importe seus dados de atividade física</p>
                        </div>
                    </div>
                    <button
                        onClick={handleGoogleFitImport}
                        disabled={importingGoogleFit}
                        className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {importingGoogleFit ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Importando...</span>
                            </>
                        ) : (
                            <>
                                <Activity className="w-4 h-4" />
                                <span>Importar</span>
                            </>
                        )}
                    </button>
                </div>

                {/* ACTIVITY SUMMARY CARD */}
                {googleFitData.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-green-600" />
                            Atividade Física (Hoje)
                        </h2>

                        {(() => {
                            const todayData = getGoogleFitDataForDate(todayKey);
                            const bmr = calculateBMR();
                            const totalCaloriesExpended = bmr + todayData.calories_burned;
                            const stepsGoal = 10000;
                            const stepsProgress = Math.min((todayData.steps / stepsGoal) * 100, 100);

                            return (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Passos */}
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Passos</span>
                                            <span className="text-xs text-green-600">{Math.round(stepsProgress)}%</span>
                                        </div>
                                        <div className="text-2xl font-black text-green-900 mb-1">
                                            {todayData.steps.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-green-600 mb-2">Meta: {stepsGoal.toLocaleString()}</div>
                                        <div className="w-full bg-green-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${stepsProgress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Calorias Queimadas */}
                                    <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Atividade</span>
                                            <Flame className="w-4 h-4 text-orange-500" />
                                        </div>
                                        <div className="text-2xl font-black text-orange-900 mb-1">
                                            {todayData.calories_burned}
                                        </div>
                                        <div className="text-xs text-orange-600">kcal queimadas</div>
                                    </div>

                                    {/* Gasto Total */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Gasto Total</span>
                                            <TrendingUp className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div className="text-2xl font-black text-blue-900 mb-1">
                                            {totalCaloriesExpended}
                                        </div>
                                        <div className="text-xs text-blue-600">
                                            TMB ({bmr}) + Atividade ({todayData.calories_burned})
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* HEADER GAUGES */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">Resumo da Semana</h2>
                    <div className="flex justify-around items-center">

                        {/* GAUGE CALORIAS */}
                        <ModernGauge
                            value={todayConsumedCalories}
                            max={plan.nutrition?.targetCalories || 2000}
                            type="calories"
                            label="Calorias (Hoje)"
                            suffix="kcal"
                            icon={<Flame className="w-5 h-5 text-orange-500" />}
                        />

                        {/* GAUGE DÉFICIT CALÓRICO */}
                        {(() => {
                            const todayData = getGoogleFitDataForDate(todayKey);
                            const bmr = calculateBMR();
                            const totalExpended = bmr + todayData.calories_burned;
                            // Only show deficit if user has consumed calories
                            const actualDeficit = todayConsumedCalories > 0
                                ? totalExpended - todayConsumedCalories
                                : 0;

                            return (
                                <div className="relative">
                                    <ModernGauge
                                        value={actualDeficit}
                                        max={deficitGoal}
                                        type="deficit"
                                        label="Déficit (Hoje)"
                                        suffix="kcal"
                                        icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
                                    />
                                    <button
                                        onClick={() => setIsDeficitModalOpen(true)}
                                        className="absolute top-2 right-2 bg-blue-50 hover:bg-blue-100 text-blue-600 p-1.5 rounded-lg transition-colors"
                                        title="Editar meta de déficit"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* MACROS CARD */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-blue-500" />
                        Macronutrientes (Hoje)
                    </h3>

                    <div className="space-y-4">
                        {/* PROTEIN */}
                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                                    <Beef className="w-3.5 h-3.5" /> Proteínas
                                </div>
                                <div className="text-xs text-gray-500">
                                    <span className="font-bold text-gray-800">{Math.round(todayMacros.consumed.protein)}</span> / {todayMacros.targets.protein}g
                                </div>
                            </div>
                            <div className="h-2 w-full bg-indigo-50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min((todayMacros.consumed.protein / todayMacros.targets.protein) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* CARBS */}
                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                                    <Wheat className="w-3.5 h-3.5" /> Carboidratos
                                </div>
                                <div className="text-xs text-gray-500">
                                    <span className="font-bold text-gray-800">{Math.round(todayMacros.consumed.carbs)}</span> / {todayMacros.targets.carbs}g
                                </div>
                            </div>
                            <div className="h-2 w-full bg-amber-50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min((todayMacros.consumed.carbs / todayMacros.targets.carbs) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* FATS */}
                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                                    <Droplets className="w-3.5 h-3.5" /> Gorduras
                                </div>
                                <div className="text-xs text-gray-500">
                                    <span className="font-bold text-gray-800">{Math.round(todayMacros.consumed.fats)}</span> / {todayMacros.targets.fats}g
                                </div>
                            </div>
                            <div className="h-2 w-full bg-rose-50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-rose-500 rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min((todayMacros.consumed.fats / todayMacros.targets.fats) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QUICK ACTIONS */}
                <div className="space-y-4">

                    {/* WORKOUT CHECK-IN */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-brand-100 p-2 rounded-full text-brand-600">
                                    <Dumbbell className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Treino de Hoje</h3>
                                    <p className="text-xs text-gray-500">{todayWorkout.focus || "Descanso"}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleWorkoutCompletion(todayKey)}
                            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${isWorkoutDoneToday
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-brand-600 text-white shadow-lg shadow-brand-200 hover:bg-brand-700'
                                }`}
                        >
                            {isWorkoutDoneToday ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    Treino Concluído!
                                </>
                            ) : (
                                <>
                                    <PlayCircle className="w-5 h-5" />
                                    Check-in do Treino
                                </>
                            )}
                        </button>
                    </div>

                    {/* GLOBAL ADICIONAR ALIMENTO */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <button
                            onClick={() => {
                                // Encontrar a refeição mais próxima do horário atual
                                const now = new Date();
                                const currentHour = now.getHours();
                                let closestMeal = (plan.nutrition?.meals || [])[0];
                                let minDiff = 24;

                                (plan.nutrition?.meals || []).forEach(m => {
                                    const mealHour = parseInt(m.time);
                                    const diff = Math.abs(currentHour - mealHour);
                                    if (diff < minDiff) {
                                        minDiff = diff;
                                        closestMeal = m;
                                    }
                                });
                                if (closestMeal) startCamera(closestMeal.id, 'log');
                            }}
                            className="relative w-full bg-white border border-brand-100 p-4 rounded-xl shadow-md flex items-center justify-between hover:border-brand-300 transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-gradient-to-br from-brand-600 to-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-brand-200">
                                    <Aperture className="w-6 h-6 animate-pulse" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-gray-900">Analisar Alimento (IA)</h3>
                                    <p className="text-xs text-brand-600 font-medium italic">Food Lens AI • Instantâneo</p>
                                </div>
                            </div>
                            <div className="bg-brand-50 p-2 rounded-lg text-brand-500 group-hover:bg-brand-100 transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </button>
                    </div>

                    {/* MEAL CHECK-IN */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                                <Apple className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-gray-900">Refeições de Hoje</h3>
                        </div>

                        <div className="space-y-3">
                            {(plan.nutrition?.meals || []).map((meal) => {
                                const isConsumed = consumedMeals.has(`${todayKey}_${meal.id}`);
                                return (
                                    <div key={meal.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => toggleMealConsumption(meal.id, todayKey)}
                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isConsumed ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                                                    }`}
                                            >
                                                {isConsumed && <Check className="w-3.5 h-3.5 text-white" />}
                                            </button>
                                            <div>
                                                <p className={`text-sm font-bold ${isConsumed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{meal.name}</p>
                                                <p className="text-xs text-gray-400">
                                                    {(() => {
                                                        return getComputedMealCalories(meal, todayKey);
                                                    })()} kcal
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-gray-500">{meal.time}</span>
                                            {/* Botão de Câmera Rápida */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openMealCamera(meal.id, meal.name); }}
                                                className="p-1.5 bg-brand-50 text-brand-600 rounded-full hover:bg-brand-100 transition-colors active:scale-95"
                                                title="Atualizar refeição com foto"
                                            >
                                                <Camera className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

            </div>
        )
    };

    const renderWorkout = () => (
        <div className="space-y-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* UNDO BUTTON */}
            {backupPlan && (
                <div className="bg-brand-50 border border-brand-200 p-3 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-brand-600 animate-spin-slow" />
                        <span className="text-xs font-bold text-brand-800">Você está usando um plano importado</span>
                    </div>
                    <button
                        onClick={undoImport}
                        className="text-[10px] font-black uppercase text-brand-700 hover:text-brand-900 bg-white px-3 py-1.5 rounded-lg border border-brand-100 shadow-sm transition-all active:scale-95"
                    >
                        Restaurar Sistema
                    </button>
                </div>
            )}
            {/* GLOBAL IMPORT BUTTON */}
            <div className="bg-gradient-to-br from-indigo-600 to-brand-600 p-4 rounded-2xl shadow-lg shadow-brand-100 flex items-center justify-between group">
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
                    className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all hover:bg-indigo-50"
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
                    <div key={session.dayName} className={`bg-white rounded-xl border transition-all duration-300 ${isExpanded ? 'border-brand-500 shadow-md' : 'border-gray-200'}`}>
                        <button
                            onClick={() => setExpandedDay(isExpanded ? null : session.dayName)}
                            className="w-full flex items-center justify-between p-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isToday ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                                    <CalendarDays className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900">{session.dayName}</h3>
                                        {isCustomized && <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 rounded-full font-bold flex items-center gap-0.5"><PenSquare className="w-2.5 h-2.5" /> Editado</span>}
                                    </div>
                                    <p className="text-sm text-gray-500">{session.focus}</p>
                                </div>
                            </div>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </button>

                        {isExpanded && (
                            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                                {displayExercises.length === 0 ? (
                                    <p className="text-center text-gray-400 py-4">Dia de Descanso Merecido! 😴</p>
                                ) : (
                                    <div className="space-y-3">
                                        {displayExercises.map((ex, i) => {
                                            const key = `${session.dayName}-${ex.name}`;
                                            const isDone = completedExercises.has(key);
                                            return (
                                                <div key={i} className="flex gap-3 items-start group">
                                                    <button
                                                        onClick={() => toggleExercise(session.dayName, ex.name)}
                                                        className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${isDone ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-brand-400'
                                                            }`}
                                                    >
                                                        {isDone && <Check className="w-4 h-4 text-white" />}
                                                    </button>
                                                    <div className={`flex-1 ${isDone ? 'opacity-50' : ''}`}>
                                                        <div className="flex justify-between items-start">
                                                            <p className={`font-bold text-sm ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>{ex.name}</p>
                                                            <button
                                                                onClick={(e) => handleRemoveExercise(session.dayName, i, e)}
                                                                className="text-gray-300 hover:text-red-500 p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                                                title="Remover exercício"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            {ex.sets}x {ex.reps} {ex.rest && `| ⏳ ${ex.rest}`}
                                                        </p>
                                                        {ex.notes && <p className="text-xs text-amber-600 mt-0.5">💡 {ex.notes}</p>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Add Exercise Button */}
                                <div className="mt-4 pt-3 border-t border-gray-50">
                                    <button
                                        onClick={() => handleOpenExerciseModal(session.dayName)}
                                        className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-2 hover:text-brand-600 hover:border-brand-300 transition-colors"
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
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-orange-600 animate-spin-slow" />
                            <span className="text-xs font-bold text-orange-800">Você está usando uma dieta importada</span>
                        </div>
                        <button
                            onClick={undoImport}
                            className="text-[10px] font-black uppercase text-orange-700 hover:text-orange-900 bg-white px-3 py-1.5 rounded-lg border border-orange-100 shadow-sm transition-all active:scale-95"
                        >
                            Restaurar Sistema
                        </button>
                    </div>
                )}

                {/* GLOBAL IMPORT BUTTON */}
                <div className="bg-gradient-to-br from-orange-500 to-rose-500 p-4 rounded-2xl shadow-lg shadow-orange-100 flex items-center justify-between group">
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
                        className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all hover:bg-orange-50"
                    >
                        Importar AI
                    </button>
                </div>

                {/* Date Navigator */}
                <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm sticky top-0 z-10">
                    <button onClick={() => {
                        const d = new Date(selectedDate);
                        d.setDate(d.getDate() - 1);
                        handleDateSelect(d);
                    }} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="text-center">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Planejamento</p>
                        <div className="flex items-center gap-2 justify-center">
                            <CalendarRange className="w-4 h-4 text-brand-600" />
                            <span className="font-bold text-gray-800">
                                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })}
                            </span>
                        </div>
                    </div>

                    <button onClick={() => {
                        const d = new Date(selectedDate);
                        d.setDate(d.getDate() + 1);
                        handleDateSelect(d);
                    }} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Daily Summary */}
                <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-brand-900">Meta Diária</h3>
                        <span className="text-xs font-bold bg-white text-brand-700 px-2 py-1 rounded shadow-sm">
                            {selectedDayPlannedCalories} / {plan.nutrition?.targetCalories || 2000} kcal
                        </span>
                    </div>
                    {/* Save Day Button */}
                    {isSaved ? (
                        <button
                            onClick={handleUnsaveDay}
                            className="w-full py-2 bg-green-100 text-green-700 border border-green-200 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Dia Salvo na Lista
                        </button>
                    ) : (
                        <button
                            onClick={handleOpenPlanDayModal}
                            className="w-full py-2 bg-brand-600 text-white shadow-md shadow-brand-200 rounded-lg font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
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
                                <button
                                    onClick={undoImport}
                                    className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg font-bold text-sm shadow-md"
                                >
                                    Clique para Restaurar Plano Anterior
                                </button>
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
                        const displayItems = customItems || selectedOption?.ingredients || [];

                        const isExpanded = expandedMeal === meal.id;

                        return (
                            <div key={meal.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <div
                                    className="p-4 flex items-center justify-between bg-gray-50 cursor-pointer"
                                    onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                                            <Apple className="w-5 h-5 text-brand-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{meal.name}</h4>
                                            {meal.time} • {getComputedMealCalories(meal, selectedDateKey)} kcal
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </div>

                                {isExpanded && (
                                    <div className="p-4 border-t border-gray-100">
                                        {/* Option Selector */}
                                        <div className="mb-4">
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Opção do Cardápio</label>
                                            <select
                                                value={selectedOptionIndex}
                                                onChange={(e) => handleSelectOption(meal.id, Number(e.target.value))}
                                                className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                                            >
                                                {options.map((opt, idx) => (
                                                    <option key={opt.id} value={idx}>{opt.name}</option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1 italic">{selectedOption?.description || ""}</p>
                                        </div>

                                        {/* Ingredients List */}
                                        <div className="space-y-2 mb-4">
                                            {displayItems.map((item, idx) => {
                                                const isExcluded = (excludedIngredients[`${selectedDateKey}_${meal.id}`] || []).includes(idx) && !customItems;

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`flex justify-between items-center text-sm p-2 rounded border border-gray-100 transition-all cursor-pointer ${isExcluded ? 'bg-gray-100 opacity-60' : 'bg-gray-50 hover:bg-gray-100'
                                                            }`}
                                                        onClick={() => !customItems && handleToggleIngredient(meal.id, idx)}
                                                        title={customItems ? "" : "Clique para riscar/incluir este item"}
                                                    >
                                                        <span className={`text-gray-700 ${isExcluded ? 'line-through text-gray-400' : ''}`}>
                                                            <span className="font-bold">{(item as FoodItem).portion || (item as any).amount}</span> {(item as FoodItem).name || (item as any).name}
                                                        </span>
                                                        {customItems && (
                                                            <button onClick={(e) => { e.stopPropagation(); handleRemoveFood(meal.id, idx); }} className="text-red-400 hover:text-red-600 p-1">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenFoodModal(meal.id)}
                                                className="flex-1 py-2 px-3 bg-white border border-brand-200 text-brand-700 text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-brand-50"
                                            >
                                                <Plus className="w-3 h-3" /> Adicionar Alimento
                                            </button>

                                            {customItems && customItems.length > 0 && (
                                                <button
                                                    onClick={(e) => handleSaveCustomOptionClick(meal.id, e)}
                                                    className="flex-1 py-2 px-3 bg-brand-100 text-brand-700 text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-brand-200"
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
                        className="w-full py-6 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition-all flex flex-col items-center justify-center gap-2 font-bold group"
                    >
                        <div className="bg-gray-50 p-2 rounded-full group-hover:bg-brand-100 transition-colors">
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
                <div className="bg-brand-600 text-white rounded-2xl p-6 shadow-lg shadow-brand-200">
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
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        <ShoppingBasket className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-center px-8 text-sm">Sua lista está vazia.</p>
                        <p className="text-center px-8 text-xs mt-2">Vá na aba <strong>Dieta</strong> e adicione dias ao seu planejamento para gerar a lista.</p>
                    </div>
                ) : (
                    <>
                        {/* List */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 flex justify-between">
                                <span>Itens Pendentes ({activeItems.length})</span>
                                <button onClick={handlePrint} className="text-gray-400 hover:text-gray-600">
                                    <Printer className="w-4 h-4" />
                                </button>
                            </div>

                            {activeItems.map((item, idx) => {
                                const key = `${item.name}__${item.unit}`;
                                return (
                                    <div key={key} className={`flex items-center p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors`}>
                                        <button
                                            onClick={() => handleToggleShoppingItem(key)}
                                            className="w-6 h-6 rounded border-2 border-gray-300 mr-4 flex items-center justify-center text-white hover:border-brand-400"
                                        >
                                        </button>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">{item.name}</p>
                                            <p className="text-xs text-gray-400">{item.category}</p>
                                        </div>
                                        <div className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-sm">
                                            {formatShoppingQuantity(item.quantity, item.unit)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Completed Items Accordion */}
                        {completedItemsList.length > 0 && (
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setShowCompletedItems(!showCompletedItems)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 text-gray-500 text-sm font-medium"
                                >
                                    <span>Itens Comprados ({completedItemsList.length})</span>
                                    {showCompletedItems ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                {showCompletedItems && (
                                    <div className="bg-gray-50/50">
                                        {completedItemsList.map((item) => {
                                            const key = `${item.name}__${item.unit}`;
                                            return (
                                                <div key={key} className="flex items-center p-4 border-t border-gray-100 opacity-60">
                                                    <button
                                                        onClick={() => handleToggleShoppingItem(key)}
                                                        className="w-6 h-6 rounded border-2 border-green-500 bg-green-500 mr-4 flex items-center justify-center text-white"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <div className="flex-1 line-through text-gray-500">
                                                        {item.name}
                                                    </div>
                                                    <div className="text-gray-400 text-sm">
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
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Central de Calendários</h2>
                        <p className="text-sm text-gray-500 mb-6">Escolha o que você deseja visualizar:</p>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => setCalendarMode('workout')}
                                className="bg-brand-50 hover:bg-brand-100 border border-brand-200 p-4 rounded-xl flex items-center gap-4 transition-colors group text-left"
                            >
                                <div className="bg-white p-3 rounded-full border border-brand-100 shadow-sm group-hover:scale-110 transition-transform">
                                    <Dumbbell className="w-6 h-6 text-brand-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-900">Histórico de Treinos</h3>
                                    <p className="text-xs text-brand-700">Veja sua constância e dias treinados.</p>
                                </div>
                                <ChevronRight className="ml-auto text-brand-400 w-5 h-5" />
                            </button>

                            <button
                                onClick={() => setCalendarMode('diet')}
                                className="bg-orange-50 hover:bg-orange-100 border border-orange-200 p-4 rounded-xl flex items-center gap-4 transition-colors group text-left"
                            >
                                <div className="bg-white p-3 rounded-full border border-orange-100 shadow-sm group-hover:scale-110 transition-transform">
                                    <Apple className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-orange-900">Planejamento de Dieta</h3>
                                    <p className="text-xs text-orange-700">Dias planejados e salvos.</p>
                                </div>
                                <ChevronRight className="ml-auto text-orange-400 w-5 h-5" />
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
                    <button onClick={() => setCalendarMode('menu')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 flex items-center gap-1 text-sm font-bold">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${isDiet ? 'bg-orange-100 text-orange-700' : 'bg-brand-100 text-brand-700'}`}>
                        {isDiet ? 'Calendário de Dieta' : 'Calendário de Treinos'}
                    </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    {/* Header Month Nav */}
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => {
                            const d = new Date(calendarMonth);
                            d.setMonth(d.getMonth() - 1);
                            setCalendarMonth(d);
                        }} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-6 h-6 text-gray-400" /></button>

                        <h3 className="font-bold text-gray-900 text-lg capitalize">{monthName} {year}</h3>

                        <button onClick={() => {
                            const d = new Date(calendarMonth);
                            d.setMonth(d.getMonth() + 1);
                            setCalendarMonth(d);
                        }} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight className="w-6 h-6 text-gray-400" /></button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                            <div key={i} className="text-xs font-bold text-gray-400">{d}</div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {blanks.map((_, i) => (
                            <div key={`blank-${i}`} className="h-10"></div>
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
                                    className={`h-12 rounded-lg flex flex-col items-center justify-center relative transition-all border 
                    ${isToday ? 'ring-1 ring-brand-100 font-bold' : ''}
                    ${isSelected ? (isDiet ? 'border-orange-500 bg-orange-50' : 'border-brand-500 bg-brand-50') : 'border-transparent hover:bg-gray-50'}
                    ${!isDiet && workoutLog.has(dKey) && !isSelected ? 'bg-green-50/50' : ''}
                    text-gray-700
                  `}
                                >
                                    <span className={`z-10 ${statusIndicator ? 'mb-2' : ''}`}>{day}</span>
                                    {statusIndicator}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className={`p-4 rounded-xl border ${isDiet ? 'bg-orange-50 border-orange-100' : 'bg-brand-50 border-brand-100'}`}>
                    <h4 className={`font-bold text-sm mb-2 flex items-center gap-2 ${isDiet ? 'text-orange-800' : 'text-brand-800'}`}>
                        <CalendarRange className="w-4 h-4" />
                        Legenda
                    </h4>
                    <div className="space-y-2 text-xs text-gray-600">
                        {isDiet ? (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Dia Planejado e Salvo</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded flex items-center justify-center text-[8px] font-bold text-green-800">T</div>
                                <span>Treino Realizado (com foco)</span>
                            </div>
                        )}
                        {isDiet ? (
                            <p className="mt-2 text-orange-700 italic">Clique em um dia para ver ou editar a dieta.</p>
                        ) : (
                            <p className="mt-2 text-brand-700 italic">Clique em um dia acima para ver os detalhes do treino.</p>
                        )}
                    </div>
                </div>

                {/* WORKOUT SUMMARY FOR SELECTED DATE (ONLY IN WORKOUT MODE) */}
                {!isDiet && selectedWorkoutExercises && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 mt-4">
                        <div className="bg-gray-50 p-4 border-b border-gray-100">
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                </p>
                                {isSelectedDayDone ? (
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Realizado
                                    </span>
                                ) : (
                                    selectedWorkoutExercises.length > 0 && <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">Pendente</span>
                                )}
                            </div>

                            <div>
                                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest block mb-0.5">Foco do Treino</span>
                                <h3 className="font-black text-gray-900 text-2xl flex items-center gap-2 leading-none">
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
        const stripPattern = new RegExp(`^(${daysToStrip.join('|')})(-feira)?(:)?\\s*`, 'i');

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
                        const sKey = `${dKey}_${meal.id}`;
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
            id: `meal-${Date.now()}`,
            name: mealName,
            time: "16:00",
            calories: 0,
            macros: { protein: 0, carbs: 0, fats: 0 },
            options: [
                {
                    id: `opt-${Date.now()}`,
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

    const renderSmartImportModal = () => {
        if (!isSmartImportModalOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
                <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                    <div className="p-6 bg-brand-600 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 animate-pulse text-amber-300" />
                            <div>
                                <h3 className="font-bold text-xl">Importação Inteligente</h3>
                                <p className="text-brand-100 text-xs">A IA montará seu plano automaticamente</p>
                            </div>
                        </div>
                        <button onClick={() => setIsSmartImportModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">
                        {importStatus === 'idle' && (
                            <div className="space-y-6">
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                                    <div className="bg-amber-100 p-2 rounded-lg h-fit">
                                        <Sparkles className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                        Tire uma foto, envie um **PDF** ou cole o texto que você recebeu. A IA montará seu plano automaticamente!
                                    </p>
                                </div>

                                {/* Info Card: Distribuição Semanal (Mandatória) */}
                                <div className="bg-brand-50 border border-brand-100 p-4 rounded-2xl flex items-start gap-4">
                                    <div className="bg-brand-100 p-2 rounded-xl">
                                        <CalendarRange className="w-5 h-5 text-brand-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">Distribuição Semanal</h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
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
                                        className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-brand-500 hover:bg-brand-50 transition-all text-gray-500 hover:text-brand-600 group"
                                    >
                                        <div className="bg-gray-100 p-3 rounded-full group-hover:bg-brand-100 transition-colors">
                                            <Camera className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-sm">Foto / PDF</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            const text = prompt("Cole aqui o texto do seu plano (dieta ou treino):");
                                            if (text) handleSmartImport(text, 'text');
                                        }}
                                        className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-brand-500 hover:bg-brand-50 transition-all text-gray-500 hover:text-brand-600 group"
                                    >
                                        <div className="bg-gray-100 p-3 rounded-full group-hover:bg-brand-100 transition-colors">
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
                                    <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
                                    <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400 animate-bounce" />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-gray-800 text-lg">Processando Plano...</p>
                                    <p className="text-sm text-gray-500 animate-pulse">Lendo seu arquivo com inteligência artificial</p>
                                </div>
                            </div>
                        )}

                        {importStatus === 'review' && importedPlan && (
                            <div className="space-y-6">
                                <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-green-800 font-bold">Resumo da Importação</p>
                                        <p className="text-xs text-green-600">Confira abaixo o que conseguimos extrair:</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <h4 className="text-xs font-black text-gray-400 uppercase mb-2">Nutrição</h4>
                                        <p className="text-sm font-bold text-gray-800">{(importedPlan.nutrition?.meals || []).length} Refeições</p>
                                        <p className="text-xs text-brand-600 font-medium">{importedPlan.nutrition?.targetCalories || 0} kcal diárias</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <h4 className="text-xs font-black text-gray-400 uppercase mb-2">Treino</h4>
                                        <p className="text-sm font-bold text-gray-800">{(importedPlan.workout?.weeklySchedule || []).filter(d => d.exercises && d.exercises.length > 0).length} Dias Ativos</p>
                                        <p className="text-xs text-indigo-600 font-medium">{importedPlan.workout?.methodology ? importedPlan.workout.methodology.substring(0, 30) : ''}...</p>
                                    </div>
                                </div>

                                <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 mb-4">
                                    <h4 className="text-[10px] font-black text-brand-700 uppercase mb-3">Escolha o que importar:</h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={importDietSelected}
                                                    onChange={e => setImportDietSelected(e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-10 h-6 rounded-full transition-colors ${importDietSelected ? 'bg-brand-600' : 'bg-gray-300'}`}></div>
                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${importDietSelected ? 'translate-x-4' : ''}`}></div>
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-gray-800">Importar Dieta</span>
                                                <p className="text-[10px] text-gray-500">Substitui sua dieta atual</p>
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
                                                <div className={`w-10 h-6 rounded-full transition-colors ${importWorkoutSelected ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${importWorkoutSelected ? 'translate-x-4' : ''}`}></div>
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-gray-800">Importar Treino</span>
                                                <p className="text-[10px] text-gray-500">Substitui seu treino atual</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Botão Limpar Dias */}
                                <button
                                    onClick={cleanDayNamesFromImportedPlan}
                                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-brand-600 hover:border-brand-200 transition-all text-xs font-bold"
                                >
                                    <Eraser className="w-4 h-4" /> Limpar Nomes de Dias das Opções
                                </button>

                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setImportStatus('idle')} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all">
                                        Tentar Novamente
                                    </button>
                                    <button onClick={confirmSmartImport} className="flex-1 py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 active:scale-95 transition-all">
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
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            {/* TOP BAR */}
            <div className="bg-white sticky top-0 z-20 border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-brand-600 text-white p-1.5 rounded-lg">
                        <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-none tracking-tight text-gray-900">FitCoach<span className="text-brand-600">Pro</span></h1>
                        <p className="text-[10px] text-gray-400 font-medium">PERSONAL AI TRAINER</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {(plan.nutrition?.meals?.length || 0) < 3 && !backupPlan && (
                        <button
                            onClick={handleRepairPlan}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-[10px] font-black uppercase border border-orange-200 animate-pulse hover:bg-orange-200 transition-all"
                        >
                            <RefreshCw className="w-3 h-3" /> Consertar Plano
                        </button>
                    )}
                    <button onClick={handleResetClick} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
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
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-4 flex justify-between items-center z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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
                            className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ${isActive ? 'text-brand-600 -translate-y-2' : 'text-gray-400'
                                }`}
                        >
                            <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-brand-50 shadow-brand-100 shadow-md' : 'bg-transparent'}`}>
                                <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
                            </div>
                            <span className={`text-[9px] font-bold ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* MODALS */}

            {/* ADD FOOD MODAL */}
            {isFoodModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Adicionar Alimento</h3>
                            <div className="flex items-center gap-2">
                                {currentMealIdForAdd && (
                                    <button
                                        onClick={() => startCamera(currentMealIdForAdd, 'log')}
                                        className="p-2 bg-brand-50 text-brand-600 rounded-full hover:bg-brand-100 transition-colors"
                                        title="Analisar foto do alimento"
                                    >
                                        <Camera className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={() => setFoodModalOpen(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Meal Selector inside Modal if none selected or for change */}
                        <div className="px-4 py-2 border-b border-gray-50 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <span className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">Destino:</span>
                            {(plan.nutrition?.meals || []).map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setCurrentMealIdForAdd(m.id)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${currentMealIdForAdd === m.id
                                        ? 'bg-brand-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                        <div className="flex p-1 bg-gray-100 rounded-lg mx-4 mb-2">
                            <button
                                onClick={() => setFoodModalMode('library')}
                                className={`flex-1 py-1.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${foodModalMode === 'library' ? 'bg-white shadow text-brand-600' : 'text-gray-500'
                                    }`}
                            >
                                <Search className="w-3.5 h-3.5" /> Buscar
                            </button>
                            <button
                                onClick={() => setFoodModalMode('manual')}
                                className={`flex-1 py-1.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${foodModalMode === 'manual' ? 'bg-white shadow text-brand-600' : 'text-gray-500'
                                    }`}
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
                                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-brand-500 focus:border-brand-500 outline-none"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
                                    {filteredFoods.map(food => (
                                        <button
                                            key={food.id}
                                            onClick={() => handleAddFood(food)}
                                            className="w-full flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div>
                                                <p className="font-bold text-gray-800">{food.name}</p>
                                                <p className="text-xs text-gray-500">{food.portion} • {food.calories} kcal</p>
                                            </div>
                                            <div className="bg-brand-50 text-brand-600 p-2 rounded-lg">
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
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-brand-500 outline-none font-bold"
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
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-brand-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Porção</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: 1 unidade"
                                            value={newManualFood.portion}
                                            onChange={(e) => setNewManualFood({ ...newManualFood, portion: e.target.value })}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-brand-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Macros Opcionais</p>
                                    <div className="flex gap-2">
                                        <div className="flex-1 text-center">
                                            <label className="block text-[10px] font-bold text-indigo-700 mb-1">Prot (g)</label>
                                            <input
                                                type="number"
                                                className="w-full p-2 text-center rounded-lg border border-gray-200 text-sm"
                                                value={newManualFood.protein}
                                                onChange={(e) => setNewManualFood({ ...newManualFood, protein: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex-1 text-center">
                                            <label className="block text-[10px] font-bold text-amber-700 mb-1">Carb (g)</label>
                                            <input
                                                type="number"
                                                className="w-full p-2 text-center rounded-lg border border-gray-200 text-sm"
                                                value={newManualFood.carbs}
                                                onChange={(e) => setNewManualFood({ ...newManualFood, carbs: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex-1 text-center">
                                            <label className="block text-[10px] font-bold text-rose-700 mb-1">Gord (g)</label>
                                            <input
                                                type="number"
                                                className="w-full p-2 text-center rounded-lg border border-gray-200 text-sm"
                                                value={newManualFood.fats}
                                                onChange={(e) => setNewManualFood({ ...newManualFood, fats: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddManualFood}
                                    disabled={!newManualFood.name || !newManualFood.calories}
                                    className="w-full py-3 bg-brand-600 font-bold rounded-xl text-white shadow-lg shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 transition-colors"
                                >
                                    Adicionar Alimento
                                </button>
                            </div>
                        )}
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
                            <div className="absolute bottom-24 left-4 right-4 bg-white rounded-xl p-4 shadow-2xl z-20 animate-in slide-in-from-bottom-10">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-900">{analyzedFood.name}</h3>
                                        <p className="text-sm text-gray-500">{analyzedFood.portion}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-black text-2xl text-brand-600">{analyzedFood.calories}</span>
                                        <span className="text-xs font-bold text-gray-400 uppercase">Kcal</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-4">
                                    <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold flex-1 text-center">P: {analyzedFood.protein}g</div>
                                    <div className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-bold flex-1 text-center">C: {analyzedFood.carbs}g</div>
                                    <div className="bg-rose-50 text-rose-700 px-2 py-1 rounded text-xs font-bold flex-1 text-center">G: {analyzedFood.fats}g</div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => startCamera(cameraTargetMealId, 'log')} className="flex-1 py-3 bg-gray-100 font-bold rounded-lg text-gray-600">Tentar Novamente</button>
                                    <button onClick={() => handleAddFood(analyzedFood)} className="flex-1 py-3 bg-brand-600 font-bold rounded-lg text-white shadow-lg">Adicionar</button>
                                </div>
                            </div>
                        )}

                        {/* RESULT: FRUIT ANALYSIS */}
                        {fruitAnalysis && !isAnalyzing && cameraMode === 'fruit' && (
                            <div className="absolute bottom-24 left-4 right-4 bg-white rounded-xl p-6 shadow-2xl z-20 animate-in slide-in-from-bottom-10 border border-green-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider bg-green-50 px-2 py-1 rounded-full border border-green-100">Resultado da Análise</span>
                                        <h3 className="font-bold text-2xl text-gray-900 mt-2">{fruitAnalysis.name}</h3>
                                    </div>
                                    <div className={`text-center px-3 py-2 rounded-lg ${fruitAnalysis.quality === 'Excelente' || fruitAnalysis.quality === 'Boa'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-red-100 text-red-600'
                                        }`}>
                                        <span className="block font-black text-sm">{fruitAnalysis.quality}</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="font-bold text-gray-700 text-sm mb-1">Doçura: <span className="text-gray-900">{fruitAnalysis.sweetness}</span></p>
                                    <p className="text-sm text-gray-600 leading-snug">{fruitAnalysis.details}</p>
                                </div>

                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <p className="text-xs font-bold text-blue-700 mb-1 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Dica de Especialista
                                    </p>
                                    <p className="text-xs text-blue-800">{fruitAnalysis.tips}</p>
                                </div>

                                <button onClick={() => startCamera(null, 'fruit')} className="w-full mt-4 py-3 bg-gray-900 font-bold rounded-xl text-white shadow-lg">
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
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Adicionar Exercício</h3>
                            <button onClick={() => setExerciseModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-1 bg-gray-100 rounded-lg mb-4">
                            <button
                                onClick={() => setExerciseModalMode('library')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${exerciseModalMode === 'library' ? 'bg-white shadow text-brand-600' : 'text-gray-500'
                                    }`}
                            >
                                <BookOpen className="w-4 h-4" /> Biblioteca
                            </button>
                            <button
                                onClick={() => setExerciseModalMode('manual')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${exerciseModalMode === 'manual' ? 'bg-white shadow text-brand-600' : 'text-gray-500'
                                    }`}
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
                                            className="w-full pl-9 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-brand-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen', 'Cardio'].map(group => (
                                            <button
                                                key={group}
                                                onClick={() => setSelectedMuscleGroup(group)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedMuscleGroup === group
                                                    ? 'bg-brand-100 text-brand-700 border border-brand-200'
                                                    : 'bg-gray-50 text-gray-500 border border-gray-200'
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
                                            className="w-full text-left p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors flex justify-between items-center group"
                                        >
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{ex.name}</p>
                                                <p className="text-xs text-gray-500">{ex.group}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500" />
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
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-brand-500 outline-none font-medium"
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
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-brand-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Repetições</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: 10-12"
                                            value={newExercise.reps}
                                            onChange={e => setNewExercise({ ...newExercise, reps: e.target.value })}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-brand-500 outline-none"
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
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-brand-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notas (Carga / Técnica)</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 20kg cada lado, descida lenta"
                                        value={newExercise.notes}
                                        onChange={e => setNewExercise({ ...newExercise, notes: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-brand-500 outline-none text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {exerciseModalMode === 'manual' && (
                            <div className="mt-4 pt-2 border-t border-gray-100">
                                <button
                                    onClick={handleAddExercise}
                                    disabled={!newExercise.name}
                                    className="w-full py-3 bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold rounded-xl text-white shadow-lg shadow-brand-200 hover:bg-brand-700 transition-colors"
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
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="font-bold text-lg mb-2">Salvar Opção Personalizada</h3>
                        <p className="text-sm text-gray-500 mb-4">Dê um nome para esta combinação de alimentos para usá-la facilmente depois.</p>
                        <input
                            type="text"
                            placeholder="Ex: Meu Café da Manhã Favorito"
                            value={newOptionName}
                            onChange={e => setNewOptionName(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl mb-4 focus:ring-brand-500 outline-none"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setSaveModalOpen(false)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600">Cancelar</button>
                            <button onClick={confirmSaveOption} className="flex-1 py-3 bg-brand-600 font-bold rounded-xl text-white shadow-lg shadow-brand-200">Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* PLAN DAY MODAL */}
            {isPlanDayModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4 text-brand-600">
                            <ShoppingBasket className="w-6 h-6" />
                            <h3 className="font-bold text-lg text-gray-900">Adicionar à Lista</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            Isso irá calcular os ingredientes necessários para as refeições deste dia e adicionar à sua lista de compras.
                        </p>

                        <label className="block text-sm font-bold text-gray-700 mb-2">Cozinhar para quantas pessoas?</label>
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={() => setHouseholdSizeInput(Math.max(1, householdSizeInput - 1))}
                                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            >
                                <span className="text-xl font-bold text-gray-600">-</span>
                            </button>
                            <span className="text-2xl font-bold text-gray-900 w-8 text-center">{householdSizeInput}</span>
                            <button
                                onClick={() => setHouseholdSizeInput(householdSizeInput + 1)}
                                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            >
                                <span className="text-xl font-bold text-gray-600">+</span>
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setPlanDayModalOpen(false)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600">Cancelar</button>
                            <button onClick={confirmPlanDay} className="flex-1 py-3 bg-brand-600 font-bold rounded-xl text-white shadow-lg shadow-brand-200">Confirmar</button>
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
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="font-bold text-xl mb-2 text-gray-800 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                            Meta de Déficit Calórico
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Defina quantas calorias você quer queimar a mais do que consome por dia.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-3">Déficit Diário (kcal)</label>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setDeficitGoal(Math.max(100, deficitGoal - 50))}
                                    className="w-12 h-12 rounded-full border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 active:scale-95 transition-all"
                                >
                                    <span className="text-2xl font-bold text-blue-600">-</span>
                                </button>
                                <div className="flex-1 text-center">
                                    <div className="text-4xl font-black text-blue-600">{deficitGoal}</div>
                                    <div className="text-xs text-gray-500 font-semibold">kcal/dia</div>
                                </div>
                                <button
                                    onClick={() => setDeficitGoal(Math.min(1000, deficitGoal + 50))}
                                    className="w-12 h-12 rounded-full border-2 border-blue-200 flex items-center justify-center hover:bg-blue-50 active:scale-95 transition-all"
                                >
                                    <span className="text-2xl font-bold text-blue-600">+</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl mb-6">
                            <div className="text-xs font-semibold text-blue-700 uppercase mb-2">Estimativa de Perda</div>
                            <div className="text-sm text-blue-900">
                                <strong>{(deficitGoal * 7 / 7700).toFixed(2)} kg/semana</strong>
                                <div className="text-xs text-blue-600 mt-1">
                                    (baseado em déficit de {deficitGoal} kcal/dia)
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeficitModalOpen(false)}
                                className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={() => setIsDeficitModalOpen(false)}
                                className="flex-1 py-3 bg-blue-600 font-bold rounded-xl text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {renderSmartImportModal()}

        </div>
    );
};