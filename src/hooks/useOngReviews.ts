import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OngReview {
  id: string;
  rating_voluntario: number;
  feedback_voluntario: string | null;
  updated_at: string;
  voluntario_id: string;
  opportunity_id: string;
  voluntario: {
    id: string;
    nome: string;
    avatar_url: string | null;
  } | null;
  opportunity: {
    id: string;
    titulo: string;
  } | null;
}

export interface OngReviewStats {
  avgRating: number;
  totalReviews: number;
  distribution: { stars: number; count: number; percentage: number }[];
}

export interface UseOngReviewsResult {
  reviews: OngReview[];
  avgRating: number;
  totalCount: number;
  stats: OngReviewStats;
  loading: boolean;
  error: Error | null;
}

function calculateOngReviewStats(reviews: OngReview[]): OngReviewStats {
  if (!reviews || reviews.length === 0) {
    return {
      avgRating: 0,
      totalReviews: 0,
      distribution: [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: 0,
        percentage: 0,
      })),
    };
  }
  const totalReviews = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + r.rating_voluntario, 0);
  const avgRating = sum / totalReviews;
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    counts[r.rating_voluntario] = (counts[r.rating_voluntario] ?? 0) + 1;
  });
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars],
    percentage: (counts[stars] / totalReviews) * 100,
  }));
  return { avgRating, totalReviews, distribution };
}

/**
 * Busca as avaliações que a ONG recebeu dos voluntários.
 * Fonte: matches com rating_voluntario preenchido, onde a opportunity pertence à ONG.
 */
export function useOngReviews(ongId: string | undefined): UseOngReviewsResult {
  const {
    data,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['ong-reviews', ongId],
    queryFn: async (): Promise<OngReview[]> => {
      if (!ongId) return [];

      // 1. IDs das oportunidades desta ONG
      const { data: opps, error: oppsError } = await supabase
        .from('opportunities')
        .select('id')
        .eq('ong_id', ongId);

      if (oppsError) throw oppsError;
      const opportunityIds = (opps || []).map((o) => o.id);
      if (opportunityIds.length === 0) return [];

      // 2. Matches concluídos com avaliação do voluntário (rating_voluntario IS NOT NULL)
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          rating_voluntario,
          feedback_voluntario,
          updated_at,
          voluntario_id,
          opportunity_id,
          voluntario:profiles!matches_voluntario_id_fkey(id, nome, avatar_url),
          opportunity:opportunities(id, titulo)
        `)
        .in('opportunity_id', opportunityIds)
        .eq('status', 'concluido')
        .not('rating_voluntario', 'is', null)
        .order('updated_at', { ascending: false });

      if (matchesError) throw matchesError;

      const list = (matchesData || []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        rating_voluntario: m.rating_voluntario as number,
        feedback_voluntario: m.feedback_voluntario as string | null,
        updated_at: m.updated_at as string,
        voluntario_id: m.voluntario_id as string,
        opportunity_id: m.opportunity_id as string,
        voluntario: (m.voluntario as OngReview['voluntario']) ?? null,
        opportunity: (m.opportunity as OngReview['opportunity']) ?? null,
      }));

      return list;
    },
    enabled: !!ongId,
  });

  const reviews = data ?? [];
  const totalCount = reviews.length;
  const avgRating =
    totalCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating_voluntario, 0) / totalCount
      : 0;
  const stats = calculateOngReviewStats(reviews);

  return {
    reviews,
    avgRating,
    totalCount,
    stats,
    loading,
    error: error as Error | null,
  };
}
