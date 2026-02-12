/** Tags que a ONG pode atribuir ao voluntário ao avaliar. */
export const VOLUNTEER_TAGS = [
  'Pontualidade',
  'Proatividade',
  'Trabalho em Equipe',
  'Comunicação',
  'Comprometimento',
  'Liderança',
] as const;

/** Tags que o voluntário pode atribuir à ONG/experiência ao avaliar. */
export const ONG_TAGS = [
  'Organização',
  'Acolhimento',
  'Clareza',
  'Suporte',
  'Ambiente Seguro',
  'Impacto Visível',
] as const;

export type VolunteerTag = (typeof VOLUNTEER_TAGS)[number];
export type OngTag = (typeof ONG_TAGS)[number];
