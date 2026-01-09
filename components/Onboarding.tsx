import React, { useState, useEffect } from 'react';
import { UserProfile, Gender, Goal, ActivityLevel, ExperienceLevel, WorkoutSplit } from '../types';
import { ChevronRight, ChevronLeft, Check, CalendarDays } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const steps = [
  "Básico",
  "Corpo",
  "Objetivo",
  "Atividade",
  "Treino",
  "Nutrição"
];

const WEEKDAYS = [
  { id: 0, label: 'D', name: 'Domingo' },
  { id: 1, label: 'S', name: 'Segunda' },
  { id: 2, label: 'T', name: 'Terça' },
  { id: 3, label: 'Q', name: 'Quarta' },
  { id: 4, label: 'Q', name: 'Quinta' },
  { id: 5, label: 'S', name: 'Sexta' },
  { id: 6, label: 'S', name: 'Sábado' },
];

export const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    age: 30,
    gender: Gender.Male,
    height: 170,
    weight: 70,
    goal: Goal.WeightLoss,
    activityLevel: ActivityLevel.Sedentary,
    experienceLevel: ExperienceLevel.Beginner,
    workoutFrequency: 3,
    workoutDays: [1, 3, 5], // Default Seg, Qua, Sex
    workoutSplit: WorkoutSplit.FullBody, 
    foodPreferences: [],
    foodRestrictions: []
  });

  // Atualiza dias sugeridos e Split quando a frequência muda
  const updateFrequencyAndDays = (freq: number) => {
    let defaultSplit = WorkoutSplit.FullBody;
    let suggestedDays: number[] = [];

    // Lógica de Sugestão de Dias
    if (freq === 2) {
      defaultSplit = WorkoutSplit.FullBody;
      suggestedDays = [1, 4]; // Seg, Qui
    } else if (freq === 3) {
      defaultSplit = WorkoutSplit.ABC;
      suggestedDays = [1, 3, 5]; // Seg, Qua, Sex
    } else if (freq === 4) {
      defaultSplit = WorkoutSplit.AB;
      suggestedDays = [1, 2, 4, 5]; // Seg, Ter, Qui, Sex
    } else if (freq === 5) {
      defaultSplit = WorkoutSplit.ABCDE;
      suggestedDays = [1, 2, 3, 4, 5]; // Seg a Sex
    } else if (freq === 6) {
      defaultSplit = WorkoutSplit.PPL_2X;
      suggestedDays = [1, 2, 3, 4, 5, 6]; // Seg a Sáb
    }

    setFormData(prev => ({ 
      ...prev, 
      workoutFrequency: freq,
      workoutDays: suggestedDays,
      workoutSplit: defaultSplit 
    }));
  };

  const toggleDay = (dayId: number) => {
    const currentDays = formData.workoutDays || [];
    const freq = formData.workoutFrequency || 0;
    
    let newDays: number[];
    if (currentDays.includes(dayId)) {
      // Remover dia
      newDays = currentDays.filter(d => d !== dayId);
    } else {
      // Adicionar dia (se não ultrapassar frequência)
      if (currentDays.length < freq) {
        newDays = [...currentDays, dayId].sort();
      } else {
        // Se já estiver cheio, substitui o último ou apenas avisa (aqui vamos impedir adicionar)
        alert(`Você definiu ${freq} dias de treino. Desmarque um dia antes de selecionar outro.`);
        return;
      }
    }
    setFormData(prev => ({ ...prev, workoutDays: newDays }));
  };

  const handleNext = () => {
    // Validação extra no passo de treino
    if (currentStep === 4) {
      const freq = formData.workoutFrequency || 0;
      const daysCount = formData.workoutDays?.length || 0;
      if (daysCount !== freq) {
        alert(`Por favor, selecione exatamente ${freq} dias para treinar.`);
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(formData as UserProfile);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Step Components ---

  const renderBasicInfo = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <label className="block text-sm font-medium text-gray-700">Seu Nome</label>
        <input 
          type="text" 
          value={formData.name}
          onChange={e => updateField('name', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3"
          placeholder="Ex: João Silva"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Idade</label>
        <input 
          type="number" 
          value={formData.age}
          onChange={e => updateField('age', Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Sexo Biológico</label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {[Gender.Male, Gender.Female].map(g => (
            <button
              key={g}
              onClick={() => updateField('gender', g)}
              className={`p-3 rounded-lg border text-center transition-all ${
                formData.gender === g 
                  ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold ring-1 ring-brand-500' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {g === Gender.Male ? 'Masculino' : 'Feminino'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">*Usado para calcular a Taxa Metabólica Basal.</p>
      </div>
    </div>
  );

  const renderBodyStats = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <label className="block text-sm font-medium text-gray-700">Altura (cm)</label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <input 
            type="number" 
            value={formData.height}
            onChange={e => updateField('height', Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 focus:border-brand-500 focus:ring-brand-500 border p-3 pr-12"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 sm:text-sm">cm</span>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Peso Atual (kg)</label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <input 
            type="number" 
            value={formData.weight}
            onChange={e => updateField('weight', Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 focus:border-brand-500 focus:ring-brand-500 border p-3 pr-12"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 sm:text-sm">kg</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGoal = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <h3 className="text-lg font-medium text-gray-900">Qual é o seu objetivo principal?</h3>
      <div className="space-y-3">
        {[
          { val: Goal.WeightLoss, label: 'Emagrecer & Definir', desc: 'Perder gordura mantendo massa magra' },
          { val: Goal.MuscleGain, label: 'Ganhar Massa Muscular', desc: 'Aumentar volume e força' }
        ].map(opt => (
          <button
            key={opt.val}
            onClick={() => updateField('goal', opt.val)}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              formData.goal === opt.val
                ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500'
                : 'bg-white border-gray-200 hover:border-brand-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-bold ${formData.goal === opt.val ? 'text-brand-900' : 'text-gray-900'}`}>{opt.label}</p>
                <p className="text-sm text-gray-500">{opt.desc}</p>
              </div>
              {formData.goal === opt.val && <Check className="w-5 h-5 text-brand-600" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <h3 className="text-lg font-medium text-gray-900">Nível de Atividade Diária</h3>
      <p className="text-sm text-gray-500">Sem contar os treinos na academia.</p>
      <div className="space-y-2">
        {[
          { val: ActivityLevel.Sedentary, label: 'Sedentário', desc: 'Trabalho de escritório, pouco movimento' },
          { val: ActivityLevel.LightlyActive, label: 'Levemente Ativo', desc: 'Caminhadas leves, trabalho em pé as vezes' },
          { val: ActivityLevel.ModeratelyActive, label: 'Moderado', desc: 'Movimento constante durante o dia' },
          { val: ActivityLevel.VeryActive, label: 'Muito Ativo', desc: 'Trabalho braçal ou muito esporte' }
        ].map(opt => (
          <button
            key={opt.val}
            onClick={() => updateField('activityLevel', opt.val)}
            className={`w-full p-3 rounded-lg border text-left text-sm transition-all ${
              formData.activityLevel === opt.val
                ? 'bg-brand-50 border-brand-500 text-brand-900'
                : 'bg-white border-gray-200 text-gray-700'
            }`}
          >
            <span className="font-bold">{opt.label}:</span> {opt.desc}
          </button>
        ))}
      </div>
    </div>
  );

  const renderWorkout = () => {
    const freq = formData.workoutFrequency || 3;
    const selectedDays = formData.workoutDays || [];
    const missingDays = freq - selectedDays.length;
    
    // Define available splits based on frequency
    let availableSplits: { val: WorkoutSplit, label: string, desc: string }[] = [];

    if (freq === 2) {
      availableSplits = [
        { val: WorkoutSplit.FullBody, label: 'Full Body (AB)', desc: 'Treina o corpo todo em cada sessão.' }
      ];
    } else if (freq === 3) {
      availableSplits = [
        { val: WorkoutSplit.FullBody, label: 'Full Body 3x', desc: 'Foco em frequência e aprendizado motor. Ideal para iniciantes.' },
        { val: WorkoutSplit.ABC, label: 'ABC (Push/Pull/Legs)', desc: 'Divide em Empurrar, Puxar e Pernas. Ideal para intermediários.' }
      ];
    } else if (freq === 4) {
      availableSplits = [
        { val: WorkoutSplit.AB, label: 'Upper / Lower (AB 2x)', desc: 'Dois dias de superiores e dois de inferiores. Equilíbrio perfeito.' },
        { val: WorkoutSplit.ABCD, label: 'ABCD (Grupos Musculares)', desc: 'Mais volume por músculo. Ex: A(Peito/Tríceps), B(Costas/Bíceps)...' }
      ];
    } else if (freq === 5) {
      availableSplits = [
         { val: WorkoutSplit.ABCDE, label: 'ABCDE (Um grupo por dia)', desc: 'Foco máximo em cada músculo. Estilo Bodybuilder clássico.' },
         { val: WorkoutSplit.ABC, label: 'ABC Rotativo (PPL)', desc: 'Treino sequencial (A, B, C, A, B...). Maior frequência de estímulos.' }
      ];
    } else {
      availableSplits = [
        { val: WorkoutSplit.PPL_2X, label: 'ABC 2x (Push/Pull/Legs)', desc: 'Alta frequência e alto volume. Para avançados.' }
      ];
    }

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div>
          <label className="block text-lg font-medium text-gray-900 mb-2">Nível de Experiência</label>
          <div className="grid grid-cols-1 gap-3">
            {[ExperienceLevel.Beginner, ExperienceLevel.Intermediate, ExperienceLevel.Advanced].map(lvl => (
              <button
                key={lvl}
                onClick={() => updateField('experienceLevel', lvl)}
                className={`p-3 rounded-lg border text-center capitalize transition-all ${
                  formData.experienceLevel === lvl 
                  ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold' 
                  : 'bg-white border-gray-200'
                }`}
              >
                {lvl === ExperienceLevel.Beginner ? 'Iniciante ( < 6 meses)' : 
                 lvl === ExperienceLevel.Intermediate ? 'Intermediário (6 meses - 2 anos)' : 'Avançado ( > 2 anos)'}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <label className="block text-lg font-medium text-gray-900 mb-2">Frequência Semanal</label>
          <input 
            type="range" 
            min="2" 
            max="6" 
            step="1"
            value={formData.workoutFrequency}
            onChange={e => updateFrequencyAndDays(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
          <div className="text-center font-bold text-3xl text-brand-600 mt-2">
            {formData.workoutFrequency} treinos / semana
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
            <div className="flex justify-between items-center mb-4">
               <label className="block text-lg font-medium text-gray-900">Dias de Treino</label>
               <span className={`text-xs font-bold px-2 py-1 rounded ${missingDays === 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {missingDays === 0 ? 'Completo' : `Selecione mais ${missingDays}`}
               </span>
            </div>
            
            <p className="text-sm text-gray-500 mb-3">
               Os dias não marcados serão considerados <strong className="text-gray-700">Descanso</strong>.
            </p>

            <div className="flex justify-between gap-1">
               {WEEKDAYS.map((day) => {
                 const isSelected = selectedDays.includes(day.id);
                 return (
                   <button
                     key={day.id}
                     onClick={() => toggleDay(day.id)}
                     className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                        isSelected 
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-200 scale-105' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                     }`}
                   >
                     {day.label}
                   </button>
                 )
               })}
            </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
           <label className="block text-lg font-medium text-gray-900 mb-3">Estilo de Divisão</label>
           <div className="space-y-3">
             {availableSplits.map((opt) => (
                <button
                key={opt.val}
                onClick={() => updateField('workoutSplit', opt.val)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  formData.workoutSplit === opt.val
                    ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500'
                    : 'bg-white border-gray-200 hover:border-brand-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-bold ${formData.workoutSplit === opt.val ? 'text-brand-900' : 'text-gray-900'}`}>{opt.label}</p>
                    <p className="text-sm text-gray-500">{opt.desc}</p>
                  </div>
                  {formData.workoutSplit === opt.val && <Check className="w-5 h-5 text-brand-600" />}
                </div>
              </button>
             ))}
           </div>
        </div>
      </div>
    );
  };

  const renderNutrition = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">O que você EVITA comer? (Restrições)</label>
        <div className="flex flex-wrap gap-2">
          {['Leite', 'Ovos', 'Carne Vermelha', 'Peixe', 'Glúten', 'Amendoim'].map(item => {
            const isSelected = formData.foodRestrictions?.includes(item);
            return (
              <button
                key={item}
                onClick={() => {
                  const current = formData.foodRestrictions || [];
                  updateField('foodRestrictions', isSelected 
                    ? current.filter(i => i !== item)
                    : [...current, item]
                  );
                }}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  isSelected
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-white border-gray-300 text-gray-600'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="font-bold text-yellow-800 text-sm mb-1">Nota do Nutricionista IA</h4>
        <p className="text-xs text-yellow-700">
          Seu plano será calculado automaticamente baseado nas suas respostas anteriores. Certifique-se que seus dados de peso e altura estão corretos.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-8 pb-4">
        <h1 className="text-2xl font-bold text-brand-900">Vamos criar seu plano</h1>
        <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-500 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-right">Passo {currentStep + 1} de {steps.length}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-2 overflow-y-auto">
        {currentStep === 0 && renderBasicInfo()}
        {currentStep === 1 && renderBodyStats()}
        {currentStep === 2 && renderGoal()}
        {currentStep === 3 && renderActivity()}
        {currentStep === 4 && renderWorkout()}
        {currentStep === 5 && renderNutrition()}
      </div>

      {/* Footer Nav */}
      <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0">
        <div className="flex gap-4">
          <button 
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex-1 py-3 px-4 rounded-xl border font-semibold flex items-center justify-center gap-2 ${
              currentStep === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>
          <button 
            onClick={handleNext}
            className="flex-[2] py-3 px-4 rounded-xl bg-brand-600 text-white font-semibold shadow-lg shadow-brand-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            {currentStep === steps.length - 1 ? 'Gerar Plano' : 'Próximo'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};