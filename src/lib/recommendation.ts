// Simple TF-IDF based recommendation system
// This runs client-side for the MVP - for production, move to edge function

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

// Tokenize and normalize text
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2);
}

// Calculate term frequency
function termFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  const total = tokens.length;
  
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  
  // Normalize by total tokens
  for (const [term, count] of freq) {
    freq.set(term, count / total);
  }
  
  return freq;
}

// Calculate inverse document frequency
function inverseDocumentFrequency(
  documents: string[][],
  term: string
): number {
  const numDocs = documents.length;
  const docsWithTerm = documents.filter(doc => doc.includes(term)).length;
  
  if (docsWithTerm === 0) return 0;
  return Math.log(numDocs / docsWithTerm);
}

// Calculate TF-IDF vector
function tfidfVector(
  tokens: string[],
  allDocuments: string[][],
  vocabulary: Set<string>
): Map<string, number> {
  const tf = termFrequency(tokens);
  const vector = new Map<string, number>();
  
  for (const term of vocabulary) {
    const tfValue = tf.get(term) || 0;
    const idfValue = inverseDocumentFrequency(allDocuments, term);
    vector.set(term, tfValue * idfValue);
  }
  
  return vector;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(
  vec1: Map<string, number>,
  vec2: Map<string, number>
): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (const [term, val1] of vec1) {
    const val2 = vec2.get(term) || 0;
    dotProduct += val1 * val2;
    norm1 += val1 * val1;
  }
  
  for (const [, val2] of vec2) {
    norm2 += val2 * val2;
  }
  
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;
  
  return dotProduct / denominator;
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
  
  // Build volunteer profile text
  const volunteerText = [
    volunteer.bio || '',
    volunteer.skills || ''
  ].join(' ');
  
  const volunteerTokens = tokenize(volunteerText);
  
  if (volunteerTokens.length === 0) {
    // If no profile info, return random opportunities
    return opportunities.slice(0, topN).map(opp => ({ ...opp, score: 0.5 }));
  }
  
  // Build opportunity texts
  const opportunityTexts = opportunities.map(opp => 
    [opp.titulo, opp.descricao, opp.skills_required || ''].join(' ')
  );
  
  const opportunityTokensList = opportunityTexts.map(tokenize);
  
  // Build vocabulary from all documents
  const allDocuments = [volunteerTokens, ...opportunityTokensList];
  const vocabulary = new Set<string>();
  
  for (const doc of allDocuments) {
    for (const token of doc) {
      vocabulary.add(token);
    }
  }
  
  // Calculate volunteer vector
  const volunteerVector = tfidfVector(volunteerTokens, allDocuments, vocabulary);
  
  // Calculate similarity scores
  const scored = opportunities.map((opp, index) => {
    const oppVector = tfidfVector(opportunityTokensList[index], allDocuments, vocabulary);
    const score = cosineSimilarity(volunteerVector, oppVector);
    
    return { ...opp, score };
  });
  
  // Sort by score descending and return top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
