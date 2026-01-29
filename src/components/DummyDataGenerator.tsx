import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2, Database } from 'lucide-react';

// Sample data for Sergipe NGOs
const sampleNGOs = [
  {
    email: 'ajosse@teste.com',
    password: 'teste123',
    nome: 'AJOSSE - Associação dos Jovens de Sergipe',
    bio: 'Promovemos educação e capacitação profissional para jovens em situação de vulnerabilidade social em Aracaju e interior de Sergipe.',
    skills: 'Ensino, Comunicação',
  },
  {
    email: 'casadaacolhida@teste.com',
    password: 'teste123',
    nome: 'Casa da Acolhida',
    bio: 'Acolhemos pessoas em situação de rua, oferecendo alimentação, higiene e encaminhamento para reinserção social.',
    skills: 'Assistência Social, Culinária, Saúde',
  },
  {
    email: 'projetosemente@teste.com',
    password: 'teste123',
    nome: 'Projeto Semente',
    bio: 'Trabalhamos com agricultura familiar e educação ambiental nas comunidades rurais do sertão sergipano.',
    skills: 'Meio Ambiente, Agricultura',
  },
  {
    email: 'institutomangue@teste.com',
    password: 'teste123',
    nome: 'Instituto Mangue Vivo',
    bio: 'Preservação dos manguezais sergipanos através de educação ambiental e reflorestamento na região costeira.',
    skills: 'Meio Ambiente, Ensino',
  },
  {
    email: 'redesolidaria@teste.com',
    password: 'teste123',
    nome: 'Rede Solidária Sergipe',
    bio: 'Conectamos doadores e instituições para distribuição de alimentos e itens básicos para famílias carentes.',
    skills: 'Logística, Culinária',
  },
];

const sampleVolunteers = [
  {
    email: 'maria.silva@teste.com',
    password: 'teste123',
    nome: 'Maria Silva Santos',
    cpf: '529.982.247-25', // Valid CPF
    bio: 'Professora aposentada com 30 anos de experiência em educação infantil. Quero continuar contribuindo com a educação de crianças.',
    skills: 'Ensino, Comunicação',
  },
  {
    email: 'joao.developer@teste.com',
    password: 'teste123',
    nome: 'João Pedro Almeida',
    cpf: '453.178.287-91', // Valid CPF
    bio: 'Desenvolvedor de software com experiência em Python e React. Quero usar minhas habilidades para ajudar ONGs com tecnologia.',
    skills: 'JavaScript, React, Design',
  },
  {
    email: 'ana.nutricionista@teste.com',
    password: 'teste123',
    nome: 'Ana Carolina Menezes',
    cpf: '714.593.218-50', // Valid CPF
    bio: 'Nutricionista formada pela UFS, apaixonada por alimentação saudável e educação nutricional para comunidades.',
    skills: 'Nutrição, Saúde, Culinária, Ensino',
  },
];

const sampleOpportunities = [
  {
    titulo: 'Professor de Informática Básica',
    descricao: 'Ensinar informática básica (Word, Excel, Internet) para jovens em capacitação profissional. Aulas duas vezes por semana no turno da tarde.',
    skills_required: 'Ensino, Comunicação',
    horas_estimadas: 20,
  },
  {
    titulo: 'Designer para Material de Divulgação',
    descricao: 'Criar materiais gráficos para campanhas de doação: cartazes, posts para redes sociais e folders.',
    skills_required: 'Design, Marketing, Redes Sociais',
    horas_estimadas: 15,
  },
  {
    titulo: 'Voluntário para Distribuição de Alimentos',
    descricao: 'Ajudar na organização e distribuição de cestas básicas aos sábados pela manhã.',
    skills_required: 'Logística, Comunicação',
    horas_estimadas: 8,
  },
  {
    titulo: 'Educador Ambiental',
    descricao: 'Ministrar palestras e oficinas sobre preservação ambiental em escolas públicas de Aracaju.',
    skills_required: 'Meio Ambiente, Ensino, Comunicação',
    horas_estimadas: 12,
  },
  {
    titulo: 'Apoio Administrativo',
    descricao: 'Auxiliar nas atividades administrativas da ONG: organização de documentos, atendimento e planilhas.',
    skills_required: 'Gestão de Projetos, Contabilidade',
    horas_estimadas: 16,
  },
  {
    titulo: 'Contador Voluntário',
    descricao: 'Apoiar a ONG com questões contábeis, prestação de contas e orientação fiscal.',
    skills_required: 'Contabilidade, Gestão de Projetos',
    horas_estimadas: 10,
  },
  {
    titulo: 'Professor de Reforço Escolar',
    descricao: 'Dar aulas de reforço de matemática e português para crianças do ensino fundamental.',
    skills_required: 'Ensino, Comunicação',
    horas_estimadas: 12,
  },
  {
    titulo: 'Social Media',
    descricao: 'Gerenciar as redes sociais da ONG: criar conteúdo, responder comentários e aumentar engajamento.',
    skills_required: 'Marketing, Redes Sociais, Design',
    horas_estimadas: 8,
  },
  {
    titulo: 'Plantio de Mudas no Manguezal',
    descricao: 'Participar de mutirões de plantio de mudas para recuperação de áreas degradadas do manguezal.',
    skills_required: 'Meio Ambiente, Agricultura',
    horas_estimadas: 6,
  },
  {
    titulo: 'Oficina de Artesanato',
    descricao: 'Ensinar técnicas de artesanato para mulheres em situação de vulnerabilidade como fonte de renda.',
    skills_required: 'Artesanato, Ensino',
    horas_estimadas: 20,
  },
];

