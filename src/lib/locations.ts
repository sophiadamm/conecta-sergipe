// Cidades de Sergipe disponíveis no sistema
export const SERGIPE_CITIES = [
    'Aracaju',
    'Nossa Senhora do Socorro',
    'Lagarto',
    'Itabaiana',
    'São Cristóvão',
    'Estância',
    'Tobias Barreto',
    'Simão Dias',
    'Itaporanga d\'Ajuda',
    'Capela',
    'Glória',
    'Propriá',
] as const;

export type SergipeCity = typeof SERGIPE_CITIES[number];
