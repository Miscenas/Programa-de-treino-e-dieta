// 🚀 IMPLEMENTAÇÃO GOOGLE FIT - VERSÃO SIMPLES
// Copie e cole estes trechos de código no Dashboard.tsx

// 1. ADICIONE ESTES IMPORTS (após os imports existentes)
import { GoogleFitWebService } from '../services/googleFitWebService';
import { supabase } from '../services/supabaseClient';
import { Activity } from 'lucide-react';

// 2. ADICIONE ESTE ESTADO (após os estados existentes)
const [importingGoogleFit, setImportingGoogleFit] = useState(false);

// 3. ADICIONE ESTA FUNÇÃO (após as funções existentes)
const handleGoogleFitImport = async () => {
    setImportingGoogleFit(true);
    
    try {
        await GoogleFitWebService.connect();
        const data = await GoogleFitWebService.importData(30);
        
        for (let i = 0; i < data.steps.length; i++) {
            const stepData = data.steps[i];
            const calorieData = data.calories.find(c => c.date === stepData.date);
            
            await supabase.from('smartwatch_data').insert({
                user_id: user.id || 'demo-user',
                date: stepData.date,
                steps: stepData.steps,
                calories_burned: calorieData?.calories || 0,
                source: 'google_fit_import',
                created_at: new Date().toISOString()
            });
        }
        
        alert('Dados do Google Fit importados com sucesso!');
        
    } catch (error) {
        console.error('Erro ao importar Google Fit:', error);
        alert('Falha ao importar dados do Google Fit. Tente novamente.');
    } finally {
        setImportingGoogleFit(false);
    }
};

// 4. ADICIONE ESTE BOTÃO (no início da função renderOverview)
// Substitua o return existente por:
return (
    <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, {user.name}!</h1>
            <p className="text-gray-600">Vamos começar com seus objetivos de {user.goal === 'WEIGHT_LOSS' ? 'perda de peso' : 'ganho de massa muscular'}.</p>
        </div>
        <div className="flex items-center gap-3">
            <button
                onClick={handleGoogleFitImport}
                disabled={importingGoogleFit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {importingGoogleFit ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Importando Google Fit...</span>
                    </>
                ) : (
                    <>
                        <Activity className="w-4 h-4" />
                        <span>Importar Google Fit</span>
                    </>
                )}
            </button>
        </div>
    </div>
    // Continue com o resto do conteúdo existente...
);

// ✅ PRONTO! Google Fit integrado com sucesso!
