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
