/**
 * Predefined causes/areas for volunteer opportunities
 */
export const PREDEFINED_CAUSES = [
    'Educação',
    'Meio Ambiente',
    'Saúde',
    'Assistência Social',
    'Cultura e Arte',
    'Esportes',
    'Direitos Humanos',
    'Proteção Animal',
    'Tecnologia e Inovação',
    'Desenvolvimento Comunitário',
] as const;

export type Cause = typeof PREDEFINED_CAUSES[number];
