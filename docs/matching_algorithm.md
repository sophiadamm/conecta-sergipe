# Documentação Técnica: Algoritmo de Matching de Oportunidades

## 1. Visão Geral e Arquitetura

O sistema de recomendação do Conecta Sergipe utiliza um **Motor de Busca Híbrido** projetado para equilibrar a relevância semântica (o "significado" da vaga e do perfil) com regras de negócios determinísticas (competências técnicas e interesses).

A arquitetura é implementada via Stored Procedure no PostgreSQL (`match_opportunities`), executando todo o cálculo diretamente no banco de dados para máxima performance, evitando transferência desnecessária de dados.

### Componentes do Motor Híbrido:
1.  **Busca Semântica (Vector Search):** Utiliza embeddings gerados por IA (modelo `text-embedding-3-small` ou similar) armazenados via `pgvector`.    *   **Objetivo:** Capturar a "intenção" e nuances da bio (ex: um voluntário que diz "gosto de ajudar crianças" deve dar match com "monitoria escolar" mesmo sem palavras-chave exatas).

### 1.1. Composição dos Embeddings
O vetor semântico (embedding) não é mágico; ele é gerado a partir de um texto concatenado que representa a "identidade" do voluntário ou da vaga.

**Para Voluntários (Profile):**
O texto enviado para a IA é composto por:
> `Nome: {nome} | Bio: {bio} | Habilidades: {skills} | Interesses: {interests}`

**Para Oportunidades (Opportunity):**
O texto vectorizado é composto por:
> `Título: {titulo} | Descrição: {descricao} | Habilidades necessárias: {skills_required} | Causas: {causas}`

**Consequência Prática:**
Sim, a **Bio faz parte da comparação!** Se um voluntário escreve *"tenho experiência liderando equipes em projetos sociais"* na Bio, isso aumentará o match semântico com vagas que mencionem *"liderança"* ou *"coordenação"* na descrição, mesmo que a skill "Liderança" não esteja explicitamente cadastrada nas tags.2.  **Heurística de Regras (Keyword Matching):** Refina o score semântico aplicando bônus e penalidades baseados no alinhamento exato de:
    *   **Skills (Competências):** Hard skills necessárias.
    *   **Interests (Causas):** Áreas de atuação (ex: Educação, Saúde).
3.  **Filtros Rígidos (Hard Filters):** Restrições binárias que eliminam candidatos/vagas antes da pontuação.

---

## 2. Decomposição do Score Final

O algoritmo calcula um `score` final para cada par (Voluntário, Vaga) que varia estritamente entre **0.0 (0%)** e **1.0 (100%)**.

A fórmula geral pode ser expressa como:

$$
Score_{final} = \text{clamp}\left( Score_{semântico} + \Delta_{skills} + \Delta_{interesses}, \ 0.0, \ 1.0 \right)
$$

### 2.1. Score Semântico (Base)
A base do ranking é a Similaridade de Cosseno entre o vetor de embedding do usuário ($V_{user}$) e o da vaga ($V_{opp}$).

$$
Score_{semântico} = 1 - (V_{opp} \Leftrightarrow V_{user})
$$

*   Onde $\Leftrightarrow$ representa a distância de cosseno.
*   O resultado natural varia de -1 a 1, mas com embeddings da OpenAI, tipicamente reside entre 0 e 1.

### 2.2. Bônus e Penalidades (Ajuste Heurístico)
Sobre a base semântica, aplicam-se ajustes aditivos.

#### Bônus de Competências ($\Delta_{skills}$)
Para cada habilidade listada no perfil do voluntário que corresponde aos requisitos da vaga:
*   **Match:** $+0.1$ por skill correspondente.
*   **Sem Correspondência (Crítico):** Se o voluntário *possui* skills listadas mas *nenhuma* bate com a vaga, aplica-se uma penalidade severa de **$-0.2$**.
*   **Neutro:** Se o voluntário ou a vaga não listam skills, o ajuste é $0.0$.

