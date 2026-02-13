# Sistema de Áreas de Interesse - Implementação Completa

## 📋 Resumo

Este documento descreve a implementação do sistema de **Áreas de Interesse** para voluntários, que aprimora o algoritmo de matching entre voluntários e oportunidades.

---

## 🎯 Objetivos Alcançados

1. ✅ Permitir que voluntários selecionem causas de interesse (Educação, Saúde, Meio Ambiente, etc.)
2. ✅ Incluir interesses na geração de embeddings semânticos
3. ✅ Adicionar bônus de pontuação para vagas que correspondem aos interesses do voluntário
4. ✅ Manter compatibilidade com o sistema existente de skills e localização

---

## 🗄️ Mudanças no Banco de Dados

### Nova Coluna: `profiles.interests`

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS interests text;
```

- **Tipo**: `text` (armazena valores separados por vírgula)
- **Exemplo**: `"Educação, Saúde, Tecnologia"`
- **Uso**: Apenas para perfis de tipo `voluntario`

### Arquivos de Migration

1. `supabase/migrations/20260213000000_add_interests_column.sql`
2. `supabase/migrations/20260213000001_update_match_opportunities_with_interests.sql`

---

## 🎨 Mudanças no Frontend

### 1. Interface TypeScript (`useAuth.tsx`)

Adicionado campo `interests` à interface `Profile`:

```typescript
interface Profile {
  // ... campos existentes
  interests: string | null;
}
```

### 2. Formulário de Perfil (`Profile.tsx`)

**Novo campo adicionado:**

- **Label**: "Áreas de Interesse"
- **Componente**: `MultiSelect`
- **Fonte de Dados**: `PREDEFINED_CAUSES` (mesma lista usada pelas ONGs)
- **Posicionamento**: Entre "Habilidades" e "Localização" (apenas para voluntários)

**Exemplo de uso:**
```typescript
<Controller
  name="interests"
  control={form.control}
  render={({ field }) => (
    <MultiSelect
      options={Object.values(PREDEFINED_CAUSES)}
      selected={field.value ? field.value.split(',').map(s => s.trim()).filter(Boolean) : []}
      onChange={(selected) => field.onChange(selected.join(','))}
      placeholder="Selecione as causas de seu interesse..."
    />
  )}
/>
```

### 3. Geração de Embeddings (`embeddings.ts`)

**Função `buildProfileText` atualizada:**

```typescript
export function buildProfileText(profile: { 
  nome?: string | null; 
  bio?: string | null; 
  skills?: string | null; 
  interests?: string | null 
}): string {
  const parts: string[] = [];
  if (profile.nome) parts.push(`Nome: ${profile.nome}`);
  if (profile.skills) parts.push(`Habilidades: ${profile.skills}`);
  if (profile.interests) parts.push(`Interesses: ${profile.interests}`);
  if (profile.bio) parts.push(`Bio: ${profile.bio}`);
  return parts.join(' | ');
}
```

**Formato do texto gerado:**
```
Nome: João Silva | Habilidades: Python, JavaScript | Interesses: Educação, Tecnologia | Bio: Desenvolvedor...
```

---

## 🧮 Algoritmo de Matching Aprimorado

### Nova Função RPC: `match_opportunities`

A função SQL foi completamente reescrita para incluir múltiplos fatores de pontuação:

#### Componentes do Score Final

| Componente | Peso | Descrição |
|------------|------|-----------|
| **Similaridade Semântica** | Base (0-1) | Distância cosseno entre embeddings |
| **Bônus de Skills** | +0.05 por skill | Cada habilidade em comum |
| **Penalidade de Skills** | -0.05 | Se nenhuma skill corresponder |
| **Bônus de Interesses** | +0.05 por interesse | Cada causa em comum |
| **Filtro de Localização** | Hard Filter | Vaga DEVE estar nas localizações do usuário |

**Nota:** O filtro de localização é **obrigatório** - vagas fora das localizações do usuário não são retornadas, independentemente do score.

#### Fórmula do Score

```
Score = CLAMP(
  Similaridade_Semântica 
  + (Skills_Match × 0.05)
  + (Interests_Match × 0.05)
  - (Skills_Penalty × 0.05),
  min: 0.0,
  max: 1.0
)

