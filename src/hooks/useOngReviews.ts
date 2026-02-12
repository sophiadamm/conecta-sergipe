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

export interface UseOngReviewsResult {
  reviews: OngReview[];
  avgRating: number;
  totalCount: number;
  loading: boolean;
  error: Error | null;
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

      // 2. Matches com avaliação do voluntário (rating_voluntario IS NOT NULL)
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

  return {
    reviews,
    avgRating,
    totalCount,
    loading,
    error: error as Error | null,
  };
}
