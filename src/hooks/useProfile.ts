import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileData {
  id: string;
  user_id: string;
  nome: string;
  bio: string | null;
  skills: string | null;
  tipo: 'ong' | 'voluntario';
  avatar_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  experience_level: string | null;
  created_at: string;
}

export interface OpportunityData {
  id: string;
  titulo: string;
  descricao: string;
  horas_estimadas: number;
  skills_required: string | null;
  ativa: boolean;
  created_at: string;
  ong_id: string;
}

export interface CompletedMatch {
  id: string;
  horas_validadas: number | null;
  rating: number | null;
  feedback_ong: string | null;
  opportunity: {
    id: string;
    titulo: string;
    ong: {
      id: string;
      nome: string;
    };
  };
}

export interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  opportunity_title: string;
  reviewer: {
    id: string;
    nome: string;
    avatar_url: string | null;
  };
}

export interface ReviewStats {
  avgRating: number;
  totalReviews: number;
  distribution: { stars: number; count: number; percentage: number }[];
}

export function useProfile(profileId: string | undefined) {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: async () => {
      if (!profileId) throw new Error('Profile ID is required');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Profile not found');

      return data as ProfileData;
    },
    enabled: !!profileId,
  });
}

export function useOngOpportunities(ongId: string | undefined) {
  return useQuery({
    queryKey: ['ong-opportunities', ongId],
    queryFn: async () => {
      if (!ongId) return [];

      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('ong_id', ongId)
        .eq('ativa', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OpportunityData[];
    },
    enabled: !!ongId,
  });
}

export function useVolunteerCompletedMatches(volunteerId: string | undefined) {
  return useQuery({
    queryKey: ['volunteer-completed-matches', volunteerId],
    queryFn: async () => {
      if (!volunteerId) return [];

      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          horas_validadas,
          rating,
          feedback_ong,
          opportunity:opportunities!inner(
            id,
            titulo,
            ong:profiles!opportunities_ong_id_fkey(
              id,
              nome
            )
          )
        `)
        .eq('voluntario_id', volunteerId)
        .eq('status', 'concluido');

      if (error) throw error;
      return data as unknown as CompletedMatch[];
    },
    enabled: !!volunteerId,
  });
}

export function useVolunteerReviews(volunteerId: string | undefined) {
  return useQuery({
    queryKey: ['volunteer-reviews', volunteerId],
    queryFn: async () => {
      if (!volunteerId) return [];

      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          rating,
          feedback_ong,
          updated_at,
          opportunity:opportunities!inner(
            titulo,
            ong:profiles!opportunities_ong_id_fkey(
              id,
              nome,
              avatar_url
            )
          )
        `)
        .eq('voluntario_id', volunteerId)
        .eq('status', 'concluido')
        .not('rating', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data as any[]).map(item => ({
        id: item.id,
        rating: item.rating,
        comment: item.feedback_ong,
        created_at: item.updated_at,
        opportunity_title: item.opportunity.titulo,
        reviewer: item.opportunity.ong
      })) as ReviewData[];
    },
    enabled: !!volunteerId,
  });
}

export function calculateReviewStats(reviews: ReviewData[]): ReviewStats {
  if (!reviews || reviews.length === 0) {
    return {
      avgRating: 0,
      totalReviews: 0,
      distribution: [5, 4, 3, 2, 1].map(stars => ({
        stars,
        count: 0,
        percentage: 0,
      })),
    };
  }

  const totalReviews = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = sum / totalReviews;

  // Count ratings per star level
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    counts[r.rating] = (counts[r.rating] || 0) + 1;
  });

  const distribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: counts[stars],
    percentage: (counts[stars] / totalReviews) * 100,
  }));

  return { avgRating, totalReviews, distribution };
}
