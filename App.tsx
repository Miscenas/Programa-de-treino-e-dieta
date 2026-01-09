import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { UserProfile, FullPlan } from './types';
import { generatePlan } from './services/expertSystem';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<FullPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate loading checking local storage
  useEffect(() => {
    const savedUser = localStorage.getItem('fitcoach_user');
    const savedPlan = localStorage.getItem('fitcoach_plan');

    if (savedUser && savedPlan) {
      setUser(JSON.parse(savedUser));
      setPlan(JSON.parse(savedPlan));
    }
    setLoading(false);
  }, []);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setLoading(true);
    // Simulate complex calculation processing time
    setTimeout(() => {
      const generatedPlan = generatePlan(profile);
      
      setUser(profile);
      setPlan(generatedPlan);

      // Persist
      localStorage.setItem('fitcoach_user', JSON.stringify(profile));
      localStorage.setItem('fitcoach_plan', JSON.stringify(generatedPlan));
      
      setLoading(false);
    }, 1500);
  };

  const handleReset = () => {
    // Limpa TUDO relacionado ao app para evitar inconsistências
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fitcoach_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    setUser(null);
    setPlan(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
        <p className="text-brand-800 font-medium animate-pulse">Preparando seu plano personalizado...</p>
      </div>
    );
  }

  if (!user || !plan) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return <Dashboard user={user} plan={plan} onReset={handleReset} />;
};

export default App;