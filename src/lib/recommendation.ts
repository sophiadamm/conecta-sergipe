// Tokenize and normalize text
function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

interface OpportunityData {
  id: string;
  titulo: string;
  descricao: string;
  skills_required: string | null;
  horas_estimadas: number;
  ong_nome?: string;
}

interface VolunteerData {
  bio: string | null;
  skills: string | null;
}

export interface RecommendedOpportunity extends OpportunityData {
  score: number;
}

export function getRecommendations(
  volunteer: VolunteerData,
  opportunities: OpportunityData[],
  topN: number = 5
): RecommendedOpportunity[] {
  if (opportunities.length === 0) return [];

  const volunteerSkills = new Set(normalize(volunteer.skills || ''));

  const scored = opportunities.map(opp => {
    // If opportunity has no skills required, it's a generic match (low but non-zero score?)
    // Or maybe 0? Let's say 0.1 to show it if needed, or 0 if we really want strict matching.
    // The requirement is "calculate percentage based on intersection".
    // If skills_required is empty, we can't really match well.

    const oppSkills = normalize(opp.skills_required || '');

    if (oppSkills.length === 0) {
      return { ...opp, score: 0 };
    }

    let matchCount = 0;
    oppSkills.forEach(skill => {
      // Check if volunteer has this skill (case insensitive check was done by normalize)
      // But wait, our normalize lowercases everything? Yes.
      if (volunteerSkills.has(skill)) {
        matchCount++;
      }
    });

    const score = matchCount / oppSkills.length;
    return { ...opp, score };
  });

  return scored
    .sort((a, b) => b.score - a.score);
  // .slice(0, topN); // We might want to filter by threshold instead of slicing, or slice after filtering
}
