# Refinamento do Algoritmo de Matching - Changelog

## 📅 Data: 2026-02-13

## 🎯 Objetivo
Reduzir a inflação de scores e tornar o filtro de localização mais rigoroso.

---

## 🔄 Mudanças Implementadas

### 1. **Redução de Pesos (0.1 → 0.05)**

**Antes:**
- Bônus por Skill: **+0.1** (10%)
- Bônus por Interesse: **+0.1** (10%)
- Penalidade sem Skills: **-0.1** (10%)

**Depois:**
- Bônus por Skill: **+0.05** (5%)
- Bônus por Interesse: **+0.05** (5%)
- Penalidade sem Skills: **-0.05** (5%)

**Justificativa:** Os pesos anteriores estavam causando inflação de scores, com muitas vagas ultrapassando 100% mesmo com o clamp. A redução para 5% torna o algoritmo mais conservador e os scores mais realistas.

---

### 2. **Hard Filter de Localização**

**Antes:**
- Localização dava **bônus de +0.3** no score
- Vagas fora da localização do usuário ainda eram retornadas (com score menor)

**Depois:**
- Localização é um **filtro obrigatório** (hard filter)
- Vagas fora das localizações do usuário **não são retornadas**
- Removido o `location_bonus` da tabela de retorno

**Lógica SQL:**
```sql
WHERE
  opp.ativa = true
  AND opp.embedding IS NOT NULL
  AND (
    v_locations IS NULL 
    OR opp.location IS NULL 
    OR EXISTS (
      SELECT 1
      FROM unnest(v_locations) AS loc
      WHERE lower(loc) = lower(opp.location)
    )
  )
```

**Justificativa:** Localização é um requisito crítico para voluntariado. Não faz sentido mostrar vagas em cidades onde o voluntário não pode atuar, independentemente do quão bom seja o match em outros aspectos.

---

### 3. **Remoção do `location_bonus`**

**Campos Retornados - Antes:**
```typescript
{
  semantic_score: number,
  skills_bonus: number,
  interests_bonus: number,
  location_bonus: number,  // ← Removido
  score: number
}
```

**Campos Retornados - Depois:**
```typescript
{
  semantic_score: number,
  skills_bonus: number,
  interests_bonus: number,
  score: number
}
```

---

## 📊 Comparação de Scores

### Cenário 1: Voluntário com 3 Skills + 2 Interesses + Localização Match

| Componente | Peso Antigo | Peso Novo |
|------------|-------------|-----------|
| Similaridade | 0.85 | 0.85 |
| 3 Skills | +0.30 | +0.15 |
| 2 Interesses | +0.20 | +0.10 |
| Localização | +0.30 | Hard Filter ✅ |
| **Score Bruto** | **1.65** | **1.10** |
| **Score Final** | **1.00** (clamped) | **1.00** (clamped) |

### Cenário 2: Voluntário com 1 Skill + 1 Interesse + Localização Match

| Componente | Peso Antigo | Peso Novo |
|------------|-------------|-----------|
| Similaridade | 0.70 | 0.70 |
| 1 Skill | +0.10 | +0.05 |
| 1 Interesse | +0.10 | +0.05 |
| Localização | +0.30 | Hard Filter ✅ |
| **Score Bruto** | **1.20** | **0.80** |
| **Score Final** | **1.00** (clamped) | **0.80** |

**Observação:** Com os novos pesos, scores mais realistas são gerados, permitindo melhor diferenciação entre vagas.

### Cenário 3: Localização Incompatível

| Componente | Peso Antigo | Peso Novo |
|------------|-------------|-----------|
| Similaridade | 0.95 | 0.95 |
| 5 Skills | +0.50 | +0.25 |
| 3 Interesses | +0.30 | +0.15 |
| Localização | +0.00 | ❌ Filtrado |
| **Score Final** | **1.00** (retornado) | **N/A** (não retornado) |

**Observação:** Agora vagas fora da localização do usuário são completamente filtradas.

---

## 🔧 Arquivos Modificados

1. ✅ `apply_interests_feature.sql`
2. ✅ `supabase/migrations/20260213000001_update_match_opportunities_with_interests.sql`
3. ✅ `INTERESTS_FEATURE_DOCUMENTATION.md`

---

## 🚀 Como Aplicar

Execute o script atualizado no Supabase SQL Editor:

```bash
# Arquivo: apply_interests_feature.sql
```

Isso irá:
1. Recriar a função `match_opportunities` com os novos pesos
2. Aplicar o hard filter de localização
3. Remover o campo `location_bonus` do retorno

---

## 🧪 Como Testar

### Teste 1: Verificar Hard Filter de Localização

```sql
-- Adicione uma localização ao perfil
UPDATE profiles 
SET locations = ARRAY['Aracaju']
WHERE id = 'seu-user-id';

-- Buscar vagas
SELECT titulo, location, score
FROM match_opportunities('seu-user-id'::uuid, NULL, 20);

-- Resultado esperado: Apenas vagas em Aracaju devem aparecer
```

### Teste 2: Verificar Novos Pesos

```sql
SELECT 
  titulo,
  ROUND(semantic_score::numeric, 3) as semantic,
  ROUND(skills_bonus::numeric, 3) as skills,
  ROUND(interests_bonus::numeric, 3) as interests,
  ROUND(score::numeric, 3) as total
FROM match_opportunities('seu-user-id'::uuid, NULL, 10)
ORDER BY score DESC;

-- Resultado esperado: 
-- - skills_bonus deve estar entre -0.05 e +0.50 (máx 10 skills × 0.05)
-- - interests_bonus deve estar entre 0.00 e +0.50 (máx 10 interesses × 0.05)
-- - score total deve estar entre 0.00 e 1.00
```

### Teste 3: Comparar Antes vs Depois

```sql
-- Contar quantas vagas são retornadas
SELECT COUNT(*) as total_vagas
FROM match_opportunities('seu-user-id'::uuid, NULL, 100);

-- Resultado esperado: Menos vagas que antes (devido ao hard filter)
```

---

## 📈 Impacto Esperado

### Positivo ✅
- **Scores mais realistas:** Menos vagas com 100%
- **Melhor diferenciação:** Vagas medianas agora têm scores entre 0.6-0.9
- **Filtro rigoroso:** Apenas vagas acessíveis são mostradas
- **Performance:** Menos resultados para processar no frontend

### Considerações ⚠️
- **Menos resultados:** Usuários com poucas localizações selecionadas verão menos vagas
- **Scores mais baixos:** A média geral de scores será menor (isso é esperado e desejável)

---

## 🔄 Rollback (Se Necessário)

Se precisar reverter para os pesos antigos:

```sql
-- Restaurar pesos para 0.1 e adicionar location_bonus de volta
-- (Use a versão anterior da migration)
```

---

## ✅ Checklist de Implementação

- [x] Reduzir pesos de 0.1 para 0.05
- [x] Adicionar hard filter de localização
- [x] Remover location_bonus do retorno
- [x] Atualizar apply_interests_feature.sql
- [x] Atualizar migration file
- [x] Atualizar documentação
- [x] Atualizar exemplos de cálculo
- [x] Atualizar comentário da função SQL

---

**Última atualização:** 2026-02-13
**Versão:** 2.0.0
