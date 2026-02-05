import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  Briefcase,
  MessageSquare,
} from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { PREDEFINED_SKILLS } from '@/lib/skills';

const opportunitySchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  skills_required: z.string().optional(),
  horas_estimadas: z.coerce.number().min(1, 'Horas devem ser maior que 0'),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

interface Opportunity {
  id: string;
  titulo: string;
  descricao: string;
  skills_required: string | null;
  horas_estimadas: number;
  ativa: boolean;
}

interface Match {
  id: string;
  status: string;
  horas_validadas: number;
  feedback_ong: string | null;
  rating: number | null;
  voluntario: {
    id: string;
    nome: string;
    bio: string | null;
    skills: string | null;
  };
  opportunity: {
    id: string;
    titulo: string;
    horas_estimadas: number;
  };
}

export default function OngDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewingMatch, setReviewingMatch] = useState<Match | null>(null);
  const [reviewData, setReviewData] = useState({ feedback: '', rating: 5, horas: 0 });

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      skills_required: '',
      horas_estimadas: 4,
    },
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/dashboard');
        return;
      }
      if (profile && profile.tipo !== 'ong') {
        navigate('/dashboard');
        return;
      }
    }

    if (profile) {
      loadData();
    }
  }, [user, profile, authLoading, navigate]);

  const loadData = async () => {
    if (!profile) return;

    try {
      // Load opportunities
      const { data: oppsData, error: oppsError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('ong_id', profile.id)
        .order('created_at', { ascending: false });

      if (oppsError) throw oppsError;
      setOpportunities(oppsData || []);

      // Load matches for this ONG's opportunities
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          status,
          horas_validadas,
          feedback_ong,
          rating,
          voluntario:profiles!matches_voluntario_id_fkey(id, nome, bio, skills),
          opportunity:opportunities(id, titulo, horas_estimadas)
        `)
        .in('opportunity_id', (oppsData || []).map((o) => o.id))
        .order('created_at', { ascending: false });

      if (matchesError) throw matchesError;
      setMatches(matchesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpportunity = async (data: OpportunityFormData) => {
    if (!profile) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('opportunities').insert({
        ong_id: profile.id,
        titulo: data.titulo,
        descricao: data.descricao,
        skills_required: data.skills_required || null,
        horas_estimadas: data.horas_estimadas,
      });

      if (error) throw error;

      toast({
        title: 'Oportunidade criada!',
        description: 'Voluntários poderão se candidatar agora.',
      });

      setShowCreateDialog(false);
      form.reset();
      loadData();
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast({
        title: 'Erro ao criar oportunidade',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMatchAction = async (matchId: string, action: 'aprovar' | 'rejeitar') => {
    try {
      const newStatus = action === 'aprovar' ? 'aprovado' : 'rejeitado';

      const { error } = await supabase
        .from('matches')
        .update({ status: newStatus })
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: action === 'aprovar' ? 'Voluntário aprovado!' : 'Candidatura rejeitada',
      });

      loadData();
    } catch (error) {
      console.error('Error updating match:', error);
      toast({
        title: 'Erro ao atualizar',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteAndReview = async () => {
    if (!reviewingMatch) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('matches')
        .update({
          status: 'concluido',
          horas_validadas: reviewData.horas,
          feedback_ong: reviewData.feedback,
          rating: reviewData.rating,
        })
        .eq('id', reviewingMatch.id);

      if (error) throw error;

      toast({
        title: 'Trabalho concluído!',
        description: `${reviewData.horas} horas foram adicionadas ao portfólio do voluntário.`,
      });

      setReviewingMatch(null);
      setReviewData({ feedback: '', rating: 5, horas: 0 });
      loadData();
    } catch (error) {
      console.error('Error completing match:', error);
      toast({
        title: 'Erro ao concluir',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats
  const activeOpps = opportunities.filter((o) => o.ativa).length;
  const pendingMatches = matches.filter((m) => m.status === 'pendente').length;
  const completedMatches = matches.filter((m) => m.status === 'concluido').length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Building2 className="h-8 w-8 text-secondary" />
              {profile?.nome}
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas oportunidades e voluntários.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Oportunidade
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Oportunidades Ativas
              </CardTitle>
              <Briefcase className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeOpps}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Candidaturas Pendentes
              </CardTitle>
              <Users className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingMatches}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trabalhos Concluídos
              </CardTitle>
              <CheckCircle2 className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedMatches}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="opportunities" className="space-y-6">
          <TabsList>
            <TabsTrigger value="opportunities" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Oportunidades
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Users className="h-4 w-4" />
              Candidaturas
              {pendingMatches > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingMatches}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <Clock className="h-4 w-4" />
              Em Andamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-4">
            {opportunities.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Você ainda não criou nenhuma oportunidade.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  Criar primeira oportunidade
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {opportunities.map((opp) => (
                  <Card key={opp.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{opp.titulo}</CardTitle>
                        <Badge variant={opp.ativa ? 'default' : 'secondary'}>
                          {opp.ativa ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {opp.descricao}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {opp.horas_estimadas}h
                        </span>
                        {opp.skills_required && (
                          <span className="text-muted-foreground">
                            {opp.skills_required}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {matches.filter((m) => m.status === 'pendente').length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhuma candidatura pendente.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {matches
                  .filter((m) => m.status === 'pendente')
                  .map((match) => (
                    <Card key={match.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {match.voluntario?.nome}
                            </CardTitle>
                            <CardDescription>
                              Candidatura para: {match.opportunity?.titulo}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {match.voluntario?.bio && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {match.voluntario.bio}
                          </p>
                        )}
                        {match.voluntario?.skills && (
                          <p className="text-sm">
                            <strong>Habilidades:</strong> {match.voluntario.skills}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="gap-2">
                        <Button
                          onClick={() => handleMatchAction(match.id, 'aprovar')}
                          className="gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Aprovar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleMatchAction(match.id, 'rejeitar')}
                          className="gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Rejeitar
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {matches.filter((m) => m.status === 'aprovado').length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhum trabalho em andamento.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {matches
                  .filter((m) => m.status === 'aprovado')
                  .map((match) => (
                    <Card key={match.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {match.voluntario?.nome}
                            </CardTitle>
                            <CardDescription>
                              {match.opportunity?.titulo} • {match.opportunity?.horas_estimadas}h estimadas
                            </CardDescription>
                          </div>
                          <Badge>Em andamento</Badge>
                        </div>
                      </CardHeader>
                      <CardFooter>
                        <Button
                          onClick={() => {
                            setReviewingMatch(match);
                            setReviewData({
                              feedback: '',
                              rating: 5,
                              horas: match.opportunity?.horas_estimadas || 0,
                            });
                          }}
                          className="gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Concluir e Avaliar
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Opportunity Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Oportunidade</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateOpportunity)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                placeholder="Ex: Professor de Informática"
                {...form.register('titulo')}
              />
              {form.formState.errors.titulo && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.titulo.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva as atividades e requisitos..."
                {...form.register('descricao')}
              />
              {form.formState.errors.descricao && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.descricao.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skills_required">Habilidades desejadas</Label>
                <Controller
                  name="skills_required"
                  control={form.control}
                  render={({ field }) => (
                    <MultiSelect
                      options={Object.values(PREDEFINED_SKILLS)}
                      selected={field.value ? field.value.split(',').map(s => s.trim()).filter(Boolean) : []}
                      onChange={(selected) => field.onChange(selected.join(','))}
                      placeholder="Selecione as habilidades..."
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horas_estimadas">Horas estimadas</Label>
                <Input
                  id="horas_estimadas"
                  type="number"
                  min="1"
                  {...form.register('horas_estimadas')}
                />
                {form.formState.errors.horas_estimadas && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.horas_estimadas.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Criar Oportunidade'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewingMatch} onOpenChange={() => setReviewingMatch(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Avaliar Voluntário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{reviewingMatch?.voluntario?.nome}</p>
              <p className="text-sm text-muted-foreground">
                {reviewingMatch?.opportunity?.titulo}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Horas trabalhadas</Label>
              <Input
                type="number"
                min="0"
                value={reviewData.horas}
                onChange={(e) =>
                  setReviewData({ ...reviewData, horas: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Avaliação</Label>
              <StarRating
                rating={reviewData.rating}
                size="lg"
                interactive
                onChange={(rating) => setReviewData({ ...reviewData, rating })}
              />
            </div>

            <div className="space-y-2">
              <Label>Feedback</Label>
              <Textarea
                placeholder="Escreva um feedback para o voluntário..."
                value={reviewData.feedback}
                onChange={(e) =>
                  setReviewData({ ...reviewData, feedback: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewingMatch(null)}>
              Cancelar
            </Button>
            <Button onClick={handleCompleteAndReview} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Concluir e Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
