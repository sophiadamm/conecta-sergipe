import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  titulo: string;
  descricao: string;
  horas_estimadas: number;
  skills_required: string | null;
  created_at: string;
  ong: {
    id: string;
    nome: string;
    avatar_url: string | null;
  };
  compatibilityScore: number;
  matchExplanation: string;
}

export interface SearchFilters {
  query: string;
  category: string;
}

const CATEGORIES = [
  { value: 'all', label: 'Todas as categorias' },
  { value: 'saúde', label: 'Saúde' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'educação', label: 'Educação' },
  { value: 'meio ambiente', label: 'Meio Ambiente' },
  { value: 'cultura', label: 'Cultura' },
  { value: 'social', label: 'Assistência Social' },
  { value: 'esportes', label: 'Esportes' },
  { value: 'jurídico', label: 'Jurídico' },
];

export { CATEGORIES };

export function useOpportunitySearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ['opportunities-search', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_ranked_opportunities', {
        p_query: filters.query.trim(),
        p_category: filters.category
      });

      if (error) throw error;

      // Transformar o resultado flat do RPC no formato aninhado esperado pela UI
      return (data as any[]).map(item => ({
        id: item.id,
        titulo: item.titulo,
        descricao: item.descricao,
        horas_estimadas: item.horas_estimadas,
        skills_required: item.skills_required,
        created_at: item.created_at,
        compatibilityScore: item.compatibility_score,
        matchExplanation: item.match_explanation,
        ong: {
          id: item.ong_id,
          nome: item.ong_nome,
          avatar_url: item.ong_avatar_url
        }
      })) as SearchResult[];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}
