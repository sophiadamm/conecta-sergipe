import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PREDEFINED_CAUSES } from '@/lib/causes';
import { PREDEFINED_SKILLS, PREDEFINED_SOFT_SKILLS } from '@/lib/skills';

const DAYS_OF_WEEK = [
    { id: 'seg', label: 'Segunda' },
    { id: 'ter', label: 'Terça' },
    { id: 'qua', label: 'Quarta' },
    { id: 'qui', label: 'Quinta' },
    { id: 'sex', label: 'Sexta' },
    { id: 'sab', label: 'Sábado' },
    { id: 'dom', label: 'Domingo' },
];

const PREREQUISITOS_OPCOES = [
    'Ter computador próprio',
    'Ter CNH (Carteira de Habilitação)',
    'Ser maior de 18 anos',
    'Disponibilidade para reuniões presenciais',
];

const RECURSOS_OPCOES = [
    'Ajuda de custo',
    'Transporte',
    'Alimentação',
    'Softwares necessários',
    'Equipamentos',
];

const opportunitySchema = z.object({
    titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    causas: z.string().min(1, 'Selecione pelo menos uma causa/área de atuação'),
    descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
    vagas: z.coerce.number().min(1, 'Deve haver pelo menos 1 vaga disponível'),

    // Logística e Compromisso
    formato: z.enum(['presencial', 'remoto', 'hibrido'], {
        required_error: 'Selecione o formato da oportunidade',
    }),
    endereco: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    cargaHorariaSemanal: z.coerce.number().min(1, 'Carga horária deve ser no mínimo 1 hora'),
    horarioTipo: z.enum(['livre', 'definido'], {
        required_error: 'Selecione o tipo de horário',
    }),
    diasSemana: z.string().optional(),
    horarioInicio: z.string().optional(),
    horarioTermino: z.string().optional(),
    duracaoCompromisso: z.enum(['pontual', 'curto', 'medio', 'longo'], {
        required_error: 'Selecione a duração do compromisso',
    }),
    observacoesLogistica: z.string().optional(),

    // Requisitos do Perfil
    hardSkills: z.string().optional(),
    softSkills: z.string().optional(),
    nivelExperiencia: z.enum(['iniciante', 'intermediario', 'especialista'], {
        required_error: 'Selecione o nível de experiência necessário',
    }),
    prerequisitos: z.string().optional(),

    // Contrapartida e Benefícios
    emiteCertificado: z.enum(['sim', 'nao'], {
        required_error: 'Informe se emite certificado',
    }),
    ofereceTreinamento: z.enum(['sim', 'nao'], {
        required_error: 'Informe se oferece treinamento',
    }),
    recursosOferecidos: z.string().optional(),
}).refine(
    (data) => {
        // Se formato é presencial ou híbrido, endereço, bairro e cidade são obrigatórios
        if (data.formato === 'presencial' || data.formato === 'hibrido') {
            return data.endereco && data.bairro && data.cidade;
        }
        return true;
    },
    {
        message: 'Endereço, bairro e cidade são obrigatórios para formato presencial ou híbrido',
        path: ['endereco'],
    }
).refine(
    (data) => {
        // Se horário é definido, dias da semana, horário início e término são obrigatórios
        if (data.horarioTipo === 'definido') {
            return data.diasSemana && data.horarioInicio && data.horarioTermino;
        }
        return true;
    },
    {
        message: 'Dias da semana e horários são obrigatórios quando o horário é definido',
        path: ['diasSemana'],
    }
);

type OpportunityFormData = z.infer<typeof opportunitySchema>;

