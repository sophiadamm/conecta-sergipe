# Conecta Sergipe - Plataforma de Voluntariado Inteligente (MVP)

## 🚀 Sobre o Projeto
O **Conecta Sergipe** é uma solução tecnológica focada em conectar **ONGs** e **voluntários** no estado de Sergipe. Concebido como um MVP (Produto Mínimo Viável), o projeto tem como objetivo principal a validação do fluxo de engajamento social e a implementação de algoritmos de recomendação eficazes para unir quem quer ajudar a quem precisa de ajuda.

## ✨ Principais Funcionalidades
### 👤 Para Voluntários
*   **Cadastro de Perfil Completo**: Definição detalhada de skills técnicas, experiências prévias e causas de interesse.
*   **Oportunidades Recomendadas**: Algoritmo inteligente que ordena as vagas por compatibilidade, destacando aquelas que melhor se alinham ao seu perfil.
*   **Busca Multidimensional**: Filtros avançados por localização (Aracaju, Itabaiana, Lagarto, etc.), causas sociais, habilidades requeridas, modalidade (presencial/remoto), entre outros.
*   **Portfólio de Impacto**: Histórico visual das contribuições realizadas, horas doadas e projetos impactados.
*   **Avaliação de Experiência**: Sistema de feedback para avaliar a organização e a experiência durante o voluntariado.

### 🏢 Para ONGs
*   **Gestão de Perfil Institucional**: Página dedicada para divulgar a missão, visão e impacto da organização.
*   **Criação de Vagas Estruturadas**: Publicação de oportunidades com requisitos técnicos, comportamentais e benefícios claros.
*   **Gestão de Candidaturas**: Visualização e gestão de voluntários interessados.
*   **Feedback de Voluntários**: Avaliação do desempenho e comprometimento dos voluntários após a conclusão das atividades.

## 🧠 Destaque Técnico: O Motor de Matching Híbrido

O algoritmo de recomendação do Conecta Sergipe é atualmente executado através da Stored Procedure `match_opportunities` no banco de dados.

Ele utiliza uma abordagem **Híbrida**, combinando:
1.  **Busca Semântica**: Utilizando `pgvector` para comparar embeddings vetoriais de descrições e perfis.
2.  **Heurísticas de Regra de Negócio**: Aplicação de pesos manuais para garantir relevância prática.

### Lógica de Pontuação (Weights)
O algoritmo prioriza conexões de alta qualidade através de um sistema de bônus e penalidades:

*   🟢 **Bônus de Afinidade**: **+0.1** na pontuação final para cada *Skill* ou *Interesse* em comum entre o voluntário e a vaga.
*   🔴 **Penalidade Crítica**: **-0.2** na pontuação se houver falta de afinidade (ex: ausência total de skills compatíveis), prevenindo recomendações irrelevantes.
*   📍 **Hard Filter de Localização**: Vagas fora da cidade do voluntário (ou sem compatibilidade remota) são descartadas imediatamente.

## 🛠️ Tech Stack Atualizado

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Shadcn UI |
| **Backend as a Service** | Supabase (Authentication, Database) |
| **AI & Data** | Supabase Vector (pgvector) para embeddings e busca semântica |
