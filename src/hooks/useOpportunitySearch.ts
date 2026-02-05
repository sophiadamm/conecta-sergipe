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
      let query = supabase
        .from('opportunities')
        .select(`
          id,
          titulo,
          descricao,
          horas_estimadas,
          skills_required,
          created_at,
          ong:profiles!opportunities_ong_id_fkey(
            id,
            nome,
            avatar_url
          )
        `)
        .eq('ativa', true)
        .order('created_at', { ascending: false });

      // Apply text search filter
      if (filters.query.trim()) {
        const searchTerm = `%${filters.query.trim()}%`;
        query = query.or(
          `titulo.ilike.${searchTerm},descricao.ilike.${searchTerm},skills_required.ilike.${searchTerm}`
        );
      }

      // Apply category filter
      if (filters.category && filters.category !== 'all') {
        query = query.or(
          `skills_required.ilike.%${filters.category}%,descricao.ilike.%${filters.category}%`
        );
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data as unknown as SearchResult[];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}
