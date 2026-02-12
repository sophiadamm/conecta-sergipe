# 🔔 Sistema de Notificações In-App - Guia de Instalação

Este guia detalha como implementar o sistema completo de notificações in-app para a plataforma Conecta Sergipe, incluindo **alertas de avaliações**.

## 📋 Resumo da Implementação

O sistema de notificações foi projetado para:
- ✅ Notificar voluntários quando suas candidaturas forem aprovadas ou rejeitadas
- ✅ Notificar ONGs quando receberem novas candidaturas
- ✅ **NOVO**: Notificar voluntários quando receberem avaliação da ONG
- ✅ **NOVO**: Notificar ONGs quando receberem avaliação do voluntário
- ✅ Exibir notificações em tempo real no header da aplicação
- ✅ Permitir marcar notificações como lidas
- ✅ Redirecionar usuários ao clicar nas notificações

## 🗄️ Passo 1: Aplicar Migration no Supabase

### Opção A: Via Dashboard do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://app.supabase.com/project/qqptanrdrijlvqfzmynd)
2. Vá em **SQL Editor** no menu lateral
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo: `setup_notifications.sql` (que inclui todas as atualizações)
5. Cole no editor SQL
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde a confirmação de sucesso

### Opção B: Via CLI do Supabase

Se você tiver o Supabase CLI instalado:

```bash
# Na raiz do projeto
npx supabase db push
```

## 🧪 Passo 2: Testar a Migration

Após aplicar a migration, você pode verificar se tudo funcionou:

1. No Dashboard do Supabase, vá em **Table Editor**
2. Você deve ver uma nova tabela chamada `notifications`
3. Clique nela e verifique as colunas:
   - `id` (uuid)
   - `user_id` (uuid)
   - `title` (text)
   - `message` (text)
   - `type` (text)
   - `link` (text)
   - `is_read` (boolean)
   - `created_at` (timestamp)

## 🎨 Passo 3: Verificar Componentes

Todos os componentes já foram criados:

### Arquivos Criados:
- ✅ `src/hooks/useNotifications.ts` - Hook para gerenciar notificações
- ✅ `src/components/NotificationBell.tsx` - Componente do sino de notificações
- ✅ `src/integrations/supabase/types.ts` - Tipos TypeScript atualizados
- ✅ `src/components/Header.tsx` - Header atualizado com o sino

## 🚀 Passo 4: Testar o Sistema

### 1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

### 2. Teste o Fluxo de Notificações:

#### Teste 1: Nova Candidatura (ONG recebe notificação)
1. Faça login como **Voluntário**
2. Candidate-se a uma oportunidade
3. Faça logout
4. Faça login como **ONG** (dona da oportunidade)
5. Você deve ver uma notificação: "👋 Nova Candidatura!"

#### Teste 2: Aprovação/Rejeição (Voluntário recebe notificação)
1. Faça login como **ONG**
2. Vá ao Dashboard e aprove ou rejeite uma candidatura
3. Faça logout
4. Faça login como **Voluntário** (que se candidatou)
5. Você deve ver uma notificação sobre o resultado

#### Teste 3: Avaliações (Feedback) ⭐
1. Faça login como **ONG** e avalie um voluntário (Dashboard -> Gerenciar -> Avaliar)
2. Faça logout e login como **Voluntário**
3. Você deve ver uma notificação: "⭐ Nova avaliação recebida!"
4. Faça o inverso: Voluntário avalia ONG -> ONG recebe notificação.

### 3. Teste a UI:
- ✅ O sino deve aparecer no header (ao lado do botão Explorar)
- ✅ Badge vermelho com conta de não lidas
- ✅ Clicar abre popover com lista de notificações
- ✅ Notificações não lidas têm fundo levemente azulado
- ✅ Clicar em uma notificação marca como lida e redireciona
- ✅ Ações de marcar como lida e deletar aparecem no hover

## 🔍 Solução de Problemas

### Erro: "relation 'notifications' does not exist"
- **Causa**: A migration não foi aplicada
- **Solução**: Execute novamente o Passo 1

### Erro de TypeScript no useNotifications
- **Causa**: Cache do TypeScript desatualizado
- **Solução**: Reinicie o servidor de desenvolvimento (Ctrl+C e `npm run dev`)

### Notificações não aparecem em tempo real
- **Causa**: Realtime subscriptions não estão habilitadas
- **Solução**: 
  1. Vá ao Dashboard do Supabase
  2. Database → Replication
  3. Habilite Realtime para a tabela `notifications`

### O sino não aparece no header
- **Causa**: Usuário não está logado
- **Solução**: O sino só aparece para usuários autenticados

## 📊 Estrutura dos Tipos de Notificação

O sistema suporta os seguintes tipos:

| Tipo | Emoji | Quando é Disparada |
|------|-------|-------------------|
| `application_approved` | 🎉 | ONG aprova candidatura |
| `application_rejected` | 📋 | ONG rejeita candidatura |
| `new_candidacy` | 👋 | Voluntário se candidata |
| `volunteer_reviewed` | ⭐ | ONG avalia voluntário |
| `ong_reviewed` | ⭐ | Voluntário avalia ONG |

## 🔐 Segurança (RLS)

Todas as políticas de Row Level Security estão implementadas:
- Usuários só veem suas próprias notificações
- Sistema pode criar notificações para qualquer usuário (via triggers)
- Usuários podem marcar como lida e deletar apenas suas notificações

## 🎯 Próximos Passos (Opcional)

Melhorias futuras que podem ser implementadas:

1. **Página de Notificações Completa**: Criar `/notificacoes` com histórico completo
2. **Notificações por Email**: Integrar com serviço de email para notificações importantes
3. **Preferências de Notificação**: Permitir usuário escolher quais tipos quer receber
4. **Notificações Push**: Implementar PWA com push notifications
5. **Categorização**: Adicionar filtros por tipo de notificação

## 📝 Notas Técnicas

- **Realtime**: Usa Supabase Realtime para atualizações automáticas
- **Performance**: Índices criados em `user_id`, `is_read` e `created_at`
- **UX**: Usa `date-fns` para formatação de datas em português
- **Acessibilidade**: Componentes com aria-labels apropriados
- **Design**: Segue padrões do Shadcn UI e Tailwind CSS

---

**Desenvolvido para Conecta Sergipe** 🤝
Sistema implementado em: 12/02/2026
