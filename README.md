# FitCoach Pro

Aplicação de fitness personalizada com planos de treino e nutrição gerados por IA.

## Funcionalidades

- 🏋️‍♂️ Planos de treino personalizados baseados no perfil do usuário
- 🥗 Planos nutricionais com cálculo de calorias e macronutrientes
- 🔐 Autenticação de usuários com Supabase
- 📱 Interface responsiva e moderna
- 🎯 Sistema de onboarding para coleta de dados do usuário

## Tecnologias

- React 19 com TypeScript
- Vite para desenvolvimento
- TailwindCSS para estilização
- Supabase para autenticação e banco de dados
- Lucide React para ícones
- Google Generative AI para geração de planos

## Configuração

### 1. Clonar o repositório

```bash
git clone https://github.com/Miscenas/Programa-de-treino-e-dieta.git
cd Programa-de-treino-e-dieta
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Copie as credenciais do projeto
3. Execute o script SQL em `database/schema.sql` no SQL Editor do Supabase
4. Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 4. Executar o projeto

```bash
npm run dev
```

## Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── Login.tsx      # Tela de login/cadastro
│   ├── Onboarding.tsx # Tela de onboarding
│   └── Dashboard.tsx  # Dashboard principal
├── services/          # Serviços e integrações
│   ├── authService.ts # Serviço de autenticação
│   ├── supabaseClient.ts # Cliente Supabase
│   ├── expertSystem.ts # Sistema especialista
│   ├── exerciseDatabase.ts # Base de exercícios
│   └── foodDatabase.ts # Base de alimentos
├── types.ts           # Tipos TypeScript
├── App.tsx           # Componente principal
└── main.tsx          # Ponto de entrada
```

## Banco de Dados

O projeto utiliza as seguintes tabelas no Supabase:

- `profiles` - Perfis de usuário
- `user_plans` - Planos de treino e nutrição
- `workout_records` - Registros de treinos realizados
- `nutrition_records` - Registros nutricionais

## Deploy

Para fazer deploy da aplicação:

1. Configure as variáveis de ambiente no seu serviço de hosting
2. Build do projeto:

```bash
npm run build
```

3. Faça deploy da pasta `dist`

## Contribuição

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

MIT License - veja o arquivo LICENSE para detalhes.
