// src/components/ExploreFilters.tsx
import React, { useEffect, useState } from 'react';

type Props = {
  value: {
    query: string;
    skills: string[];
    minHours: number;
    maxHours: number;
  };
  onChange: (next: Props['value']) => void;
};

const SUGGESTED_SKILLS = ['educacao','ensino','react','node','gestao','comunicacao','design'];

export default function ExploreFilters({ value, onChange }: Props) {
  const [query, setQuery] = useState(value.query || '');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(value.skills || []);
  const [minHours, setMinHours] = useState(value.minHours ?? 0);
  const [maxHours, setMaxHours] = useState(value.maxHours ?? 40);

  useEffect(() => {
    // sync out after debounce-ish (here simple)
    const t = setTimeout(() => {
      onChange({ query, skills, minHours, maxHours });
      try { localStorage.setItem('exploreFilters', JSON.stringify({ query, skills, minHours, maxHours })); } catch {}
    }, 200);
    return () => clearTimeout(t);
  }, [query, skills, minHours, maxHours, onChange]);

  useEffect(() => {
    // if parent changes externally, update local state
    setQuery(value.query || '');
    setSkills(value.skills || []);
    setMinHours(value.minHours ?? 0);
    setMaxHours(value.maxHours ?? 40);
  }, [value]);

  function addSkill(raw: string) {
    const s = raw.trim().toLowerCase();
    if (!s) return;
    if (!skills.includes(s)) setSkills(prev => [...prev, s]);
    setSkillInput('');
  }

  function removeSkill(s: string) {
    setSkills(prev => prev.filter(x => x !== s));
  }

  return (
    <aside className="p-4 bg-white rounded-lg shadow-sm w-full sm:w-80">
      <label className="block text-xs font-medium text-slate-600">Buscar</label>
      <input
        className="mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
        placeholder="ex: alfabetização, finanças, design"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Busca"
      />

      <div className="mt-4">
        <label className="block text-xs font-medium text-slate-600">Habilidades</label>
        <div className="mt-2 flex gap-2 items-center">
          <input
            className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
            placeholder="adicione e pressione Enter (ex: react)"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill(skillInput);
              }
            }}
            aria-label="Habilidade"
          />
          <button
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-sm"
            onClick={() => addSkill(skillInput)}
            aria-label="Adicionar habilidade"
            type="button"
          >
            Adicionar
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map(s => (
            <button
              key={s}
              onClick={() => removeSkill(s)}
              className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100 text-sm text-slate-700"
              type="button"
              aria-label={`Remover ${s}`}
            >
              <span className="font-medium">{s}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 111.414 1.414L11.414 10l2.293 2.293a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => addSkill(s)}
              className="text-xs px-2 py-1 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium text-slate-600">Horas estimadas</label>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="number"
            min={0}
            className="w-20 px-2 py-1 border rounded-md text-sm"
            value={minHours}
            onChange={(e) => setMinHours(Math.max(0, Number(e.target.value)))}
            aria-label="Horas mínimas"
          />
          <span className="text-sm text-slate-500">—</span>
          <input
            type="number"
            min={0}
            className="w-20 px-2 py-1 border rounded-md text-sm"
            value={maxHours}
            onChange={(e) => setMaxHours(Math.max(0, Number(e.target.value)))}
            aria-label="Horas máximas"
          />
        </div>

        <div className="mt-3">
          <input
            type="range"
            min={0}
            max={80}
            value={minHours}
            onChange={(e) => setMinHours(Number(e.target.value))}
            aria-label="Horas mínimas slider"
            className="w-full"
          />
          <input
            type="range"
            min={0}
            max={80}
            value={maxHours}
            onChange={(e) => setMaxHours(Number(e.target.value))}
            aria-label="Horas máximas slider"
            className="w-full mt-1"
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="flex-1 px-4 py-2 bg-black text-white rounded-md text-sm"
          onClick={() => {
            // aplicar/emitir
            onChange({ query, skills, minHours, maxHours });
          }}
        >
          Aplicar filtros
        </button>

        <button
          type="button"
          className="px-4 py-2 border rounded-md text-sm"
          onClick={() => {
            setQuery(''); setSkills([]); setSkillInput(''); setMinHours(0); setMaxHours(40);
            onChange({ query: '', skills: [], minHours: 0, maxHours: 40 });
            try { localStorage.removeItem('exploreFilters'); } catch {}
          }}
        >
          Limpar
        </button>
      </div>
    </aside>
  );
}
