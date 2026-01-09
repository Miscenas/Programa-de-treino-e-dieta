import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { NutritionDashboard } from './components/NutritionDashboard';
import { Login } from './components/Login';
import { UserProfile, FullPlan } from './types';
import { EdgeFunctionService } from './services/edgeFunctionService';
import { AuthService, AuthUser } from './services/authService';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<FullPlan | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'nutrition'>('dashboard');

  // Check authentication state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        setAuthUser(currentUser);

        if (currentUser) {
          // Load user data from localStorage for now
          const savedUser = localStorage.getItem('fitcoach_user');
          const savedPlan = localStorage.getItem('fitcoach_plan');

          if (savedUser && savedPlan) {
            setUser(JSON.parse(savedUser));
            setPlan(JSON.parse(savedPlan));
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const setupAuthListener = async () => {
      const { data: { subscription } } = await AuthService.onAuthStateChange((user) => {
        setAuthUser(user);
        if (!user) {
          // Clear local data when user logs out
          setUser(null);
          setPlan(null);
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('fitcoach_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      });
      return subscription;
    };

    setupAuthListener().then(subscription => {
      return () => subscription.unsubscribe();
    });
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      await AuthService.signIn(email, password);
    } catch (error) {
      throw error;
    }
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    try {
      await AuthService.signUp(email, password, name);
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setLoading(true);
    
    try {
      // Generate plan using Edge Function (more secure)
      const generatedPlan = await EdgeFunctionService.generatePlan(profile);
      
      setUser(profile);
      setPlan(generatedPlan);

      // Persist
      localStorage.setItem('fitcoach_user', JSON.stringify(profile));
      localStorage.setItem('fitcoach_plan', JSON.stringify(generatedPlan));
      
    } catch (error) {
      console.error('Error generating plan:', error);
      // Fallback to local generation if Edge Function fails
      const { generatePlan } = await import('./services/expertSystem');
      const fallbackPlan = generatePlan(profile);
      
      setUser(profile);
      setPlan(fallbackPlan);

      localStorage.setItem('fitcoach_user', JSON.stringify(profile));
      localStorage.setItem('fitcoach_plan', JSON.stringify(fallbackPlan));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    handleLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
        <p className="text-brand-800 font-medium animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (!authUser) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} />;
  }

  if (!user || !plan) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div>
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                🍽️ FitCoach Pro
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'dashboard'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Plano de Treino
              </button>
              <button
                onClick={() => setCurrentView('nutrition')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'nutrition'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Nutrição
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-900"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-screen bg-gray-50">
        {currentView === 'dashboard' ? (
          <Dashboard user={user} plan={plan} onReset={handleReset} />
        ) : (
          <NutritionDashboard />
        )}
      </div>
    </div>
  );
};

export default App;