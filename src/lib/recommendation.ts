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
  location?: string | null;
}

interface VolunteerData {
  bio: string | null;
  skills: string | null;
  locations?: string[] | null;
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
  const volunteerLocations = new Set(
    (volunteer.locations || []).map(loc => loc.toLowerCase())
  );

  const scored = opportunities.map(opp => {
    // Calculate skills match score
    const oppSkills = normalize(opp.skills_required || '');

    let skillScore = 0;
    if (oppSkills.length > 0) {
      let matchCount = 0;
      oppSkills.forEach(skill => {
        if (volunteerSkills.has(skill)) {
          matchCount++;
        }
      });
      skillScore = matchCount / oppSkills.length;
    }

    // Calculate location boost
    let locationBoost = 0;
    if (opp.location && volunteerLocations.size > 0) {
      // If opportunity is in one of volunteer's locations, boost by 0.2
      if (volunteerLocations.has(opp.location.toLowerCase())) {
        locationBoost = 0.2;
      }
    }

    // Final score: skills score + location boost (max 1.2)
    const score = skillScore + locationBoost;

    return { ...opp, score };
  });

  return scored
    .sort((a, b) => b.score - a.score);
}
