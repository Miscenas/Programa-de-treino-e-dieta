# Configurando Edge Functions do Supabase

## Por que usar Edge Functions?

✅ **Segurança**: Sua chave API do Gemini não fica exposta no frontend
✅ **Performance**: Processamento no servidor, reduzindo carga no cliente  
✅ **Escalabilidade**: Supabase gerencia a infraestrutura
✅ **Custo**: Edge Functions têm generoso plano gratuito

## Passos para configurar:

### 1. Instalar Supabase CLI
```bash
npm install -g supabase
```

### 2. Fazer login no Supabase
```bash
supabase login
```

### 3. Linkar ao seu projeto
```bash
supabase link --project-ref sngqsvienplvwlchpips
```

### 4. Configurar variáveis de ambiente
```bash
supabase secrets set GEMINI_API_KEY=AIzaSyDaHTK5tO1qS0QKUsXtgOb95eSxNKBz0cw
```

### 5. Deploy das Edge Functions
```bash
supabase functions deploy generate-plan
```

## Estrutura criada:

```
supabase/
└── functions/
    └── generate-plan/
        ├── index.ts       # Lógica da Edge Function
        └── deno.json     # Dependências do Deno
```

## Como funciona:

1. **Frontend** chama `EdgeFunctionService.generatePlan()`
2. **Supabase** executa a Edge Function com segurança
3. **Edge Function** usa a chave API do Gemini (armazenada no servidor)
4. **Resposta** retorna o plano gerado em formato JSON

## Teste local:

```bash
supabase functions serve generate-plan
```

## Monitoramento:

Acesse o dashboard do Supabase > Edge Functions para ver logs e métricas.
