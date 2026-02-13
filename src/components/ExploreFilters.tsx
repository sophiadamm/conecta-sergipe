// src/components/ExploreFilters.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import { PREDEFINED_CAUSES } from '@/lib/causes';
import { SERGIPE_CITIES } from '@/lib/locations';
import { Search, X, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


type Props = {
  activeTab?: 'vagas' | 'ongs';
  value: {
    query: string;
    skills: string[];
    minHours: number;
    maxHours: number;
    location: string[];
    causas?: string[];
    minVagas?: number;
    formato?: 'presencial' | 'remoto' | 'hibrido' | null;
    emiteCertificado?: 'sim' | 'nao' | null;
    ofereceTreinamento?: 'sim' | 'nao' | null;
  };
  onChange: (next: Props['value']) => void;
};

export default function ExploreFilters({ value, onChange, activeTab = 'vagas' }: Props) {
  const [query, setQuery] = useState(value.query || '');
  const [skills, setSkills] = useState<string[]>(value.skills || []);
  const [minHours, setMinHours] = useState(value.minHours ?? 0);
  const [maxHours, setMaxHours] = useState(value.maxHours ?? 40);
  const [location, setLocation] = useState<string[]>(value.location || []);
  const [causas, setCausas] = useState<string[]>(value.causas || []);
  const [minVagas, setMinVagas] = useState<number | undefined>(value.minVagas);
  const [formato, setFormato] = useState<'presencial' | 'remoto' | 'hibrido' | null>(value.formato ?? null);
  const [emiteCertificado, setEmiteCertificado] = useState<'sim' | 'nao' | null>(value.emiteCertificado ?? null);
  const [ofereceTreinamento, setOfereceTreinamento] = useState<'sim' | 'nao' | null>(value.ofereceTreinamento ?? null);

  // Sync internal state with props when props change (e.g. initial load or clear from parent)
  useEffect(() => {
    setQuery(value.query || '');
    setSkills(value.skills || []);
    setMinHours(value.minHours ?? 0);
    setMaxHours(value.maxHours ?? 40);
    setLocation(value.location || []);
    setCausas(value.causas || []);
    setMinVagas(value.minVagas);
    setFormato(value.formato ?? null);
    setEmiteCertificado(value.emiteCertificado ?? null);
    setOfereceTreinamento(value.ofereceTreinamento ?? null);
  }, [value]);

  function handleSearch() {
    onChange({
      query,
      skills,
      minHours,
      maxHours,
      location,
      causas,
      minVagas,
      formato,
      emiteCertificado,
      ofereceTreinamento
    });
    try {
      localStorage.setItem('exploreFilters', JSON.stringify({
        query, skills, minHours, maxHours, location, causas, minVagas, formato, emiteCertificado, ofereceTreinamento
      }));
    } catch { }
  }

  function handleClearFilters() {
    // Reset local state
    setQuery('');
    setSkills([]);
    setMinHours(0);
    setMaxHours(40);
    setLocation([]);
    setCausas([]);
    setMinVagas(undefined);
    setFormato(null);
    setEmiteCertificado(null);
    setOfereceTreinamento(null);

    // Trigger update immediately
    onChange({
      query: '',
      skills: [],
      minHours: 0,
      maxHours: 40,
      location: [],
      causas: [],
      minVagas: undefined,
      formato: null,
      emiteCertificado: null,
      ofereceTreinamento: null
    });

    try {
      localStorage.removeItem('exploreFilters');
    } catch { }
  }

  const hasFilters = query || skills.length > 0 || minHours > 0 || maxHours < 40 || location.length > 0 ||
    causas.length > 0 || minVagas !== undefined || formato !== null ||
    emiteCertificado !== null || ofereceTreinamento !== null;

  const activeFiltersCount = [
    query ? 1 : 0,
    skills.length > 0 ? 1 : 0,
    minHours > 0 || maxHours < 40 ? 1 : 0,
    location.length > 0 ? 1 : 0,
    causas.length > 0 ? 1 : 0,
    minVagas ? 1 : 0,
    formato ? 1 : 0,
    emiteCertificado ? 1 : 0,
    ofereceTreinamento ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {activeTab === 'ongs' ? 'Filtrar ONGs' : 'Filtrar Vagas'}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Text Search */}
        <div className="space-y-2">
          <Label htmlFor="search-query">{activeTab === 'ongs' ? 'Nome da ONG' : 'Buscar'}</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-query"
              placeholder={activeTab === 'ongs' ? "Ex: Instituição..." : "Ex: alfabetização, educação..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Causas/Área de Atuação Multi-Select */}
        <div className="space-y-2">
          <Label htmlFor="causas-filter">Causa/Área de Atuação</Label>
          <MultiSelect
            options={PREDEFINED_CAUSES as unknown as string[]}
            selected={causas}
            onChange={setCausas}
            placeholder="Selecione causas..."
          />
          <p className="text-xs text-muted-foreground">
            Selecione uma ou mais áreas
          </p>
        </div>

        {/* Location Filter - Keep for both */}
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

        {/* Vagas-specific filters */}
        {activeTab === 'vagas' && (
          <>
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
                Selecione uma ou mais habilidades
              </p>
            </div>

            {/* Minimum Vagas */}
            <div className="space-y-2">
              <Label htmlFor="min-vagas">Mínimo de vagas disponíveis</Label>
              <Input
                id="min-vagas"
                type="number"
                min={1}
                value={minVagas ?? ''}
                onChange={(e) => setMinVagas(e.target.value === '' ? undefined : Math.max(1, Number(e.target.value)))}
                placeholder="Ex: 2"
              />
            </div>

            {/* Formato Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Formato</Label>
                {formato && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormato(null)}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Limpar
                  </Button>
                )}
              </div>
              <RadioGroup value={formato ?? ''} onValueChange={(val) => setFormato(val as any || null)}>
                <div className={`flex items-center space-x-2 p-2 rounded-md border transition-colors ${formato === 'presencial' ? 'border-primary bg-primary/5' : 'border-transparent'}`}>
                  <RadioGroupItem value="presencial" id="formato-presencial" />
                  <Label htmlFor="formato-presencial" className="font-normal cursor-pointer flex-1">
                    Presencial
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 p-2 rounded-md border transition-colors ${formato === 'remoto' ? 'border-primary bg-primary/5' : 'border-transparent'}`}>
                  <RadioGroupItem value="remoto" id="formato-remoto" />
                  <Label htmlFor="formato-remoto" className="font-normal cursor-pointer flex-1">
                    Remoto
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 p-2 rounded-md border transition-colors ${formato === 'hibrido' ? 'border-primary bg-primary/5' : 'border-transparent'}`}>
                  <RadioGroupItem value="hibrido" id="formato-hibrido" />
                  <Label htmlFor="formato-hibrido" className="font-normal cursor-pointer flex-1">
                    Híbrido
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Emite Certificado */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Emite Certificado?</Label>
                {emiteCertificado && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEmiteCertificado(null)}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Limpar
                  </Button>
                )}
              </div>
              <RadioGroup value={emiteCertificado ?? ''} onValueChange={(val) => setEmiteCertificado(val as any || null)}>
                <div className={`flex items-center space-x-2 p-2 rounded-md border transition-colors ${emiteCertificado === 'sim' ? 'border-primary bg-primary/5' : 'border-transparent'}`}>
                  <RadioGroupItem value="sim" id="cert-sim" />
                  <Label htmlFor="cert-sim" className="font-normal cursor-pointer flex-1">
                    Sim
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 p-2 rounded-md border transition-colors ${emiteCertificado === 'nao' ? 'border-primary bg-primary/5' : 'border-transparent'}`}>
                  <RadioGroupItem value="nao" id="cert-nao" />
                  <Label htmlFor="cert-nao" className="font-normal cursor-pointer flex-1">
                    Não
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Padrão: Indiferente
              </p>
            </div>

            {/* Oferece Treinamento */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Oferece Treinamento?</Label>
                {ofereceTreinamento && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOfereceTreinamento(null)}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Limpar
                  </Button>
                )}
              </div>
              <RadioGroup value={ofereceTreinamento ?? ''} onValueChange={(val) => setOfereceTreinamento(val as any || null)}>
                <div className={`flex items-center space-x-2 p-2 rounded-md border transition-colors ${ofereceTreinamento === 'sim' ? 'border-primary bg-primary/5' : 'border-transparent'}`}>
                  <RadioGroupItem value="sim" id="trein-sim" />
                  <Label htmlFor="trein-sim" className="font-normal cursor-pointer flex-1">
                    Sim
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 p-2 rounded-md border transition-colors ${ofereceTreinamento === 'nao' ? 'border-primary bg-primary/5' : 'border-transparent'}`}>
                  <RadioGroupItem value="nao" id="trein-nao" />
                  <Label htmlFor="trein-nao" className="font-normal cursor-pointer flex-1">
                    Não
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Padrão: Indiferente
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
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {hasFilters && (
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleClearFilters}
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}
          <Button
            className="flex-1 gap-2"
            onClick={handleSearch}
          >
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
