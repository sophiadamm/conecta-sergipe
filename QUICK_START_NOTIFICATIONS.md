# 🚀 Guia Rápido: Ativando Notificações em 3 Minutos

## ⚡ Passo 1: Aplicar SQL (2 minutos)

1. Abra: https://app.supabase.com/project/qqptanrdrijlvqfzmynd/sql/new
2. Copie TODO o conteúdo do arquivo: `setup_notifications.sql`
   - *Este script já inclui as notificações de novas avaliações!*
3. Cole no editor
4. Clique em **Run** (Ctrl+Enter)
5. Aguarde ver: "✅ Sistema de notificações (incluindo avaliações) instalado com sucesso!"

## 🔔 Passo 2: Habilitar Realtime (30 segundos)

1. Abra: https://app.supabase.com/project/qqptanrdrijlvqfzmynd/database/replication
2. Procure a tabela `notifications`
3. Clique no toggle para **HABILITAR**
4. Aguarde confirmação

## ✅ Passo 3: Testar (30 segundos)

```bash
npm run dev
```

1. Faça login
2. Veja o sino 🔔 no header (ao lado de "Explorar")
3. Teste fazendo uma candidatura ou **avaliando um voluntário/ONG**

---

## 🎯 Funcionalidades Ativas:

✅ Notificação de Nova Candidatura  
✅ Notificação de Aprovação/Rejeição  
✅ **NOVO: Notificação de Avaliação Recebida (⭐)**  
✅ Realtime, Badges e Popover Interativo  

---

## ❓ Problema?

**Sine não aparece?**
→ Você está logado? O sino só aparece para usuários autenticados.

**Notificações não aparecem?**
→ Habilitou Realtime no Passo 2?

**Erro "relation notifications does not exist"?**
→ Execute o Passo 1 novamente.

---

💡 **Dica**: Veja `NOTIFICATIONS_README.md` para documentação completa.