interface DummyDataGeneratorProps {
  onComplete?: () => void;
}

export function DummyDataGenerator({ onComplete }: DummyDataGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');

  const generateData = async () => {
    setIsGenerating(true);
    setProgress('Iniciando...');

    try {
      const ongProfiles: string[] = [];

      // Create NGOs
      setProgress('Criando ONGs...');
      for (const ong of sampleNGOs) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: ong.email,
          password: ong.password,
        });

        if (authError) {
          if (!authError.message.includes('already registered')) {
            console.error('Error creating ONG:', authError);
          }
          continue;
        }

        if (authData.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              nome: ong.nome,
              tipo: 'ong',
              bio: ong.bio,
              skills: ong.skills,
            })
            .select()
            .single();

          if (profileError) {
            console.error('Error creating ONG profile:', profileError);
          } else if (profileData) {
            ongProfiles.push(profileData.id);
          }
        }
      }

      // Create Volunteers
      setProgress('Criando voluntários...');
      for (const vol of sampleVolunteers) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: vol.email,
          password: vol.password,
        });

        if (authError) {
          if (!authError.message.includes('already registered')) {
            console.error('Error creating volunteer:', authError);
          }
          continue;
        }

        if (authData.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            user_id: authData.user.id,
            nome: vol.nome,
            cpf: vol.cpf,
            tipo: 'voluntario',
            bio: vol.bio,
            skills: vol.skills,
          });

          if (profileError) {
            console.error('Error creating volunteer profile:', profileError);
          }
        }
      }

      // Get ONG profiles from database if we didn't create them
      if (ongProfiles.length === 0) {
        const { data: existingOngs } = await supabase
          .from('profiles')
          .select('id')
          .eq('tipo', 'ong')
          .limit(5);

        if (existingOngs) {
          ongProfiles.push(...existingOngs.map((o) => o.id));
        }
      }

      // Create Opportunities
      if (ongProfiles.length > 0) {
        setProgress('Criando oportunidades...');
        for (let i = 0; i < sampleOpportunities.length; i++) {
          const opp = sampleOpportunities[i];
          const ongId = ongProfiles[i % ongProfiles.length];

          const { error } = await supabase.from('opportunities').insert({
            ong_id: ongId,
            titulo: opp.titulo,
            descricao: opp.descricao,
            skills_required: opp.skills_required,
            horas_estimadas: opp.horas_estimadas,
          });

          if (error) {
            console.error('Error creating opportunity:', error);
          }
        }
      }

      setProgress('Concluído!');
      toast({
        title: 'Dados de teste gerados!',
        description: 'ONGs, voluntários e oportunidades foram criados.',
      });

      // Sign out after generating data
      await supabase.auth.signOut();

      onComplete?.();
    } catch (error) {
      console.error('Error generating data:', error);
      toast({
        title: 'Erro ao gerar dados',
        description: 'Alguns dados podem não ter sido criados.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generateData}
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {progress}
        </>
      ) : (
        <>
          <Database className="h-4 w-4" />
          Gerar Dados de Teste
        </>
      )}
    </Button>
  );
}
