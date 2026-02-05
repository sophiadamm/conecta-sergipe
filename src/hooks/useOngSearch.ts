import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OngSearchResult {
    id: string;
    nome: string;
    bio: string | null;
    avatar_url: string | null;
    municipio: string | null;
    cause: string | null;
}

export interface SearchFilters {
    query: string;
    category?: string;
}

export function useOngSearch(filters: SearchFilters) {
    return useQuery({
        queryKey: ['ongs-search', filters],
        queryFn: async () => {
            let query = supabase
                .from('profiles')
                .select(`
          id,
          nome,
          bio,
          avatar_url,
          skills
        `)
                .eq('tipo', 'ong');

            // Apply text search filter
            if (filters.query.trim()) {
                const searchTerm = `%${filters.query.trim()}%`;
                query = query.or(
                    `nome.ilike.${searchTerm},bio.ilike.${searchTerm}`
                );
            }

            // Apply category filter
            if (filters.category && filters.category !== 'all') {
                query = query.ilike('skills', `%${filters.category}%`);
            }

            const { data, error } = await query.limit(50);

            if (error) throw error;
            return data as unknown as OngSearchResult[];
        },
        staleTime: 1000 * 30, // 30 seconds
    });
}
