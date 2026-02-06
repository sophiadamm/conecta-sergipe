// src/hooks/useOpportunitySearch.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchFilters {
  query?: string;
  skills?: string[];
  minHours?: number;
  maxHours?: number;
  location?: string[];
}

export interface SearchResult {
  id: string;
  titulo: string;
  descricao: string;
  horas_estimadas: number;
  skills_required: string | null;
  location: string | null;
  created_at: string;
  ong: { id: string; nome: string; avatar_url: string | null };
  compatibilityScore?: number;
  matchExplanation?: string;
}

function norm(s?: string | null) {
  if (!s) return '';
  return s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function parseCsvToArray(raw?: string | null) {
  if (!raw) return [] as string[];
  return raw.toString().split(',').map(s => norm(s)).filter(Boolean);
}

export function useOpportunitySearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ['opportunities-search', filters],
    queryFn: async () => {
      const limitFetch = 200;
      const pageLimit = 50;

      let queryBuilder = supabase
        .from('opportunities')
        .select(`
          id, titulo, descricao, horas_estimadas, skills_required, location, created_at,
          ong:profiles!opportunities_ong_id_fkey(id, nome, avatar_url)
        `)
        .eq('ativa', true)
        .order('created_at', { ascending: false });

      // Apply server-side hours filter
      if (typeof filters.minHours === 'number') {
        queryBuilder = queryBuilder.gte('horas_estimadas', filters.minHours);
      }
      if (typeof filters.maxHours === 'number') {
        queryBuilder = queryBuilder.lte('horas_estimadas', filters.maxHours);
      }

      // Apply location filter (OR logic for multiple cities)
      if (filters.location && filters.location.length > 0) {
        queryBuilder = queryBuilder.in('location', filters.location);
      }

      // Text search filter (titulo, descricao, skills_required)
      const rawQuery = (filters.query || '').trim();
      if (rawQuery && rawQuery.length >= 2) {
        const escaped = rawQuery.replace(/%/g, '\\%');
        queryBuilder = queryBuilder.or(`titulo.ilike.%${escaped}%,descricao.ilike.%${escaped}%,skills_required.ilike.%${escaped}%`);
      }

      const { data, error } = await queryBuilder.limit(limitFetch);
      if (error) throw error;
      const rows = (data ?? []) as any[];

      // Client-side skills filtering - OR logic (at least one skill must match)
      const selectedSkills = (filters.skills || []).map(s => norm(s));
      const filtered = rows.filter(r => {
        if (selectedSkills.length === 0) return true;
        const oppSkills = parseCsvToArray(r.skills_required ?? null);
        // Return true if ANY selected skill is in opportunity skills (OR logic)
        return selectedSkills.some(sk => oppSkills.includes(sk));
      });

      // Build compatibility score
      const scored = filtered.map(r => {
        const oppSkills = parseCsvToArray(r.skills_required ?? null);
        const overlap = selectedSkills.filter(sk => oppSkills.includes(sk)).length;
        const skillScore = selectedSkills.length ? (overlap / selectedSkills.length) * 70 : 0;
        const days = Math.floor((Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const recencyScore = Math.max(0, Math.round((1 - Math.min(days, 30) / 30) * 30));
        const score = Math.round(Math.min(100, skillScore + recencyScore));

        const explanationParts = [];
        if (overlap > 0) explanationParts.push(`${overlap} habilidade${overlap > 1 ? 's' : ''} em comum`);
        if (recencyScore > 10) explanationParts.push('Vaga recente');
        if (r.location) explanationParts.push(r.location);

        return {
          ...r,
          compatibilityScore: score,
          matchExplanation: explanationParts.join(' • ') || 'Sem correspondências'
        } as SearchResult;
      });

      scored.sort((a, b) => (b.compatibilityScore ?? 0) - (a.compatibilityScore ?? 0));

      return scored.slice(0, pageLimit) as SearchResult[];
    },
    staleTime: 1000 * 30,
  });
}
