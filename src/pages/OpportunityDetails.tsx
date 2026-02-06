import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Clock, Building, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Opportunity {
    id: string;
    titulo: string;
    descricao: string;
    horas_estimadas: number;
    skills_required: string | null;
    ong: {
        id: string;
        nome: string;
        bio: string | null;
    };
}

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
          ong:profiles!opportunities_ong_id_fkey(id, nome, bio)
        `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setOpportunity(data);
        } catch (error) {
            console.error('Error loading opportunity:', error);
            toast({
                title: 'Erro ao carregar vaga',
                description: 'Não foi possível carregar os detalhes da vaga.',
                variant: 'destructive',
            });
            navigate('/voluntario');
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
                <main className="container py-8">
                    <Skeleton className="h-[200px] w-full mb-8" />
                    <Skeleton className="h-[100px] w-full" />
                </main>
            </div>
        );
    }

    if (!opportunity) return null;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8 max-w-4xl">
                <Button
                    variant="ghost"
                    className="mb-6"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <Badge className="w-fit mb-2">Oportunidade de Voluntariado</Badge>
                                <CardTitle className="text-2xl">{opportunity.titulo}</CardTitle>
                                <div
                                    className="flex items-center gap-2 mt-2 text-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer w-fit"
                                    onClick={() => navigate(`/perfil/${opportunity.ong.id}`)}
                                >
                                    <Building className="h-4 w-4" />
                                    <span className="underline decoration-dotted underline-offset-4">{opportunity.ong.nome}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Sobre a vaga</h3>
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                        {opportunity.descricao}
                                    </p>
                                </div>

                                {opportunity.skills_required && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Habilidades Necessárias</h3>
                                        <p className="text-muted-foreground">
                                            {opportunity.skills_required}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Sobre a ONG</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    {opportunity.ong.bio || "Esta organização ainda não possui uma descrição."}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Detalhes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-medium">Carga Horária</p>
                                        <p className="text-sm text-muted-foreground">{opportunity.horas_estimadas}h estimadas</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                {hasApplied ? (
                                    <Button className="w-full" disabled variant="secondary">
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                        Candidatura enviada
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        onClick={handleApply}
                                        disabled={applying}
                                    >
                                        {applying ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            "Candidatar-se"
                                        )}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