WHERE location IN user_locations  -- Hard filter
```

**Nota:** O score é matematicamente limitado entre 0.0 e 1.0 usando `LEAST(1.0, GREATEST(0.0, ...))` para evitar valores acima de 100% ou negativos.

#### Exemplos de Cálculo

**Exemplo 1: Match Perfeito (localização OK)**
- Similaridade semântica: 0.85
- 3 skills em comum: +0.15 (3 × 0.05)
- 2 interesses em comum: +0.10 (2 × 0.05)
- Localização: ✅ Match (hard filter passou)
- **Cálculo bruto: 1.10**
- **Score Final (clamped): 1.00** ⭐⭐⭐ (limitado a 100%)

**Exemplo 2: Match Parcial (localização OK)**
- Similaridade semântica: 0.70
- 1 skill em comum: +0.05
- 1 interesse em comum: +0.05
- Localização: ✅ Match (hard filter passou)
- **Cálculo bruto: 0.80**
- **Score Final: 0.80** ⭐⭐

**Exemplo 3: Sem Skills mas com Interesses (localização OK)**
- Similaridade semântica: 0.75
- Nenhuma skill em comum: -0.05 (penalidade)
- 2 interesses em comum: +0.10 (2 × 0.05)
- Localização: ✅ Match (hard filter passou)
- **Cálculo bruto: 0.80**
- **Score Final: 0.80** ⭐⭐

**Exemplo 4: Localização Incompatível**
- Similaridade semântica: 0.95
- 5 skills em comum: +0.25 (5 × 0.05)
- 3 interesses em comum: +0.15 (3 × 0.05)
- Localização: ❌ Não match
- **Score Final: N/A** - Vaga não é retornada (filtrada pelo hard filter)

**Exemplo 5: Score Muito Baixo (localização OK)**
- Similaridade semântica: 0.05
- Nenhuma skill em comum: -0.05
- Nenhum interesse em comum: 0.0
- Localização: ✅ Match (hard filter passou)
- **Cálculo bruto: 0.00**
- **Score Final (clamped): 0.00**

---

## 🔍 Lógica de Interesses vs Skills

### Diferenças Importantes

| Aspecto | Skills | Interesses |
|---------|--------|------------|
| **Penalidade** | Sim (-0.1 se nenhum match) | Não |
| **Importância** | Crítica (técnica) | Motivacional |
| **Fonte** | `PREDEFINED_SKILLS` | `PREDEFINED_CAUSES` |
| **Coluna DB** | `skills_required` (texto) | `causas` (array) |

### Por que Skills têm penalidade?

Skills são **requisitos técnicos** necessários para executar a vaga. Se um voluntário não possui nenhuma das habilidades requeridas, a vaga provavelmente não é adequada.

### Por que Interesses não têm penalidade?

Interesses são **motivacionais**. Um voluntário pode estar disposto a trabalhar em causas fora de seus interesses principais se a vaga for tecnicamente adequada.

---

## 📊 Retorno da Função RPC

A função `match_opportunities` agora retorna:

```typescript
{
  id: uuid,
  titulo: string,
  descricao: string,
  skills_required: string,
  horas_estimadas: number,
  location: string,
  ong_id: uuid,
  ong_nome: string,
  semantic_score: number,      // Novo
  skills_bonus: number,         // Novo
  interests_bonus: number,      // Novo
  location_bonus: number,       // Novo
  score: number                 // Atualizado
}
```

---

## 🚀 Como Aplicar as Mudanças

### 1. Aplicar Migrations no Supabase

Execute o script consolidado no **SQL Editor** do Supabase:

```bash
# Arquivo: apply_interests_feature.sql
```

Ou execute as migrations individuais:

```bash
supabase db reset
# ou
supabase migration up
```

### 2. Testar o Sistema

1. **Edite um perfil de voluntário**
   - Vá para `/profile`
   - Selecione algumas "Áreas de Interesse"
   - Salve o perfil

2. **Verifique o embedding**
   - O texto gerado deve incluir os interesses
   - O embedding será recalculado automaticamente

3. **Teste o matching**
   - Vá para o Dashboard do voluntário
   - Verifique se as vagas recomendadas correspondem aos interesses
   - Vagas com causas correspondentes devem ter score mais alto

---

## 🧪 Casos de Teste Sugeridos

### Teste 1: Voluntário com Interesses
```
Perfil:
- Skills: "Python, JavaScript"
- Interesses: "Educação, Tecnologia"

Vaga A:
- Skills: "Python"
- Causas: ["Educação"]
- Score esperado: Alto (skill + interesse match)

Vaga B:
- Skills: "Python"
- Causas: ["Saúde"]
- Score esperado: Médio (skill match, sem interesse match)

Vaga C:
- Skills: "Design"
- Causas: ["Educação"]
- Score esperado: Baixo (interesse match, mas skill penalty)
```

### Teste 2: Voluntário sem Interesses
```
Perfil:
- Skills: "Python"
- Interesses: null

Vaga:
- Skills: "Python"
- Causas: ["Educação"]
- Score esperado: Médio (skill match, sem bônus de interesse)
```

---

## 📝 Notas Técnicas

### Conversão de Dados

**Interesses (Profile):**
- Armazenado como: `text` (CSV)
- Exemplo: `"Educação, Saúde, Tecnologia"`
- Conversão SQL: `string_to_array(lower(v_interests), ',')`

**Causas (Opportunity):**
- Armazenado como: `text[]` (array)
- Exemplo: `["Educação", "Tecnologia"]`
- Conversão SQL: `unnest(opp.causas)`

### Normalização

Todas as comparações são feitas em **lowercase** e com **trim** para evitar problemas de case-sensitivity e espaços extras.

---

## 🎓 Próximos Passos Sugeridos

1. **Analytics**: Adicionar métricas para rastrear quantos matches são feitos por interesse
2. **UI Enhancement**: Mostrar badges de "Match de Interesse" nas vagas
3. **Notificações**: Alertar voluntários quando novas vagas em suas áreas de interesse forem criadas
4. **Pesos Ajustáveis**: Permitir que administradores ajustem os pesos dos componentes do score

---

## ✅ Checklist de Implementação

- [x] Adicionar coluna `interests` ao banco
- [x] Atualizar interface TypeScript `Profile`
- [x] Adicionar campo no formulário de perfil
- [x] Atualizar `buildProfileText` para incluir interesses
- [x] Reescrever função `match_opportunities` com bônus de interesses
- [x] Criar migrations SQL
- [x] Criar script consolidado de aplicação
- [x] Documentar mudanças

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do Supabase SQL Editor
2. Confirme que as migrations foram aplicadas com sucesso
3. Teste com dados de exemplo antes de usar em produção

---

**Última atualização**: 2026-02-13
**Versão**: 1.0.0
