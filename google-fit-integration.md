# 🚀 INstruções de Implementação Google Fit

## ✅ O que já foi criado:
- `services/googleFitWebService.ts` - Serviço completo para Google Fit
- `services/workoutService.ts` - Serviço para treinos

## 🔧 Passos para finalizar:

### 1. Adicionar imports no Dashboard.tsx
Adicionar estas linhas após os imports existentes:

```typescript
import { GoogleFitWebService } from '../services/googleFitWebService';
import { supabase } from '../services/supabaseClient';
import { Activity } from 'lucide-react';
```

### 2. Adicionar estado no Dashboard.tsx
Após os estados existentes, adicionar:

```typescript
// Google Fit Import State
const [importingGoogleFit, setImportingGoogleFit] = useState(false);
```

### 3. Adicionar função handleGoogleFitImport
Após as funções existentes, adicionar:

```typescript
// Function to handle Google Fit import
const handleGoogleFitImport = async () => {
    setImportingGoogleFit(true);
    
    try {
        // Conectar com Google Fit
        await GoogleFitWebService.connect();
        
        // Importar dados dos últimos 30 dias
        const data = await GoogleFitWebService.importData(30);
        
        // Salvar no Supabase
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
        console.log('Google Fit data imported successfully:', data);
        
    } catch (error) {
        console.error('Erro ao importar Google Fit:', error);
        alert('Falha ao importar dados do Google Fit. Tente novamente.');
    } finally {
        setImportingGoogleFit(false);
    }
};
```

### 4. Adicionar botão no renderOverview
No início da função renderOverview, adicionar o botão:

```typescript
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
```

## 🌐 Configuração Google Cloud

### 1. Criar Projeto
- Acessar: https://console.cloud.google.com
- Criar novo projeto: "fitcoach-pro-google-fit"

### 2. Ativar APIs
- Ativar: "Google Fit API"
- Ativar: "Fitness API"

### 3. Configurar OAuth 2.0
- Tipo: "Aplicativo Web"
- Nome: "FitCoach Pro Google Fit"
- URIs de redirecionamento: http://localhost:3000
- Escopos:
  - https://www.googleapis.com/auth/fitness.activity.read
  - https://www.googleapis.com/auth/fitness.body.read
  - https://www.googleapis.com/auth/fitness.location.read

### 4. Configurar Variáveis de Ambiente
Criar `.env.local` com:
```
REACT_APP_GOOGLE_CLIENT_ID=seu-client-id-aqui
```

## 📋 Tabela Supabase Necessária

A tabela `smartwatch_data` deve existir com:
```sql
CREATE TABLE IF NOT EXISTS smartwatch_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    steps INTEGER,
    calories_burned INTEGER,
    source TEXT DEFAULT 'google_fit_import',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎯 Fluxo Completo

1. Usuário clica em "Importar Google Fit"
2. Login com Google (OAuth)
3. Importação dos últimos 30 dias
4. Salvar automaticamente no Supabase
5. Feedback visual de sucesso/erro

## 💰 Custos

- **API Google Fit**: GRÁTIS
- **Implementação**: R$ 0 (já feito)
- **Infraestrutura**: R$ 0 (usa Supabase existente)

---

**PRONTO PARA USO!** 🚀
