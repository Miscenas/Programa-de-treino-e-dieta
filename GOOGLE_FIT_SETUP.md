# 🚀 Guia de Configuração - Google Fit Integration

Este guia explica como configurar a integração com o Google Fit para sincronizar dados de atividade física no FitCoach Pro.

## 📋 Pré-requisitos

- Conta Google
- Projeto FitCoach Pro rodando localmente
- Acesso ao Google Cloud Console

## 🔧 Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Clique em **"Select a project"** → **"New Project"**
3. Nome do projeto: `fitcoach-pro-google-fit` (ou outro nome de sua preferência)
4. Clique em **"Create"**

### 2. Ativar Google Fit API

1. No menu lateral, vá em **"APIs & Services"** → **"Library"**
2. Pesquise por **"Fitness API"**
3. Clique em **"Fitness API"** e depois em **"Enable"**
4. Aguarde a ativação (pode levar alguns segundos)

### 3. Configurar OAuth 2.0 Credentials

#### 3.1 Configurar Tela de Consentimento

1. Vá em **"APIs & Services"** → **"OAuth consent screen"**
2. Selecione **"External"** (para testes) e clique em **"Create"**
3. Preencha as informações obrigatórias:
   - **App name**: FitCoach Pro
   - **User support email**: seu email
   - **Developer contact information**: seu email
4. Clique em **"Save and Continue"**
5. Na página **"Scopes"**:
   - **IMPORTANTE**: Você pode pular esta etapa clicando em **"Save and Continue"**
   - Os escopos serão solicitados automaticamente pelo código quando o usuário fizer login
   - ⚠️ Se quiser adicionar manualmente (opcional):
     - Role a página até o final
     - Clique em **"Add or Remove Scopes"** (pode estar no rodapé)
     - Pesquise por "fitness" e selecione os escopos
6. Clique em **"Save and Continue"**
7. Em **"Test users"**, clique em **"Add Users"**
8. Adicione seu email do Google e clique em **"Add"**
9. Clique em **"Save and Continue"** e depois **"Back to Dashboard"**

#### 3.2 Criar Credenciais OAuth

1. Vá em **"APIs & Services"** → **"Credentials"**
2. Clique em **"Create Credentials"** → **"OAuth client ID"**
3. Selecione **"Web application"**
4. Preencha:
   - **Name**: FitCoach Pro Web Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (Vite dev server)
     - `http://localhost:3000` (se usar outra porta)
   - **Authorized redirect URIs**: 
     - `http://localhost:5173`
     - `http://localhost:3000`
5. Clique em **"Create"**
6. **IMPORTANTE**: Copie o **Client ID** que aparece na tela

### 4. Configurar Variáveis de Ambiente

1. Abra o arquivo `.env.local` na raiz do projeto (ou crie se não existir)
2. Adicione a seguinte linha:

```bash
REACT_APP_GOOGLE_CLIENT_ID=seu-client-id-aqui
```

3. Substitua `seu-client-id-aqui` pelo Client ID copiado no passo anterior
4. Salve o arquivo

**Exemplo de `.env.local` completo:**

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
GEMINI_API_KEY=sua-chave-gemini-aqui
REACT_APP_GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
```

### 5. Aplicar Migration no Supabase

A tabela `smartwatch_data` precisa ser criada no Supabase:

#### Opção A: Via Supabase MCP (Recomendado)

Se você tem o Supabase MCP configurado, execute:

```bash
# A migration será aplicada automaticamente
```

#### Opção B: Via SQL Editor no Supabase Dashboard

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **"SQL Editor"**
4. Copie e cole o conteúdo do arquivo `supabase/migrations/20260111_create_smartwatch_data.sql`
5. Clique em **"Run"**

### 6. Reiniciar o Servidor de Desenvolvimento

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

## ✅ Testar a Integração

1. Abra o aplicativo no navegador
2. Faça login
3. Na tela **Overview**, você verá um botão **"Sincronizar Google Fit"**
4. Clique no botão **"Importar"**
5. Uma janela popup do Google aparecerá solicitando permissões
6. Autorize o acesso aos dados do Google Fit
7. Aguarde a importação (pode levar alguns segundos)
8. Você verá uma mensagem de sucesso com o número de dias importados

## 🔍 Troubleshooting

### Erro: "REACT_APP_GOOGLE_CLIENT_ID não configurado"

**Solução**: Verifique se você adicionou a variável de ambiente no arquivo `.env.local` e reiniciou o servidor.

### Erro: "Redirect URI mismatch"

**Solução**: Certifique-se de que a URL no navegador (`http://localhost:5173`) está listada nas **Authorized redirect URIs** no Google Cloud Console.

### Erro: "Access blocked: This app's request is invalid"

**Solução**: 
1. Verifique se você configurou a **OAuth consent screen**
2. Certifique-se de que adicionou seu email em **Test users**
3. Verifique se os escopos foram adicionados corretamente

### Dados não aparecem no Supabase

**Solução**:
1. Verifique se a migration foi aplicada corretamente
2. Abra o Supabase Dashboard → **Table Editor** → Procure pela tabela `smartwatch_data`
3. Verifique se há dados inseridos

### Popup do Google não abre

**Solução**:
1. Verifique se o navegador não está bloqueando popups
2. Tente usar o navegador em modo anônimo
3. Limpe o cache e cookies do navegador

## 💰 Custos

- **Google Fit API**: ✅ **GRATUITO** (sem custos)
- **Google Cloud Project**: ✅ **GRATUITO** (para uso pessoal/teste)
- **Supabase**: Depende do seu plano (tabela adicional)

## 📊 Dados Importados

A integração importa os seguintes dados dos últimos 30 dias:

- **Passos diários** (steps)
- **Calorias queimadas** (calories_burned)
- **Data** (date)
- **Fonte** (source: 'google_fit_import')

## 🔒 Segurança

- Os dados são armazenados no Supabase com **Row Level Security (RLS)** ativado
- Cada usuário só pode ver seus próprios dados
- O Client ID do Google é público (não é uma chave secreta)
- Nunca compartilhe suas chaves do Supabase ou Gemini API

## 📚 Recursos Adicionais

- [Google Fit API Documentation](https://developers.google.com/fit)
- [OAuth 2.0 for Web Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

---

**Pronto!** 🎉 Sua integração com o Google Fit está configurada e funcionando!
