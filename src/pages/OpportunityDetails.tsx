import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
    Clock, Building, ArrowLeft, Loader2, CheckCircle2, MapPin,
    Calendar, Briefcase, Award, GraduationCap, Users, Gift,
    Home, Wifi, Blend, Check, X, MessageCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface Opportunity {
    id: string;
    titulo: string;
    descricao: string;
    horas_estimadas: number;
    skills_required: string | null;
    location: string | null;
    embedding?: number[] | null;
    // New fields
    causas: string[] | null;
    min_vagas: number | null;
    formato: 'presencial' | 'remoto' | 'hibrido' | null;
    emite_certificado: boolean | null;
    oferece_treinamento: boolean | null;
    recursos_oferecidos: string | null;
    // Address fields
    endereco: string | null;
    bairro: string | null;
    cidade: string | null;
    ong: {
        id: string;
        nome: string;
        bio: string | null;
        avatar_url: string | null;
    };
}

const FORMATO_LABELS = {
    presencial: 'Presencial',
    remoto: 'Remoto',
    hibrido: 'Híbrido'
};

const FORMATO_ICONS = {
    presencial: Home,
    remoto: Wifi,
    hibrido: Blend
};

export default function OpportunityDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    useEffect(() => {
        if (id) {
            loadOpportunity();
            checkApplicationStatus();
        }
    }, [id, profile]);

    const loadOpportunity = async () => {
        try {
            const { data, error } = await supabase
                .from('opportunities')
                .select(`
                    id,
                    titulo,
                    descricao,
                    horas_estimadas,
                    skills_required,
                    location,
                    causas,
                    min_vagas,
                    formato,
                    emite_certificado,
                    oferece_treinamento,
                    recursos_oferecidos,
                    endereco,
                    bairro,
                    cidade,
                    ong:profiles!opportunities_ong_id_fkey(id, nome, bio, avatar_url)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setOpportunity(data as any);
        } catch (error) {
            console.error('Error loading opportunity:', error);
            toast({
                title: 'Erro ao carregar vaga',
                description: 'Não foi possível carregar os detalhes da vaga.',
                variant: 'destructive',
            });
            navigate('/explorar');
        } finally {
            setLoading(false);
        }
    };

    const checkApplicationStatus = async () => {
        if (!profile) return;

        const { data } = await supabase
            .from('matches')
            .select('id')
            .eq('opportunity_id', id)
            .eq('voluntario_id', profile.id)
            .single();

        if (data) {
            setHasApplied(true);
        }
    };

    const handleApply = async () => {
        if (!profile || !opportunity) return;

        setApplying(true);

        try {
            const { error } = await supabase.from('matches').insert({
                voluntario_id: profile.id,
                opportunity_id: opportunity.id,
                status: 'pendente',
            });

            if (error) {
                if (error.code === '23505') {
                    toast({
                        title: 'Você já se candidatou',
                        description: 'Você já se candidatou a esta oportunidade.',
                    });
                    setHasApplied(true);
                } else {
                    throw error;
                }
            } else {
                toast({
                    title: 'Candidatura enviada!',
                    description: 'A ONG irá avaliar sua candidatura.',
                });
                setHasApplied(true);
            }
        } catch (error) {
            console.error('Error applying:', error);
            toast({
                title: 'Erro ao candidatar',
                description: 'Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8 max-w-5xl">
                    <Skeleton className="h-8 w-24 mb-6" />
                    <Skeleton className="h-64 w-full mb-6" />
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-6">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                        <Skeleton className="h-96 w-full" />
                    </div>
                </main>
            </div>
        );
    }

    if (!opportunity) return null;

    const skills = opportunity.skills_required
        ? opportunity.skills_required.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    const recursos = opportunity.recursos_oferecidos
        ? opportunity.recursos_oferecidos.split(',').map(r => r.trim()).filter(Boolean)
        : [];

    const FormatoIcon = opportunity.formato ? FORMATO_ICONS[opportunity.formato] : MapPin;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8 max-w-5xl">
                <Button
                    variant="ghost"
                    className="mb-6 gap-2"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Button>

                {/* Hero Section */}
                <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
                    <CardContent className="pt-8 pb-8">
                        <div className="space-y-4">
                            {/* Causas Tags */}
                            {opportunity.causas && opportunity.causas.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {opportunity.causas.map((causa, idx) => (
                                        <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                            {causa}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Título */}
                            <h1 className="text-4xl font-bold tracking-tight">{opportunity.titulo}</h1>

                            {/* ONG Info */}
                            <div
                                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer w-fit"
                                onClick={() => navigate(`/perfil/${opportunity.ong.id}`)}
                            >
                                <Building className="h-5 w-5" />
                                <span className="text-lg underline decoration-dotted underline-offset-4">
                                    {opportunity.ong.nome}
                                </span>
                            </div>

                            {/* Quick Info */}
                            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                                {opportunity.formato && (
                                    <div className="flex items-center gap-2">
                                        <FormatoIcon className="h-5 w-5 text-primary" />
                                        <span className="font-medium">{FORMATO_LABELS[opportunity.formato]}</span>
                                    </div>
                                )}
                                {/* Location - Show if any location data exists */}
                                {(opportunity.endereco || opportunity.bairro || opportunity.cidade || opportunity.location) && (
                                    <>
                                        <span className="text-muted-foreground/40">•</span>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5 text-primary" />
                                            <span>
                                                {opportunity.endereco || opportunity.bairro || opportunity.cidade
                                                    ? [opportunity.endereco, opportunity.bairro, opportunity.cidade]
                                                        .filter(Boolean)
                                                        .join(', ')
                                                    : opportunity.location}
                                            </span>
                                        </div>
                                    </>
                                )}
                                {opportunity.min_vagas && opportunity.min_vagas > 1 && (
                                    <>
                                        <span className="text-muted-foreground/40">•</span>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-primary" />
                                            <span>{opportunity.min_vagas} vagas</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Logística e Compromisso */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-primary" />
                                    Logística e Compromisso
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-sm">Carga Horária</p>
                                        <p className="text-muted-foreground">{opportunity.horas_estimadas}h/semana</p>
                                    </div>
                                </div>

                                {opportunity.formato && (
                                    <div className="flex items-start gap-3">
                                        <FormatoIcon className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-sm">Formato</p>
                                            <p className="text-muted-foreground">{FORMATO_LABELS[opportunity.formato]}</p>
                                        </div>
                                    </div>
                                )}

                                {opportunity.min_vagas && (
                                    <div className="flex items-start gap-3">
                                        <Users className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-sm">Vagas Disponíveis</p>
                                            <p className="text-muted-foreground">{opportunity.min_vagas} {opportunity.min_vagas === 1 ? 'vaga' : 'vagas'}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Location Card - Show for all opportunities with location data */}
                                {(opportunity.endereco || opportunity.bairro || opportunity.cidade || opportunity.location) && (
                                    <div className="flex items-start gap-3 sm:col-span-2">
                                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-sm">Localização</p>
                                            {opportunity.endereco || opportunity.bairro || opportunity.cidade ? (
                                                <div className="text-muted-foreground space-y-0.5">
                                                    {opportunity.endereco && (
                                                        <p>{opportunity.endereco}</p>
                                                    )}
                                                    {(opportunity.bairro || opportunity.cidade) && (
                                                        <p>
                                                            {[opportunity.bairro, opportunity.cidade]
                                                                .filter(Boolean)
                                                                .join(' - ')}
                                                            {opportunity.cidade && ' / SE'}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground">{opportunity.location}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Descrição da Vaga */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Sobre a Vaga</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {opportunity.descricao}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Requisitos e Perfil */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-primary" />
                                    Requisitos e Perfil
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {skills.length > 0 && (
                                    <div>
                                        <p className="font-semibold mb-3 text-sm">Habilidades Necessárias</p>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.map((skill, idx) => (
                                                <Badge key={idx} variant="secondary">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* O que Oferecemos */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Gift className="h-5 w-5 text-primary" />
                                    O que Oferecemos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {opportunity.emite_certificado !== null && (
                                        <div className="flex items-center gap-3">
                                            {opportunity.emite_certificado ? (
                                                <Check className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <X className="h-5 w-5 text-muted-foreground" />
                                            )}
                                            <div>
                                                <p className="font-medium text-sm">Certificado</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {opportunity.emite_certificado ? 'Emite certificado' : 'Não emite'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {opportunity.oferece_treinamento !== null && (
                                        <div className="flex items-center gap-3">
                                            {opportunity.oferece_treinamento ? (
                                                <Check className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <X className="h-5 w-5 text-muted-foreground" />
                                            )}
                                            <div>
                                                <p className="font-medium text-sm">Treinamento</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {opportunity.oferece_treinamento ? 'Oferece treinamento' : 'Não oferece'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {recursos.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="font-semibold mb-3 text-sm">Recursos Oferecidos</p>
                                            <ul className="space-y-2">
                                                {recursos.map((recurso, idx) => (
                                                    <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                                                        <Check className="h-4 w-4 text-primary" />
                                                        <span>{recurso}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Sobre a ONG */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Sobre a ONG</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">
                                    {opportunity.ong.bio || "Esta organização ainda não possui uma descrição."}
                                </p>
                                <Button
                                    variant="link"
                                    className="mt-4 p-0 h-auto"
                                    onClick={() => navigate(`/perfil/${opportunity.ong.id}`)}
                                >
                                    Ver perfil completo →
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Sticky Action Card */}
                    <div className="space-y-6">
                        <Card className="sticky top-4">
                            <CardContent className="pt-6 space-y-6">
                                {hasApplied ? (
                                    <div className="text-center space-y-4">
                                        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Candidatura enviada!</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                A ONG irá avaliar seu perfil
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        className="w-full h-12 text-base gradient-primary"
                                        onClick={handleApply}
                                        disabled={applying}
                                    >
                                        {applying ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                                Candidatar-se
                                            </>
                                        )}
                                    </Button>
                                )}

                                {/* Chat Button - Always visible */}
                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    onClick={() => navigate(`/chat?receiverId=${opportunity.ong.id}`)}
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    Conversar com a ONG
                                </Button>

                                <Separator />

                                {/* Quick Stats */}
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Carga horária</span>
                                        <span className="font-medium">{opportunity.horas_estimadas}h/semana</span>
                                    </div>
                                    {opportunity.formato && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Formato</span>
                                            <span className="font-medium">{FORMATO_LABELS[opportunity.formato]}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
