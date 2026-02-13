# Documentação Técnica - Conecta Sergipe

## 📋 Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura e Estrutura de Pastas](#3-arquitetura-e-estrutura-de-pastas)
4. [Integração com Backend (Supabase)](#4-integração-com-backend-supabase)
5. [Funcionalidades Principais e Lógica de Negócio](#5-funcionalidades-principais-e-lógica-de-negócio)
6. [Guia de Instalação e Execução](#6-guia-de-instalação-e-execução)
7. [Decisões de Design e UX](#7-decisões-de-design-e-ux)
8. [Fluxos Críticos](#8-fluxos-críticos)

---

## 1. Visão Geral do Projeto

**Conecta Sergipe** é uma plataforma web que conecta **ONGs** (Organizações Não-Governamentais) a **Voluntários** no estado de Sergipe. O objetivo é facilitar o processo de recrutamento e gestão de voluntários, tornando o trabalho social mais acessível e organizado.

### 1.1 Propósito

- **Para ONGs**: Criar e gerenciar oportunidades de voluntariado, receber candidaturas, aprovar/rejeitar voluntários, e avaliar o desempenho dos participantes.
- **Para Voluntários**: Buscar oportunidades alinhadas com suas habilidades e interesses, candidatar-se a vagas, e construir um portfólio validado de horas de trabalho voluntário.

### 1.2 Principais Funcionalidades

#### Autenticação e Perfis
- ✅ **Cadastro e Login**: Sistema completo de autenticação com suporte a ONGs e Voluntários
- ✅ **Perfis Públicos**: Visualização de perfis de ONGs e voluntários com histórico e avaliações
- ✅ **Gestão de Perfil**: Edição de informações pessoais, habilidades, áreas de interesse e localização

#### Dashboard da ONG
- ✅ **Gestão de Vagas**: CRUD completo de oportunidades de voluntariado
- ✅ **Gerenciamento de Candidaturas**: Aprovar/rejeitar candidatos
- ✅ **Acompanhamento de Voluntários**: Visualizar voluntários ativos e concluir trabalhos
- ✅ **Sistema de Avaliação**: Avaliar voluntários ao concluir trabalhos (rating + feedback + tags)
- ✅ **Métricas**: Visualização de oportunidades ativas, candidaturas pendentes e trabalhos concluídos

#### Dashboard do Voluntário
- ✅ **Busca de Oportunidades**: Sistema de busca com múltiplos filtros (habilidades, localização, horas)
- ✅ **Candidaturas**: Visualizar status de candidaturas (pendente, aprovado, rejeitado)
- ✅ **Trabalhos em Andamento**: Acompanhar vagas aprovadas
- ✅ **Portfólio de Horas**: Registro validado de horas trabalhadas por ONG
- ✅ **Avaliações Recebidas**: Visualizar feedbacks e ratings de ONGs

#### Comunicação
- ✅ **Sistema de Chat**: Mensagens em tempo real entre ONGs e voluntários
- ✅ **Notificações**: Sistema de notificações para candidaturas, aprovações e mensagens

#### Descoberta
- ✅ **Página Explorar**: Busca avançada de oportunidades com sistema de matching semântico (IA)
- ✅ **Recomendações**: Algoritmo de recomendação baseado em perfil e embeddings

---

## 2. Stack Tecnológica

### 2.1 Core Framework

```json
{
  "Frontend": "React 18.3.1",
  "Language": "TypeScript 5.8.3",
  "Build Tool": "Vite 5.4.19",
  "Backend": "Supabase (BaaS)"
}
```

**Nota Importante**: Este projeto utiliza **React** com **TypeScript**, não Vue.js. A escolha do React permite aproveitar seu vasto ecossistema e performance otimizada com o compilador SWC.

### 2.2 Bibliotecas e Frameworks Principais

#### UI e Estilização
- **Tailwind CSS 3.4.17**: Utility-first CSS framework para estilização rápida e consistente
- **Radix UI**: Biblioteca de componentes primitivos acessíveis (dialogs, dropdowns, tabs, etc.)
- **Shadcn/UI**: Componentes de UI pré-estilizados construídos sobre Radix UI
- **Lucide React**: Biblioteca de ícones moderna e leve
- **class-variance-authority**: Gerenciamento de variantes de componentes
- **tailwind-merge**: Utilitário para merge inteligente de classes Tailwind

#### Gerenciamento de Estado e Dados
- **@tanstack/react-query 5.83.0**: Gerenciamento de estado assíncrono e cache de dados
- **React Context API**: Estado global de autenticação (`AuthProvider`)
- **React Hook Form 7.61.1**: Gerenciamento de formulários com validação
- **Zod 3.25.76**: Schema validation para TypeScript

#### Roteamento
- **React Router DOM 6.30.1**: Roteamento client-side com suporte a nested routes

#### Backend as a Service
- **@supabase/supabase-js 2.93.3**: Cliente JavaScript oficial do Supabase
  - Autenticação (Auth)
  - Banco de Dados (PostgreSQL)
  - Realtime (WebSockets)
  - Storage (Arquivos)

#### IA e Machine Learning
- **@huggingface/transformers 3.8.1**: Biblioteca para embeddings semânticos no navegador
  - Usado para matching inteligente de oportunidades e voluntários
  - Geração de embeddings de textos (descrições, habilidades)

#### Outras Bibliotecas Importantes
- **axios 1.13.4**: Cliente HTTP para chamadas à HuggingFace API
- **date-fns 3.6.0**: Manipulação de datas
- **recharts 2.15.4**: Gráficos e visualização de dados (potencial uso futuro)
- **cmdk 1.1.1**: Command palette para buscas rápidas

### 2.3 Ferramentas de Desenvolvimento

```json
{
  "Testing": "Vitest 3.2.4 + @testing-library/react 16.0.0",
  "Linting": "ESLint 9.32.0 + TypeScript ESLint",
  "Build": "Vite + @vitejs/plugin-react-swc (SWC Compiler)"
}
```

---

## 3. Arquitetura e Estrutura de Pastas

### 3.1 Visão Geral da Arquitetura

O projeto segue uma arquitetura **Component-Based** típica de aplicações React modernas, com separação clara de responsabilidades:

```
conecta-sergipe/
├── src/
│   ├── pages/              # Páginas principais (rotas)
│   ├── components/         # Componentes reutilizáveis
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilitários e configurações
│   ├── integrations/       # Integrações externas (Supabase)
│   ├── test/               # Testes unitários
│   ├── App.tsx             # Componente raiz
│   └── main.tsx            # Entry point
├── supabase/               # Configurações e migrações do Supabase
│   ├── migrations/         # SQL migrations
│   └── functions/          # Edge functions (se houver)
└── public/                 # Arquivos estáticos
```

### 3.2 Detalhamento: `src/pages/`

Cada página representa uma rota da aplicação:

| Arquivo | Rota | Responsabilidade |
|---------|------|------------------|
| `Index.tsx` | `/` | Landing page com apresentação do projeto |
| `Auth.tsx` | `/auth` | Página de login e cadastro (duplo formulário) |
| `Dashboard.tsx` | `/dashboard` | Router que redireciona para dashboard específico (ONG ou Voluntário) |
| `VolunteerDashboard.tsx` | `/voluntario` | Dashboard do voluntário (candidaturas, portfólio, métricas) |
| `OngDashboard.tsx` | `/ong` | Dashboard da ONG (vagas, candidatos, avaliações) |
| `NewOpportunity.tsx` | `/ong/nova-oportunidade`, `/ong/editar-oportunidade/:id` | Formulário de criação/edição de vagas (mesmo componente) |
| `Explore.tsx` | `/explorar` | Página de busca de oportunidades com filtros avançados |
| `OpportunityDetails.tsx` | `/vaga/:id` | Detalhes de uma vaga específica + botão de candidatura |
| `Profile.tsx` | `/perfil` | Perfil do usuário logado (edição) |
| `PublicProfile.tsx` | `/perfil/:id` | Perfil público de outro usuário (visualização) |
| `Chat.tsx` | `/chat` | Sistema de mensagens em tempo real |
| `NotFound.tsx` | `*` | Página 404 (catch-all route) |

### 3.3 Detalhamento: `src/components/`

Componentes são organizados por funcionalidade. Principais componentes:

#### UI Primitivos (`src/components/ui/`)
Componentes Shadcn/UI baseados em Radix:
- `button.tsx`, `input.tsx`, `textarea.tsx`: Inputs básicos
- `card.tsx`, `dialog.tsx`, `tabs.tsx`: Containers e modais
- `badge.tsx`, `avatar.tsx`, `separator.tsx`: Elementos visuais
- `toast.tsx`, `sonner.tsx`: Notificações
- `multi-select.tsx`: Seleção múltipla customizada

#### Componentes de Negócio
- `Header.tsx`: Barra de navegação principal
- `NotificationBell.tsx`: Ícone de notificações com contador
- `ReviewCard.tsx`: Card de avaliação (usado em perfis)
- `StarRating.tsx`: Componente de rating visual
- `DummyDataGenerator.tsx`: Ferramenta de desenvolvimento (removida do header em produção)

### 3.4 Detalhamento: `src/hooks/`

Custom hooks para lógica reutilizável:

| Hook | Responsabilidade |
|------|------------------|
| `useAuth.tsx` | **Autenticação global** - Gerencia login, logout, sessão, criação de perfil |
| `useProfile.ts` | Busca e atualização de perfil do usuário logado |
| `useNotifications.ts` | Gerenciamento de notificações em tempo real (Supabase Realtime) |
| `useUnreadMessages.ts` | Contador de mensagens não lidas |
| `useOpportunitySearch.ts` | Lógica de busca de oportunidades com filtros |
| `useOngSearch.ts` | Busca de ONGs |
| `useOngReviews.ts` | Busca avaliações de uma ONG específica |
| `useDebounce.ts` | Debounce para inputs de busca |
| `use-toast.ts` | Gerenciamento de toasts/notificações visuais |
| `use-mobile.tsx` | Detecção de dispositivo móvel |

### 3.5 Detalhamento: `src/lib/`

Utilitários e configurações:

- `utils.ts`: Função `cn()` para merge de classes CSS
- `embeddings.ts`: Lógica de geração de embeddings com HuggingFace Transformers
- `skills.ts`: Lista de habilidades pré-definidas (`PREDEFINED_SKILLS`)
- `causes.ts`: Lista de causas/áreas de atuação (`PREDEFINED_CAUSES`)
- `locations.ts`: Lista de cidades de Sergipe (`SERGIPE_CITIES`)
- `feedback-tags.ts`: Tags de avaliação de voluntários
- `cnpj.ts`: Validação e formatação de CNPJ

### 3.6 Detalhamento: `src/integrations/supabase/`

- `client.ts`: Inicialização do cliente Supabase
- `types.ts`: Tipos TypeScript gerados automaticamente do schema do banco

### 3.7 Roteamento e Proteção de Rotas

**Configuração de Rotas** (`App.tsx`):

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/dashboard" element={<Dashboard />} />
    {/* ... outras rotas */}
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

**Proteção de Rotas**:
- Implementada via `useEffect` dentro de cada página protegida
- Exemplo (`VolunteerDashboard.tsx`):

```tsx
useEffect(() => {
  if (!authLoading) {
    if (!user) {
      navigate('/auth'); // Sem usuário → Login
      return;
    }
    if (profile && profile.tipo !== 'voluntario') {
      navigate('/ong'); // Tipo errado → Redireciona
      return;
    }
  }
}, [user, profile, authLoading, navigate]);
```

**Layout Global**:
- Não há um componente `<Layout>` separado
- O componente `<Header />` é incluído manualmente em cada página que precisa dele
- Páginas de autenticação (`Auth.tsx`) e landing page (`Index.tsx`) não incluem o Header

---

## 4. Integração com Backend (Supabase)

### 4.1 Inicialização do Cliente

**Arquivo**: `src/integrations/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY, 
  {
    auth: {
      storage: localStorage,        // Sessões armazenadas no localStorage
      persistSession: true,          // Sessão persistente entre recargas
      autoRefreshToken: true,        // Refresh automático do token
    }
  }
);
```

### 4.2 Autenticação

#### Fluxo de Login

1. **Usuário preenche formulário** (`Auth.tsx`)
2. **Chamada ao Supabase**:
   ```tsx
   const { data, error } = await supabase.auth.signInWithPassword({
     email,
     password,
   });
   ```
3. **Verificação de perfil** (`useAuth.tsx`):
   - Após login bem-sucedido, busca o perfil na tabela `profiles`
   - Se encontrado, atualiza o estado global (`AuthContext`)
4. **Redirecionamento**:
   - Voluntário → `/voluntario`
   - ONG → `/ong`

#### Fluxo de Cadastro

1. **Usuário preenche formulário** com dados adicionais (nome, tipo, CPF/CNPJ, etc.)
2. **Criação da conta**:
   ```tsx
   const { data, error } = await supabase.auth.signUp({
     email,
     password,
     options: {
       emailRedirectTo: redirectUrl,
     },
   });
   ```
3. **Criação do perfil**:
   ```tsx
   await supabase.from('profiles').upsert({
     user_id: data.user.id,
     nome: profileData.nome,
     cpf: profileData.cpf,
     cnpj: profileData.cnpj,
     tipo: profileData.tipo, // 'voluntario' ou 'ong'
     // ... outros campos
   }, {
     onConflict: 'user_id'
   });
   ```
4. **Redirecionamento automático** para `/dashboard`

#### Gerenciamento de Sessão

- **Storage**: `localStorage` (configurado no cliente Supabase)
- **Persistência**: Sessão mantida entre recargas de página
- **Auto-refresh**: Token renovado automaticamente antes de expirar
- **Estado Global**: Gerenciado via `AuthContext` (`useAuth.tsx`)
  ```tsx
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  ```

### 4.3 Estrutura do Banco de Dados

#### Tabelas Principais

##### `auth.users` (gerenciada pelo Supabase)
- `id` (UUID, PK)
- `email`
- `encrypted_password`
- `email_confirmed_at`
- `created_at`

##### `public.profiles`
Armazena informações públicas dos usuários:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  tipo VARCHAR NOT NULL CHECK (tipo IN ('voluntario', 'ong')),
  nome VARCHAR NOT NULL,
  cpf VARCHAR(11) CHECK (tipo = 'voluntario' OR cpf IS NULL),
  cnpj VARCHAR(14) CHECK (tipo = 'ong' OR cnpj IS NULL),
  bio TEXT,
  skills TEXT,
  interests TEXT,
  locations TEXT[],
  linkedin_url VARCHAR,
  github_url VARCHAR,
  avatar_url VARCHAR,
  experience_level VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Relacionamento**: `profiles.user_id → auth.users.id` (1:1)

##### `public.opportunities`
Oportunidades de voluntariado criadas por ONGs:

```sql
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ong_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo VARCHAR NOT NULL,
  descricao TEXT NOT NULL,
  skills_required TEXT,
  horas_estimadas INTEGER NOT NULL,
  location VARCHAR,
  ativa BOOLEAN DEFAULT TRUE,
  
  -- Novos campos expandidos
  causas TEXT[],
  min_vagas INTEGER,
  formato VARCHAR CHECK (formato IN ('presencial', 'remoto', 'hibrido')),
  emite_certificado BOOLEAN,
  oferece_treinamento BOOLEAN,
  recursos_oferecidos TEXT, -- Texto livre (não mais array)
  endereco VARCHAR,
  bairro VARCHAR,
  cidade VARCHAR,
  
  -- Embeddings para matching semântico (IA)
  embedding VECTOR(384), -- Vetores para busca semântica
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

##### `public.matches`
Relacionamento entre voluntários e oportunidades:

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voluntario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'pendente' 
    CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'concluido')),
  
  -- Campos de conclusão/avaliação
  horas_validadas INTEGER,
  feedback_ong TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  tags_ong TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(voluntario_id, opportunity_id) -- Impede candidatura duplicada
);
```

##### `public.reviews`
Sistema de avaliações mútuas:

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  opportunity_id UUID REFERENCES opportunities(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

##### `public.conversations` e `public.messages`
Sistema de chat:

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant1_id UUID NOT NULL REFERENCES profiles(id),
  participant2_id UUID NOT NULL REFERENCES profiles(id),
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

##### `public.notifications`
Sistema de notificações:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.4 Row Level Security (RLS)

Todas as tabelas públicas possuem políticas RLS ativadas:

```sql
-- Exemplo: profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis são visíveis para todos"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

### 4.5 Realtime Subscriptions

Utilizado para notificações e chat em tempo real:

```tsx
// Exemplo de subscription (useNotifications.ts)
const subscription = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      setNotifications((prev) => [payload.new, ...prev]);
    }
  )
  .subscribe();
```

---

## 5. Funcionalidades Principais e Lógica de Negócio

### 5.1 CRUD de Oportunidades

**Arquivo**: `src/pages/NewOpportunity.tsx`

#### Criação de Vaga

1. **Formulário com validação** (React Hook Form + Zod):
   ```tsx
   const opportunitySchema = z.object({
     titulo: z.string().min(3),
     causas: z.string().min(1),
     descricao: z.string().min(10),
     vagas: z.coerce.number().min(1),
     formato: z.enum(['presencial', 'remoto', 'hibrido']),
     // ... outros campos
   });
   ```

2. **Geração de Embedding** (IA para matching):
   ```tsx
   const opportunityText = buildOpportunityText({
     titulo: data.titulo,
     descricao: data.descricao,
     skills_required: data.skills,
     causas: data.causas.split(','),
   });
   const embedding = await generateEmbedding(opportunityText);
   ```

3. **Inserção no banco**:
   ```tsx
   await supabase.from('opportunities').insert({
     ong_id: profile.id,
     titulo: data.titulo,
     descricao: data.descricao,
     embedding: JSON.stringify(embedding), // Armazenado como JSON
     // ... outros campos
   });
   ```

#### Edição de Vaga

- **Mesma página/componente** (`NewOpportunity.tsx`)
- **Detecção via rota**: `/ong/editar-oportunidade/:id`
- **Pré-carregamento de dados**:
  ```tsx
  useEffect(() => {
    if (isEditMode && id) {
      loadOpportunity(id);
    }
  }, [id, isEditMode]);
  ```

### 5.2 Sistema de Busca e Matching

**Arquivo**: `src/hooks/useOpportunitySearch.ts`

#### Busca Tradicional (Filtros)

Filtros disponíveis:
- **Texto livre** (busca em título/descrição)
- **Habilidades** (multi-select)
- **Localização/Cidade** (multi-select)
- **Estimativa de horas** (range)
- **Causas/Áreas de atuação** (multi-select)

Exemplo de query:

```tsx
let query = supabase
  .from('opportunities')
  .select(`
    *,
    ong:profiles!opportunities_ong_id_fkey(id, nome, avatar_url)
  `)
  .eq('ativa', true);

if (searchText) {
  query = query.or(`titulo.ilike.%${searchText}%,descricao.ilike.%${searchText}%`);
}

if (selectedSkills.length > 0) {
  query = query.containedBy('skills_required', selectedSkills);
}

// ... outros filtros
```

#### Matching Semântico (IA)

**Como funciona**:

1. **Ao criar uma oportunidade**:
   - Gera embedding do texto (título + descrição + skills)
   - Armazena no campo `embedding` (VECTOR)

2. **Ao buscar**:
   - Gera embedding do perfil do voluntário (bio + skills + interests)
   - Usa função RPC `match_opportunities` no Supabase:
     ```sql
     CREATE FUNCTION match_opportunities(
       query_embedding vector(384),
       match_threshold float,
       match_count int
     )
     RETURNS TABLE (
       id uuid,
       similarity float
     )
     AS $$
     BEGIN
       RETURN QUERY
       SELECT 
         opportunities.id,
         1 - (opportunities.embedding <=> query_embedding) as similarity
       FROM opportunities
       WHERE 1 - (opportunities.embedding <=> query_embedding) > match_threshold
       ORDER BY similarity DESC
       LIMIT match_count;
     END;
     $$ LANGUAGE plpgsql;
     ```

3. **Ordenação por relevância**:
   - Resultados ordenados por similarity score
   - Threshold mínimo para exibir apenas matches relevantes

**Observação**: A geração de embeddings ocorre **no navegador** usando `@huggingface/transformers` (modelo `Xenova/all-MiniLM-L6-v2`), sem necessidade de servidor externo.

### 5.3 Dashboard e Métricas

#### Dashboard da ONG (`OngDashboard.tsx`)

**Métricas calculadas**:
```tsx
const activeOpps = opportunities.filter(o => o.ativa).length;
const pendingMatches = matches.filter(m => m.status === 'pendente').length;
const completedMatches = matches.filter(m => m.status === 'concluido').length;
```

**Abas principais**:
1. **Oportunidades**: Lista de vagas criadas (ativas/inativas)
2. **Candidaturas**: Matches com status `pendente` (aprovar/rejeitar)
3. **Em Andamento**: Matches com status `aprovado`
4. **Meus Feedbacks**: Avaliações recebidas de voluntários

**Funcionalidades**:
- Aprovar/Rejeitar candidato
- Concluir trabalho + avaliar voluntário (rating, feedback, tags, horas validadas)
- Editar/Excluir vaga

#### Dashboard do Voluntário (`VolunteerDashboard.tsx`)

**Métricas calculadas**:
```tsx
const totalApplications = matches.length;
const totalHours = matches
  .filter(m => m.status === 'concluido')
  .reduce((sum, m) => sum + (m.horas_validadas || 0), 0);
const avgRating = reviews.length > 0
  ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  : 0;
```

**Abas principais**:
1. **Minhas Candidaturas**: Lista de candidaturas com status e filtros
2. **Oportunidades Aprovadas**: Vagas em andamento
3. **Portfólio**: Histórico de trabalhos concluídos
4. **Feedbacks Recebidos**: Avaliações de ONGs

### 5.4 Sistema de Avaliação

**Ao concluir um trabalho** (`OngDashboard.tsx`):

```tsx
await supabase.from('matches').update({
  status: 'concluido',
  horas_validadas: reviewData.horas,
  feedback_ong: reviewData.feedback,
  rating: reviewData.rating,
  tags_ong: reviewData.tags,
}).eq('id', matchId);

// Também cria um registro em `reviews`
await supabase.from('reviews').insert({
  reviewer_id: ongId,
  reviewee_id: volunteerId,
  opportunity_id: opportunityId,
  rating: reviewData.rating,
  comment: reviewData.feedback,
  tags: reviewData.tags,
});
```

**Cálculo de rating médio**:
```tsx
const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
```

---

## 6. Guia de Instalação e Execução

### 6.1 Pré-requisitos

- **Node.js**: v18+ (recomendado v20+)
- **npm** ou **yarn**
- **Conta no Supabase** (gratuita)

### 6.2 Configuração do Supabase

1. **Criar projeto no Supabase**:
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote a **URL** e a **Anon Key**

2. **Executar migrações** (opcional no ambiente de desenvolvimento):
   ```bash
   npx supabase init
   npx supabase link --project-ref SEU_PROJECT_REF
   npx supabase db push
   ```

3. **Configurar autenticação**:
   - No painel do Supabase, vá em **Authentication > Providers**
   - Habilite **Email** (já vem habilitado por padrão)
   - Em **Email Templates**, personalize se desejar
   - **Importante**: Desabilite "Confirm email" se quiser que usuários façam login imediatamente após cadastro

### 6.3 Instalação Local

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/conecta-sergipe.git
   cd conecta-sergipe
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua-anon-key-aqui
   ```

   **Importante**: Nunca commite o arquivo `.env.local` no Git!

4. **Execute em modo de desenvolvimento**:
   ```bash
   npm run dev
   ```

   A aplicação estará disponível em `http://localhost:8080`

### 6.4 Build para Produção

```bash
# Build otimizado
npm run build

# Preview do build
npm run preview
```

Os arquivos otimizados estarão na pasta `dist/`.

### 6.5 Deploy

**Opções recomendadas**:

1. **Vercel** (recomendado para React):
   ```bash
   npm i -g vercel
   vercel
   ```
   Configure as variáveis de ambiente no painel da Vercel.

2. **Netlify**:
   - Connect do repositório GitHub
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Supabase Hosting** (em beta):
   ```bash
   npx supabase deploy
   ```

---

## 7. Decisões de Design e UX

### 7.1 Sistema de Design

**Biblioteca de Componentes**: **Shadcn/UI** + **Radix UI**

Por que Shadcn/UI?
- ✅ **Customizável**: Código-fonte dos componentes no projeto (não é lib externa)
- ✅ **Acessível**: Built on top do Radix UI (WAI-ARIA compliant)
- ✅ **Consistente**: Design tokens unificados via Tailwind CSS
- ✅ **Type-safe**: Totalmente tipado com TypeScript

**Componentes-chave**:
- `Button`: Várias variantes (default, destructive, outline, ghost, link)
- `Card`: Container padrão para seções de conteúdo
- `Dialog`: Modais acessíveis (usado para criação de vagas, avaliações)
- `Tabs`: Navegação entre abas nos dashboards
- `Toast/Sonner`: Notificações visuais (sucesso, erro, info)
- `MultiSelect`: Componente customizado para seleção múltipla

### 7.2 Tailwind CSS e Estilização

**Abordagem Utility-First**:
```tsx
<Button className="w-full h-12 text-base gradient-primary">
  Candidatar-se
</Button>
```

**Design Tokens** (`index.css`):
```css
:root {
  --primary: 221 83% 53%;      /* Azul vibrante */
  --secondary: 280 60% 50%;    /* Roxo */
  --accent: 37 90% 51%;        /* Laranja/amarelo */
  --success: 142 71% 45%;      /* Verde */
  --warning: 38 92% 50%;       /* Amarelo */
  --destructive: 0 84% 60%;    /* Vermelho */
}
```

**Classes Customizadas**:
- `.gradient-primary`: Gradiente de cores primárias (usado em botões principais)
- `.text-gradient`: Texto com gradiente

### 7.3 Responsividade

**Mobile-First Approach**:
- Breakpoints Tailwind padrão:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
  - `2xl`: 1536px

**Exemplo de layout responsivo**:
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 coluna em mobile, 2 em tablet, 3 em desktop */}
</div>
```

**Header responsivo**:
- Em mobile: Links "Explorar" e "Mensagens" com ícones apenas
- Em desktop: Ícones + texto

### 7.4 Acessibilidade

**Práticas implementadas**:
- ✅ Navegação por teclado (Tab, Enter, Esc)
- ✅ Aria labels em todos os botões e inputs
- ✅ Contraste de cores WCAG AA
- ✅ Focus rings visíveis
- ✅ Screen reader friendly (via Radix UI)

### 7.5 Animações e Transições

**Tailwind Animate Plugin**:
```tsx
<Loader2 className="animate-spin" />  // Loading spinner
```

**Animações de entrada/saída** (via Radix UI):
- Dialogs: Fade in + scale
- Dropdowns: Slide down
- Toasts: Slide in from corner

### 7.6 Ícones

**Lucide React**:
- Biblioteca moderna e leve (tree-shakeable)
- Ícones usados:
  - `Heart`: Logo da plataforma
  - `Building2`: ONGs
  - `User`: Voluntários
  - `Briefcase`: Oportunidades
  - `MessageCircle`: Chat
  - `Bell`: Notificações
  - E muitos outros...

---

## 8. Fluxos Críticos

### 8.1 Fluxo Completo de Voluntariado

```
1. Voluntário se cadastra
   └─> Perfil criado em `profiles` (tipo: 'voluntario')

2. Voluntário busca oportunidades (/explorar)
   └─> Query com filtros + matching semântico (IA)

3. Voluntário se candidata a uma vaga
   └─> INSERT em `matches` (status: 'pendente')
   └─> Notificação enviada para a ONG

4. ONG revisa candidaturas (dashboard)
   └─> Aprova ou rejeita
   └─> UPDATE em `matches` (status: 'aprovado' ou 'rejeitado')
   └─> Notificação enviada para o voluntário

5. Voluntário trabalha na vaga aprovada
   └─> (fora do sistema - trabalho real)

6. ONG conclui e avalia o trabalho
   └─> UPDATE em `matches` (status: 'concluido', horas_validadas, rating, feedback)
   └─> INSERT em `reviews`
   └─> Horas adicionadas ao portfólio do voluntário
```

### 8.2 Tratamento de Erros Comuns

#### Erro 409: Candidatura duplicada
```tsx
if (error.code === '23505') { // Unique constraint violation
  toast({
    title: 'Você já se candidatou',
    description: 'Você já se candidatou a esta oportunidade.',
  });
}
```

#### Erro 422: Email já cadastrado
```tsx
if (error.message.includes('already registered')) {
  if (user) {
    navigate('/dashboard'); // Já logado, redireciona
  } else {
    setError('Este email já está cadastrado. Faça login para continuar.');
  }
}
```

### 8.3 Segurança

**Sanitização de Inputs**:
```tsx
// CPF/CNPJ: Remove caracteres não-numéricos
const sanitizedCpf = cpf.replace(/\D/g, '');

// SQL Injection: Prevenido pelo Supabase (prepared statements)
```

**Validação no Cliente + Servidor**:
- Cliente: Zod schema validation
- Servidor: PostgreSQL constraints + RLS policies

---

## 📝 Notas Finais

### Próximas Melhorias Sugeridas

1. **Testes Automatizados**:
   - Adicionar testes unitários (Vitest)
   - Testes de integração com React Testing Library
   - E2E com Playwright

2. **Performance**:
   - Implementar lazy loading de rotas
   - Otimizar geração de embeddings (cache)
   - Adicionar service worker (PWA)

3. **Funcionalidades**:
   - Sistema de recomendações push (email/push notifications)
   - Dashboard analytics com gráficos (Recharts)
   - Gamificação (badges, conquistas)

### Contato e Suporte

- **Repositório**: [GitHub](https://github.com/seu-usuario/conecta-sergipe)
- **Issues**: Reportar bugs e sugestões via GitHub Issues
- **Documentação do Supabase**: [supabase.com/docs](https://supabase.com/docs)

---

**Última atualização**: 13/02/2026
**Versão**: 1.0.0
