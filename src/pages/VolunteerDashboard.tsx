import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getRecommendations, RecommendedOpportunity } from '@/lib/recommendation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { ONG_TAGS } from '@/lib/feedback-tags';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock,
  Heart,
  Trophy,
  Target,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Loader2,
  Loader2,
  Star,
  MapPin,
} from 'lucide-react';

} from 'lucide-react';
import { ReviewCard } from '@/components/profile/ReviewCard';
import { ReviewHighlights } from '@/components/profile/ReviewHighlights';

interface Match {
  id: string;
  status: string;
  horas_validadas: number;
  feedback_ong: string | null;
  feedback_voluntario: string | null;
  rating: number | null;
  rating_voluntario: number | null;
  tags_voluntario: string[] | null;
  tags_ong: string[] | null;
  updated_at: string;
  opportunity: {
    id: string;
    titulo: string;
    descricao: string;
    horas_estimadas: number;
    location: string | null;
    ong: {
      id: string;
      nome: string;
    };
  };
}

export default function VolunteerDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<RecommendedOpportunity[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado' | 'concluido'>('todos');
  const [evaluatingMatch, setEvaluatingMatch] = useState<Match | null>(null);
  const [volunteerReviewData, setVolunteerReviewData] = useState({ rating: 5, feedback: '', tags: [] as string[] });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/dashboard');
        return;
      }
      if (profile && profile.tipo !== 'voluntario') {
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
      // 1. Fetch matches first so we can filter recommendations
      const { data: matchesData, error: matchError } = await supabase
        .from('matches')
        .select(`
          id,
          status,
          horas_validadas,
          feedback_ong,
          feedback_voluntario,
          rating,
          rating_voluntario,
          tags_voluntario,
          tags_ong,
          updated_at,
          opportunity_id,
          opportunity:opportunities(
            id,
            titulo,
            descricao,
            horas_estimadas,
            location,
            ong:profiles!opportunities_ong_id_fkey(id, nome)

          )
        `)
        .eq('voluntario_id', profile.id)
        .order('created_at', { ascending: false });

      if (matchError) throw matchError;

      const processedMatches = (matchesData || []).map((m: any) => ({
        ...m,
        opportunity: {
          ...m.opportunity,
          ong: m.opportunity?.ong,
        },
      }));
      setMatches(processedMatches);

      // Create Set of ID's processedMatches
      const appliedOpportunityIds = new Set(processedMatches.map((m: any) => m.opportunity_id || m.opportunity?.id));

      // 2. Load opportunities for recommendations
      const { data: opportunities, error: oppError } = await supabase
        .from('opportunities')
        .select(`
          id,
          titulo,
          descricao,
          skills_required,
          horas_estimadas,
          location,
          ong:profiles!opportunities_ong_id_fkey(nome)
        `)
        .eq('ativa', true);

      if (oppError) throw oppError;

      // Get recommendations
      const formattedOpps = (opportunities || []).map((opp: any) => ({
        ...opp,
        ong_nome: opp.ong?.nome,
      }));

      const recs = getRecommendations(
        { bio: profile.bio, skills: profile.skills, locations: profile.locations },
        formattedOpps,
        50 // Get more candidates before filtering
      );

      // Filter by compatibility (>= 40%) AND exclude applied opportunities
      const filteredRecs = recs.filter(r =>
        r.score >= 0.4 && !appliedOpportunityIds.has(r.id)
      );

      setRecommendations(filteredRecs);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (opportunityId: string) => {
    if (!profile) return;

    setApplyingTo(opportunityId);

    try {
      const { error } = await supabase.from('matches').insert({
        voluntario_id: profile.id,
        opportunity_id: opportunityId,
        status: 'pendente',
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Você já se candidatou',
            description: 'Você já se candidatou a esta oportunidade.',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Candidatura enviada!',
          description: 'A ONG irá avaliar sua candidatura.',
        });
        loadData();
      }
    } catch (error) {
      console.error('Error applying:', error);
      toast({
        title: 'Erro ao candidatar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setApplyingTo(null);
    }
  };

  // Calculate portfolio stats
  const totalHours = matches
    .filter((m) => m.status === 'concluido')
    .reduce((sum, m) => sum + (m.horas_validadas || 0), 0);

  const avgRating =
    matches.filter((m) => m.rating).reduce((sum, m) => sum + (m.rating || 0), 0) /
    (matches.filter((m) => m.rating).length || 1) || 0;

  const completedCount = matches.filter((m) => m.status === 'concluido').length;

  const handleSubmitVolunteerReview = async () => {
    if (!evaluatingMatch) return;

    setIsSubmittingReview(true);
    try {
      const { error } = await supabase
        .from('matches')
        .update({
          rating_voluntario: volunteerReviewData.rating,
          feedback_voluntario: volunteerReviewData.feedback.trim() || null,
          tags_voluntario: volunteerReviewData.tags.length > 0 ? volunteerReviewData.tags : null,
        })
        .eq('id', evaluatingMatch.id);

      if (error) throw error;

      toast({
        title: 'Avaliação enviada!',
        description: 'Obrigado por avaliar esta experiência.',
      });

      setMatches((prev) =>
        prev.map((m) =>
          m.id === evaluatingMatch.id
            ? {
              ...m,
              rating_voluntario: volunteerReviewData.rating,
              feedback_voluntario: volunteerReviewData.feedback.trim() || null,
              tags_voluntario: volunteerReviewData.tags.length > 0 ? volunteerReviewData.tags : null,
            }
            : m
        )
      );
      setEvaluatingMatch(null);
      setVolunteerReviewData({ rating: 5, feedback: '', tags: [] });
    } catch (error) {
      console.error('Error submitting volunteer review:', error);
      toast({
        title: 'Erro ao enviar avaliação',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Olá, {profile?.nome?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Veja oportunidades recomendadas para você e acompanhe seu impacto.
          </p>
        </div>

        {/* Portfolio Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Horas Doadas
              </CardTitle>
              <Clock className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalHours}h</div>
              <p className="text-xs text-muted-foreground">De trabalho voluntário</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projetos Concluídos
              </CardTitle>
              <Trophy className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedCount}</div>
              <p className="text-xs text-muted-foreground">Oportunidades finalizadas</p>
            </CardContent>
          </Card>

          <Card className="border-warning/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avaliação Média
              </CardTitle>
              <Target className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{avgRating.toFixed(1)}</span>
                <StarRating rating={Math.round(avgRating)} size="sm" />
              </div>
              <p className="text-xs text-muted-foreground">Baseado em feedbacks</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recommendations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recommendations" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Recomendadas
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <Heart className="h-4 w-4" />
              Minhas Candidaturas
            </TabsTrigger>
            <TabsTrigger value="feedbacks" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Meus Feedbacks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Oportunidades para você</h2>
            </div>

            {recommendations.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  Não encontramos oportunidades ainda. Atualize seu perfil com suas habilidades!
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {recommendations.map((opp) => (
                  <Card key={opp.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{opp.titulo}</CardTitle>
                          <CardDescription className="mt-1">
                            {opp.ong_nome}
                          </CardDescription>
                        </div>
                        {opp.score > 0 && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {Math.round(opp.score * 100)}% Match
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
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
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => navigate(`/vaga/${opp.id}`)}
                        variant="secondary"
                      >
                        Ver detalhes
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setStatusFilter('todos')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${statusFilter === 'todos'
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
              >
                <span>Todos</span>
                <span className={`px-1.5 h-5 min-w-[1.25rem] flex items-center justify-center text-[10px] rounded-full ${statusFilter === 'todos' ? "bg-white/20" : "bg-muted-foreground/10"
                  }`}>
                  {matches.length}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('pendente')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${statusFilter === 'pendente'
                  ? "border-yellow-500 bg-yellow-500 text-white shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
              >
                <span>Pendente</span>
                <span className={`px-1.5 h-5 min-w-[1.25rem] flex items-center justify-center text-[10px] rounded-full ${statusFilter === 'pendente' ? "bg-white/20" : "bg-muted-foreground/10"
                  }`}>
                  {matches.filter(m => m.status === 'pendente').length}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('aprovado')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${statusFilter === 'aprovado'
                  ? "border-green-600 bg-green-600 text-white shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
              >
                <span>Selecionado</span>
                <span className={`px-1.5 h-5 min-w-[1.25rem] flex items-center justify-center text-[10px] rounded-full ${statusFilter === 'aprovado' ? "bg-white/20" : "bg-muted-foreground/10"
                  }`}>
                  {matches.filter(m => m.status === 'aprovado').length}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('rejeitado')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${statusFilter === 'rejeitado'
                  ? "border-red-500 bg-red-500 text-white shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
              >
                <span>Não selecionado</span>
                <span className={`px-1.5 h-5 min-w-[1.25rem] flex items-center justify-center text-[10px] rounded-full ${statusFilter === 'rejeitado' ? "bg-white/20" : "bg-muted-foreground/10"
                  }`}>
                  {matches.filter(m => m.status === 'rejeitado').length}
                </span>
              </button>
              <button
                onClick={() => setStatusFilter('concluido')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${statusFilter === 'concluido'
                  ? "border-green-600 bg-green-600 text-white shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
              >
                <span>Concluídas</span>
                <span className={`px-1.5 h-5 min-w-[1.25rem] flex items-center justify-center text-[10px] rounded-full ${statusFilter === 'concluido' ? "bg-white/20" : "bg-muted-foreground/10"
                  }`}>
                  {matches.filter(m => m.status === 'concluido').length}
                </span>
              </button>
            </div>

            {matches.filter((m) => statusFilter === 'todos' || m.status === statusFilter).length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhuma candidatura encontrada com esse filtro.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {matches
                  .filter((m) => statusFilter === 'todos' || m.status === statusFilter)
                  .map((match) => (
                    <Card key={match.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {match.opportunity.titulo}
                            </CardTitle>
                            <CardDescription>
                              {match.opportunity.ong?.nome}
                            </CardDescription>
                            {match.opportunity.location != null && match.opportunity.location.trim() !== '' && (
                              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span>{match.opportunity.location}</span>
                              </div>
                            )}
                          </div>
                          <Badge
                            variant={
                              match.status === 'aprovado' || match.status === 'concluido' ? 'default' : 'secondary'
                            }
                          >
                            {match.status === 'pendente' && 'Pendente'}
                            {match.status === 'aprovado' && 'Aprovado'}
                            {match.status === 'rejeitado' && 'Não selecionado'}
                            {match.status === 'concluido' && 'Concluído'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {match.opportunity.descricao}
                        </p>
                      </CardContent>
                      {match.status === 'concluido' && (
                        <CardFooter className="border-t pt-4">
                          {match.rating_voluntario != null ||
                            (match.feedback_voluntario != null && match.feedback_voluntario.trim() !== '') ? (
                            <div className="w-full rounded-lg bg-muted/50 p-4 space-y-3">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Sua Avaliação
                              </p>
                              {match.rating_voluntario != null && (
                                <div className="flex items-center gap-1.5">
                                  <StarRating rating={match.rating_voluntario} size="sm" />
                                  <span className="text-sm text-muted-foreground">
                                    {match.rating_voluntario}/5
                                  </span>
                                </div>
                              )}
                              {match.feedback_voluntario != null && match.feedback_voluntario.trim() !== '' && (
                                <p className="text-sm text-foreground/90">
                                  {match.feedback_voluntario}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex w-full justify-end">
                              <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => {
                                  setEvaluatingMatch(match);
                                  setVolunteerReviewData({ rating: 5, feedback: '', tags: [] });
                                }}
                              >
                                <Star className="h-4 w-4" />
                                Avaliar Experiência
                              </Button>
                            </div>
                          )}
                        </CardFooter>
                      )}
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="feedbacks" className="space-y-4">
            {matches.filter((m) => m.status === 'concluido').length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  Você ainda não possui avaliações de projetos concluídos.
                </p>
              </Card>
            ) : (
              <>
                {/* Resumo de Competências Reconhecidas */}
                <div className="mb-8">
                  <ReviewHighlights
                    tags={matches
                      .filter((m) => m.status === 'concluido')
                      .map((m) => m.tags_ong ?? [])
                    }
                    title="Resumo de Competências Reconhecidas"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {matches
                    .filter((m) => m.status === 'concluido')
                    .map((match) => (
                      <ReviewCard
                        key={match.id}
                        reviewer={{
                          id: match.opportunity.ong.id,
                          name: match.opportunity.ong.nome,
                          avatarUrl: null,
                        }}
                        rating={match.rating || 0}
                        date={new Date(match.updated_at).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        subtitle={match.opportunity.titulo}
                        comment={match.feedback_ong || undefined}
                        tags={match.tags_ong}
                        expandLabel="Ver competências destacadas"
                      />
                    ))}
                </div>
              </>

            )}
          </TabsContent>

          {/* Modal: Avaliar Experiência (voluntário avalia a ONG) */}
          <Dialog
            open={!!evaluatingMatch}
            onOpenChange={(open) => {
              if (!open) setEvaluatingMatch(null);
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Avaliar Experiência</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {evaluatingMatch && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium">{evaluatingMatch.opportunity.ong?.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {evaluatingMatch.opportunity.titulo}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Nota (1 a 5 estrelas)</Label>
                  <StarRating
                    rating={volunteerReviewData.rating}
                    size="lg"
                    interactive
                    onChange={(rating) =>
                      setVolunteerReviewData((prev) => ({ ...prev, rating }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Pontos Fortes da Experiência (opcional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {ONG_TAGS.map((tag) => {
                      const selected = volunteerReviewData.tags.includes(tag);
                      return (
                        <Button
                          key={tag}
                          type="button"
                          variant={selected ? 'default' : 'outline'}
                          size="sm"
                          className="h-8"
                          onClick={() =>
                            setVolunteerReviewData((prev) => ({
                              ...prev,
                              tags: selected
                                ? prev.tags.filter((t) => t !== tag)
                                : [...prev.tags, tag],
                            }))
                          }
                        >
                          {tag}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Comentário</Label>
                  <Textarea
                    placeholder="Conte como foi sua experiência com esta ONG..."
                    value={volunteerReviewData.feedback}
                    onChange={(e) =>
                      setVolunteerReviewData((prev) => ({
                        ...prev,
                        feedback: e.target.value,
                      }))
                    }
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEvaluatingMatch(null)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitVolunteerReview}
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Enviar Avaliação
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Tabs >
      </main >
    </div >
  );
}
