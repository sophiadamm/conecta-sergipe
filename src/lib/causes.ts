/**
 * Predefined causes/areas for volunteer opportunities
 */
export const PREDEFINED_CAUSES = [
    'Educação',
    'Alfabetização',
    'Crianças e Adolescentes', // <--- Adicionado aqui
    'Meio Ambiente',
    'Saúde Mental',
    'Saúde Geral',
    'Assistência Social',
    'Combate à Fome',
    'Cultura e Arte',
    'Esportes e Lazer',
    'Direitos Humanos',
    'Igualdade Racial',
    'Igualdade de Gênero',
    'Proteção Animal',
    'Tecnologia e Inovação',
    'Desenvolvimento Comunitário',
    'Apoio a Idosos',
    'Apoio a PCDs',
    'Habitação e Moradia',
    'Empreendedorismo',
    'Turismo Social'
] as const;

export type Cause = typeof PREDEFINED_CAUSES[number];
