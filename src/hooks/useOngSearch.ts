import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OngSearchResult {
    id: string;
    nome: string;
    bio: string | null;
    avatar_url: string | null;
    locations: string[] | null;
    skills: string | null;
}

export interface SearchFilters {
    query: string;
    location?: string[];
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
          locations,
          skills
        `)
                .eq('tipo', 'ong');

            // Apply text search filter (nome, bio)
            if (filters.query.trim()) {
                const searchTerm = `%${filters.query.trim()}%`;
                query = query.or(
                    `nome.ilike.${searchTerm},bio.ilike.${searchTerm}`
                );
            }

            // Apply category/skills filter
            if (filters.category && filters.category !== 'all') {
                query = query.ilike('skills', `%${filters.category}%`);
            }

            const { data, error } = await query.limit(50);

            if (error) throw error;

            let results = data as unknown as OngSearchResult[];

            // Client-side location filter (check if any selected city is in ONG's locations array)
            if (filters.location && filters.location.length > 0) {
                results = results.filter(ong => {
                    if (!ong.locations) return false;
                    // Return true if ONG has at least one of the selected cities
                    return filters.location!.some(city => ong.locations!.includes(city));
                });
            }

            return results;
        },
        staleTime: 1000 * 30, // 30 seconds
    });
}
