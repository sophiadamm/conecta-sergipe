// src/components/ExploreFilters.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import { SERGIPE_CITIES } from '@/lib/locations';
import { Search, X } from 'lucide-react';

type Props = {
  value: {
    query: string;
    skills: string[];
    minHours: number;
    maxHours: number;
    location: string[];
  };
  onChange: (next: Props['value']) => void;
};

export default function ExploreFilters({ value, onChange }: Props) {
  const [query, setQuery] = useState(value.query || '');
  const [skills, setSkills] = useState<string[]>(value.skills || []);
  const [minHours, setMinHours] = useState(value.minHours ?? 0);
  const [maxHours, setMaxHours] = useState(value.maxHours ?? 40);
  const [location, setLocation] = useState<string[]>(value.location || []);

  useEffect(() => {
    // Sync changes to parent
    const t = setTimeout(() => {
      onChange({ query, skills, minHours, maxHours, location });
      try {
        localStorage.setItem('exploreFilters', JSON.stringify({ query, skills, minHours, maxHours, location }));
      } catch { }
    }, 200);
    return () => clearTimeout(t);
  }, [query, skills, minHours, maxHours, location, onChange]);

  function handleClearFilters() {
    setQuery('');
    setSkills([]);
    setMinHours(0);
    setMaxHours(40);
    setLocation([]);
    onChange({ query: '', skills: [], minHours: 0, maxHours: 40, location: [] });
    try {
      localStorage.removeItem('exploreFilters');
    } catch { }
  }

  const hasFilters = query || skills.length > 0 || minHours > 0 || maxHours < 40 || location.length > 0;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Text Search */}
        <div className="space-y-2">
          <Label htmlFor="search-query">Buscar</Label>
          <Input
            id="search-query"
            placeholder="Ex: alfabetização, educação..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Skills Multi-Select */}
        <div className="space-y-2">
          <Label htmlFor="skills-filter">Habilidades</Label>
          <MultiSelect
            options={PREDEFINED_SKILLS as unknown as string[]}
            selected={skills}
            onChange={setSkills}
            placeholder="Selecione habilidades..."
          />
          <p className="text-xs text-muted-foreground">
            Selecione uma ou mais habilidades (lógica OR)
          </p>
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <Label htmlFor="location-filter">Localização</Label>
          <MultiSelect
            options={SERGIPE_CITIES as unknown as string[]}
            selected={location}
            onChange={setLocation}
            placeholder="Selecione cidades..."
          />
          <p className="text-xs text-muted-foreground">
            Selecione uma ou mais cidades
          </p>
        </div>

        {/* Hours Range */}
        <div className="space-y-2">
          <Label>Horas estimadas</Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={80}
              className="w-20"
              value={minHours === 0 ? '' : minHours}
              onChange={(e) => setMinHours(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
              placeholder="0"
              aria-label="Horas mínimas"
            />
            <span className="text-sm text-muted-foreground">até</span>
            <Input
              type="number"
              min={0}
              max={80}
              className="w-20"
              value={maxHours === 40 ? '' : maxHours}
              onChange={(e) => setMaxHours(e.target.value === '' ? 40 : Math.max(0, Number(e.target.value)))}
              placeholder="40"
              aria-label="Horas máximas"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasFilters && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleClearFilters}
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