$$
\Delta_{skills} = 
\begin{cases} 
0.1 \times N_{matches} & \text{se } N_{matches} > 0 \\
-0.2 & \text{se } N_{matches} = 0 \text{ AND } \exists \text{skills} \\
0.0 & \text{caso contrário}
\end{cases}
$$

#### Bônus de Interesses ($\Delta_{interesses}$)
Similar às skills, focado no alinhamento entre os interesses do voluntário e as causas da ONG.
*   **Match:** $+0.1$ por interesse correspondente.
*   **Sem Correspondência (Crítico):** Penalidade de **$-0.2$** para evitar sugerir causas irrelevantes ao voluntário.

$$
\Delta_{interesses} = 
\begin{cases} 
0.1 \times N_{matches} & \text{se } N_{matches} > 0 \\
-0.2 & \text{se } N_{matches} = 0 \text{ AND } \exists \text{interesses} \\
0.0 & \text{caso contrário}
\end{cases}
$$

### 2.3. Clamping (Normalização)
Para garantir a consistência da UI (barras de progresso, percentuais), o resultado final é "clampado":
$$
Score_{final} = \min(1.0, \max(0.0, Resultado_{bruto}))
$$

---

## 3. Filtros Rígidos (Hard Filters)

Antes de calcular qualquer score, o sistema aplica filtros excludentes. Atualmente, o filtro primário é a **Localização**.

*   **Lógica:** Se o voluntário definiu localizações de preferência, **apenas** vagas nessas localizações (ou vagas sem local definido/remotas) são retornadas.
*   **Implementação SQL:**
    ```sql
    AND (
      v_locations IS NULL            -- Voluntário sem preferência vê tudo
      OR opp.location IS NULL        -- Vagas sem local (remotas?) aparecem
      OR EXISTS (                    -- Vaga deve estar na lista do voluntário
        SELECT 1 FROM unnest(v_locations) AS loc
        WHERE lower(loc) = lower(opp.location)
      )
    )
    ```

---

## 4. Plano de Testes e Validação

Para garantir a robustez do algoritmo, definimos 4 cenários de teste cruciais.

| Cenário | Descrição do Perfil & Vaga | Resultado Esperado | Análise do Comportamento |
| :--- | :--- | :--- | :--- |
| **A. Match Perfeito** | **Voluntário:** "Professor de Matemática", Skills: ["Ensino", "Matemática"], Interesse: "Educação".<br>**Vaga:** "Tutor de Reforço", Requer: "Matemática", Causa: "Educação". | **Score > 0.9** | A similaridade semântica será alta (~0.8). Somam-se bônus de Skill (+0.1) e Interesse (+0.1), possivelmente atingindo o teto de 1.0. |
| **B. Match Semântico s/ Skills** | **Voluntário:** "Entusiasta de educação", Skills: ["Marketing", "Design"] (Sem "Matemática").<br>**Vaga:** "Professor de Matemática", Requer: "Matemática". | **Score Reduzido (~0.5 - 0.6)** | O texto gera match semântico razoável, mas a **Penalidade de Skill (-0.2)** deve derrubar o score significativamente, alertando que falta a qualificação técnica. |
| **C. Desvio de Interesse** | **Voluntário:** Engenheiro focado em "Meio Ambiente".<br>**Vaga:** Obra social focada em "Saúde" (Construção de hospital). | **Score Penalizado** | Mesmo com skill técnica compatível (Engenharia), a falta de match na causa ("Saúde" vs "Meio Ambiente") aplica **-0.2**, reduzindo a prioridade da vaga. |
| **D. Barreira Geográfica** | **Voluntário:** Localizado em "Aracaju".<br>**Vaga:** Presencial em "Lagarto". | **0 Resultados** | Independente de ser um match perfeito em skills e bio, o Hard Filter de localização deve excluir a vaga do resultado final. |

---

## Notas de Implementação
*   **Performance:** A função utiliza índices GIN para busca vetorial (`embedding vector_cosine_ops`) garantindo escalabilidade.
*   **Flexibilidade:** Os pesos (+0.1 / -0.2) são configurados diretamente na query e podem ser ajustados sem migrações de banco, apenas atualizando a função.