export default function NewOpportunity() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<OpportunityFormData>({
        resolver: zodResolver(opportunitySchema),
        mode: 'onChange',
        defaultValues: {
            titulo: '',
            causas: '',
            descricao: '',
            vagas: 1,
            formato: 'presencial',
            endereco: '',
            bairro: '',
            cidade: '',
            cargaHorariaSemanal: 4,
            horarioTipo: 'livre',
            diasSemana: '',
            horarioInicio: '',
            horarioTermino: '',
            duracaoCompromisso: 'curto',
            observacoesLogistica: '',
            hardSkills: '',
            softSkills: '',
            nivelExperiencia: 'iniciante',
            prerequisitos: '',
            emiteCertificado: 'nao',
            ofereceTreinamento: 'nao',
            recursosOferecidos: '',
        },
    });

    // Watch fields for conditional rendering
    const formato = form.watch('formato');
    const horarioTipo = form.watch('horarioTipo');

    const handleSubmit = async (data: OpportunityFormData) => {
        if (!profile) {
            toast({
                title: 'Erro',
                description: 'Você precisa estar logado para criar uma oportunidade.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // For now, we'll store the data in a format compatible with the existing schema
            // The 'causas' field will be stored temporarily in 'skills_required' until the schema is updated
            const { error } = await supabase.from('opportunities').insert({
                ong_id: profile.id,
                titulo: data.titulo,
                descricao: data.descricao,
                skills_required: data.causas, // Temporarily storing causes here
                horas_estimadas: 4, // Default value, can be made configurable later
                location: profile.locations?.[0] || 'Aracaju', // Default location
                ativa: true,
                // Note: 'vagas' field will need to be added to the database schema
            });

            if (error) throw error;

            toast({
                title: 'Oportunidade criada!',
                description: 'Voluntários poderão se candidatar agora.',
            });

            navigate('/ong');
        } catch (error) {
            console.error('Error creating opportunity:', error);
            toast({
                title: 'Erro ao criar oportunidade',
                description: 'Ocorreu um erro ao criar a oportunidade. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container py-8 max-w-4xl">
                {/* Header Section */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/ong')}
                        className="mb-4 gap-2 hover:bg-accent"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Button>

                    <h1 className="text-3xl font-bold mb-2">Nova Oportunidade</h1>
                    <p className="text-muted-foreground">
                        Preencha os campos abaixo para criar uma nova oportunidade de voluntariado.
                    </p>
                </div>

                {/* Form Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informações da Oportunidade</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                            {/* Título da Vaga */}
                            <div className="space-y-2">
                                <Label htmlFor="titulo">
                                    Título da Vaga <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="titulo"
                                    placeholder="Ex: Professor de Matemática"
                                    {...form.register('titulo')}
                                    className="transition-all focus:ring-2 focus:ring-primary"
                                />
                                {form.formState.errors.titulo && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.titulo.message}
                                    </p>
                                )}
                            </div>

                            {/* Causa/Área de Atuação */}
                            <div className="space-y-2">
                                <Label htmlFor="causas">
                                    Causa/Área de Atuação <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    name="causas"
                                    control={form.control}
                                    render={({ field }) => (
                                        <MultiSelect
                                            options={[...PREDEFINED_CAUSES]}
                                            selected={field.value ? field.value.split(',').map(s => s.trim()).filter(Boolean) : []}
                                            onChange={(selected) => field.onChange(selected.join(','))}
                                            placeholder="Selecione uma ou mais causas..."
                                        />
                                    )}
                                />
                                {form.formState.errors.causas && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.causas.message}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Selecione as áreas de atuação relacionadas a esta oportunidade
                                </p>
                            </div>

                            {/* Descrição da Atividade */}
                            <div className="space-y-2">
                                <Label htmlFor="descricao">
                                    Descrição da Atividade <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="descricao"
                                    placeholder="Descreva detalhadamente as atividades que o voluntário irá realizar, requisitos necessários, horários, etc."
                                    rows={6}
                                    {...form.register('descricao')}
                                    className="transition-all focus:ring-2 focus:ring-primary resize-none"
                                />
                                {form.formState.errors.descricao && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.descricao.message}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Seja claro e detalhado para atrair os voluntários certos
                                </p>
                            </div>

                            {/* Quantidade de Vagas */}
                            <div className="space-y-2">
                                <Label htmlFor="vagas">
                                    Quantidade de Vagas Disponíveis <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="vagas"
                                    type="number"
                                    min="1"
                                    {...form.register('vagas')}
                                    className="transition-all focus:ring-2 focus:ring-primary"
                                />
                                {form.formState.errors.vagas && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.vagas.message}
                                    </p>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="border-t pt-6 mt-6">
                                <h3 className="text-lg font-semibold mb-4">Logística e Compromisso</h3>
                            </div>

                            {/* Formato */}
                            <div className="space-y-2">
                                <Label>
                                    Formato <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    name="formato"
                                    control={form.control}
                                    render={({ field }) => (
                                        <RadioGroup
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="presencial" id="presencial" />
                                                <Label htmlFor="presencial" className="font-normal cursor-pointer">
                                                    Presencial
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="remoto" id="remoto" />
                                                <Label htmlFor="remoto" className="font-normal cursor-pointer">
                                                    Remoto
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="hibrido" id="hibrido" />
                                                <Label htmlFor="hibrido" className="font-normal cursor-pointer">
                                                    Híbrido
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    )}
                                />
                                {form.formState.errors.formato && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.formato.message}
                                    </p>
                                )}
                            </div>

                            {/* Localização (Conditional) */}
                            {(formato === 'presencial' || formato === 'hibrido') && (
                                <div className="space-y-4 p-4 bg-accent/30 rounded-lg border border-primary/20">
                                    <h4 className="text-sm font-semibold text-foreground">Localização</h4>

                                    <div className="space-y-2">
                                        <Label htmlFor="endereco">
                                            Endereço <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="endereco"
                                            placeholder="Rua, Avenida, número..."
                                            {...form.register('endereco')}
                                            className="transition-all focus:ring-2 focus:ring-primary"
                                        />
                                        {form.formState.errors.endereco && (
                                            <p className="text-sm text-destructive">
                                                {form.formState.errors.endereco.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="bairro">
                                                Bairro <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="bairro"
                                                placeholder="Nome do bairro"
                                                {...form.register('bairro')}
                                                className="transition-all focus:ring-2 focus:ring-primary"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="cidade">
                                                Cidade <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="cidade"
                                                placeholder="Nome da cidade"
                                                {...form.register('cidade')}
                                                className="transition-all focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Carga Horária Semanal */}
                            <div className="space-y-2">
                                <Label htmlFor="cargaHorariaSemanal">
                                    Carga Horária Semanal (horas) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="cargaHorariaSemanal"
                                    type="number"
                                    min="1"
                                    {...form.register('cargaHorariaSemanal')}
                                    className="transition-all focus:ring-2 focus:ring-primary"
                                />
                                {form.formState.errors.cargaHorariaSemanal && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.cargaHorariaSemanal.message}
                                    </p>
                                )}
                            </div>

                            {/* Horário de Atuação */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>
                                        Horário de Atuação <span className="text-destructive">*</span>
                                    </Label>
                                    <Controller
                                        name="horarioTipo"
                                        control={form.control}
                                        render={({ field }) => (
                                            <RadioGroup
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                className="flex gap-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="livre" id="livre" />
                                                    <Label htmlFor="livre" className="font-normal cursor-pointer">
                                                        Livre/Flexível
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="definido" id="definido" />
                                                    <Label htmlFor="definido" className="font-normal cursor-pointer">
                                                        Definido
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        )}
                                    />
                                    {form.formState.errors.horarioTipo && (
                                        <p className="text-sm text-destructive">
                                            {form.formState.errors.horarioTipo.message}
                                        </p>
                                    )}
                                </div>

                                {/* Horário Definido (Conditional) */}
                                {horarioTipo === 'definido' && (
                                    <div className="space-y-4 p-4 bg-accent/30 rounded-lg border border-primary/20">
                                        <div className="space-y-2">
                                            <Label>
                                                Dias da Semana <span className="text-destructive">*</span>
                                            </Label>
                                            <Controller
                                                name="diasSemana"
                                                control={form.control}
                                                render={({ field }) => {
                                                    const selectedDays = field.value ? field.value.split(',') : [];

                                                    const toggleDay = (dayId: string) => {
                                                        const newDays = selectedDays.includes(dayId)
                                                            ? selectedDays.filter(d => d !== dayId)
                                                            : [...selectedDays, dayId];
                                                        field.onChange(newDays.join(','));
                                                    };

                                                    return (
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                            {DAYS_OF_WEEK.map((day) => (
                                                                <div key={day.id} className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={day.id}
                                                                        checked={selectedDays.includes(day.id)}
                                                                        onCheckedChange={() => toggleDay(day.id)}
                                                                    />
                                                                    <Label
                                                                        htmlFor={day.id}
                                                                        className="text-sm font-normal cursor-pointer"
                                                                    >
                                                                        {day.label}
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }}
                                            />
                                            {form.formState.errors.diasSemana && (
                                                <p className="text-sm text-destructive">
                                                    {form.formState.errors.diasSemana.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="horarioInicio">
                                                    Horário de Início <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="horarioInicio"
                                                    type="time"
                                                    {...form.register('horarioInicio')}
                                                    className="transition-all focus:ring-2 focus:ring-primary"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="horarioTermino">
                                                    Horário de Término <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="horarioTermino"
                                                    type="time"
                                                    {...form.register('horarioTermino')}
                                                    className="transition-all focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Duração do Compromisso */}
                            <div className="space-y-2">
                                <Label htmlFor="duracaoCompromisso">
                                    Duração do Compromisso <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    name="duracaoCompromisso"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger id="duracaoCompromisso">
                                                <SelectValue placeholder="Selecione a duração..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pontual">Pontual (apenas um dia/evento)</SelectItem>
                                                <SelectItem value="curto">Curto Prazo (1 a 3 meses)</SelectItem>
                                                <SelectItem value="medio">Médio Prazo (3 a 6 meses)</SelectItem>
                                                <SelectItem value="longo">Longo Prazo (mais de 6 meses ou indeterminado)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {form.formState.errors.duracaoCompromisso && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.duracaoCompromisso.message}
                                    </p>
                                )}
                            </div>

                            {/* Observações de Logística */}
                            <div className="space-y-2">
                                <Label htmlFor="observacoesLogistica">
                                    Sobre logística e compromisso <span className="text-muted-foreground text-xs">(Opcional)</span>
                                </Label>
                                <Textarea
                                    id="observacoesLogistica"
                                    placeholder="Insira informações adicionais relevantes sobre transporte, flexibilidade ou detalhes da duração."
                                    rows={4}
                                    {...form.register('observacoesLogistica')}
                                    className="transition-all focus:ring-2 focus:ring-primary resize-none"
                                />
                            </div>

                            {/* Divider */}
                            <div className="border-t pt-6 mt-6">
                                <h3 className="text-lg font-semibold mb-4">Requisitos do Perfil</h3>
                            </div>

                            {/* Habilidades Técnicas (Hard Skills) */}
                            <div className="space-y-2">
                                <Label htmlFor="hardSkills">
                                    Habilidades Técnicas (Hard Skills) <span className="text-muted-foreground text-xs">(Opcional)</span>
                                </Label>
                                <Controller
                                    name="hardSkills"
                                    control={form.control}
                                    render={({ field }) => (
                                        <MultiSelect
                                            options={[...PREDEFINED_SKILLS]}
                                            selected={field.value ? field.value.split(',').map(s => s.trim()).filter(Boolean) : []}
                                            onChange={(selected) => field.onChange(selected.join(','))}
                                            placeholder="Selecione habilidades técnicas... (Ex: Python, Excel, Design)"
                                        />
                                    )}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Selecione as habilidades técnicas necessárias para esta oportunidade
                                </p>
                            </div>

                            {/* Habilidades Comportamentais (Soft Skills) */}
                            <div className="space-y-2">
                                <Label htmlFor="softSkills">
                                    Habilidades Comportamentais (Soft Skills) <span className="text-muted-foreground text-xs">(Opcional)</span>
                                </Label>
                                <Controller
                                    name="softSkills"
                                    control={form.control}
                                    render={({ field }) => (
                                        <MultiSelect
                                            options={[...PREDEFINED_SOFT_SKILLS]}
                                            selected={field.value ? field.value.split(',').map(s => s.trim()).filter(Boolean) : []}
                                            onChange={(selected) => field.onChange(selected.join(','))}
                                            placeholder="Selecione soft skills... (Ex: Liderança, Empatia, Proatividade)"
                                        />
                                    )}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Selecione as competências comportamentais desejadas
                                </p>
                            </div>

                            {/* Nível de Experiência */}
                            <div className="space-y-3">
                                <Label>
                                    Nível de Experiência Necessário <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    name="nivelExperiencia"
                                    control={form.control}
                                    render={({ field }) => (
                                        <RadioGroup
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            className="space-y-3"
                                        >
                                            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                                                <RadioGroupItem value="iniciante" id="iniciante" className="mt-1" />
                                                <div className="flex-1">
                                                    <Label htmlFor="iniciante" className="font-medium cursor-pointer">
                                                        Iniciante (Aceita quem quer aprender)
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Ideal para quem está começando e quer desenvolver novas habilidades
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                                                <RadioGroupItem value="intermediario" id="intermediario" className="mt-1" />
                                                <div className="flex-1">
                                                    <Label htmlFor="intermediario" className="font-medium cursor-pointer">
                                                        Intermediário (Já tem noções, mas precisa de supervisão)
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Para quem já possui conhecimento básico e pode trabalhar com orientação
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                                                <RadioGroupItem value="especialista" id="especialista" className="mt-1" />
                                                <div className="flex-1">
                                                    <Label htmlFor="especialista" className="font-medium cursor-pointer">
                                                        Especialista (Precisa rodar o projeto sozinho)
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Requer autonomia completa e expertise para conduzir o trabalho de forma independente
                                                    </p>
                                                </div>
                                            </div>
                                        </RadioGroup>
                                    )}
                                />
                                {form.formState.errors.nivelExperiencia && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.nivelExperiencia.message}
                                    </p>
                                )}
                            </div>

                            {/* Pré-requisitos Obrigatórios */}
                            <div className="space-y-2">
                                <Label htmlFor="prerequisitos">
                                    Pré-requisitos Obrigatórios <span className="text-muted-foreground text-xs">(Opcional)</span>
                                </Label>
                                <Controller
                                    name="prerequisitos"
                                    control={form.control}
                                    render={({ field }) => (
                                        <MultiSelect
                                            options={PREREQUISITOS_OPCOES}
                                            selected={field.value ? field.value.split(',').map(s => s.trim()).filter(Boolean) : []}
                                            onChange={(selected) => field.onChange(selected.join(','))}
                                            placeholder="Selecione os pré-requisitos inegociáveis..."
                                        />
                                    )}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Selecione os requisitos inegociáveis para esta oportunidade
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="border-t pt-6 mt-6">
                                <h3 className="text-lg font-semibold mb-4">Contrapartida e Benefícios</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Informe o que a ONG oferece ao voluntário em troca do trabalho realizado
                                </p>
                            </div>

                            {/* Certificação */}
                            <div className="space-y-2">
                                <Label>
                                    Emite certificado de horas complementares? <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    name="emiteCertificado"
                                    control={form.control}
                                    render={({ field }) => (
                                        <RadioGroup
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="sim" id="cert-sim" />
                                                <Label htmlFor="cert-sim" className="font-normal cursor-pointer">
                                                    Sim
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="nao" id="cert-nao" />
                                                <Label htmlFor="cert-nao" className="font-normal cursor-pointer">
                                                    Não
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    )}
                                />
                                {form.formState.errors.emiteCertificado && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.emiteCertificado.message}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Certificados são importantes para estudantes que precisam comprovar horas complementares
                                </p>
                            </div>

                            {/* Treinamento e Capacitação */}
                            <div className="space-y-2">
                                <Label>
                                    Oferece treinamento, curso ou mentoria para o voluntário? <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    name="ofereceTreinamento"
                                    control={form.control}
                                    render={({ field }) => (
                                        <RadioGroup
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="sim" id="trein-sim" />
                                                <Label htmlFor="trein-sim" className="font-normal cursor-pointer">
                                                    Sim
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="nao" id="trein-nao" />
                                                <Label htmlFor="trein-nao" className="font-normal cursor-pointer">
                                                    Não
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    )}
                                />
                                {form.formState.errors.ofereceTreinamento && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.ofereceTreinamento.message}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Treinamentos e mentorias agregam valor à experiência do voluntário
                                </p>
                            </div>

                            {/* Recursos Oferecidos */}
                            <div className="space-y-2">
                                <Label htmlFor="recursosOferecidos">
                                    Recursos disponibilizados para o voluntário <span className="text-muted-foreground text-xs">(Opcional)</span>
                                </Label>
                                <Controller
                                    name="recursosOferecidos"
                                    control={form.control}
                                    render={({ field }) => (
                                        <MultiSelect
                                            options={RECURSOS_OPCOES}
                                            selected={field.value ? field.value.split(',').map(s => s.trim()).filter(Boolean) : []}
                                            onChange={(selected) => field.onChange(selected.join(','))}
                                            placeholder="Selecione os recursos oferecidos..."
                                        />
                                    )}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Recursos como transporte, alimentação ou equipamentos tornam a vaga mais atrativa
                                </p>
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-4 pt-6 mt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/ong')}
                                    className="flex-1"
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 gap-2 gradient-primary hover:opacity-90 transition-opacity text-white"
                                    disabled={isSubmitting || !form.formState.isValid}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Publicando...
                                        </>
                                    ) : (
                                        'Publicar Oportunidade'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="mt-6 bg-accent/50 border-primary/20">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">
                            <strong className="text-foreground">Dica:</strong> Oportunidades bem descritas e com informações claras atraem mais voluntários qualificados. Você poderá adicionar mais campos como datas e requisitos específicos posteriormente.
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
