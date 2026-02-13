
export const PREDEFINED_SKILLS = [
    // Tech & Design
    "Programação", "Design Gráfico", "Edição de Vídeo", "Informática",
    "Redes Sociais", "Marketing Digital", "Excel/Planilhas", "Suporte Técnico",

    // Educação & Idiomas
    "Ensino/Tutoria", "Matemática", "Português", "Inglês", "Alfabetização",
    "Contação de Histórias", "Tradução", "Libras", "Produção Textual",

    // Saúde & Cuidado
    "Psicologia", "Enfermagem", "Nutrição", "Cuidador de Idosos",
    "Primeiros Socorros", "Fisioterapia", "Odontologia",

    // Mão na Massa & Logística
    "Culinária", "Motorista (CNH B)", "Pintura", "Carpintaria",
    "Limpeza e Organização", "Logística", "Jardinagem", "Costura",

    // Administrativo & Jurídico
    "Gestão de Projetos", "Contabilidade", "Direito/Jurídico",
    "Captação de Recursos", "Organização de Eventos", "Secretariado",

    // Arte & Cultura
    "Música/Instrumento", "Dança", "Teatro", "Artesanato", "Fotografia",

    //Softskills
    "Comunicação", "Oratória"
] as const;


export type Skill = typeof PREDEFINED_SKILLS[number];
