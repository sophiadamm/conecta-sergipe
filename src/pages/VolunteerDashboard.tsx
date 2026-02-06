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
import {
  Clock,
  Heart,
  Trophy,
  Target,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface Match {
  id: string;
  status: string;
  horas_validadas: number;
  feedback_ong: string | null;
  rating: number | null;
  opportunity: {
    id: string;
    titulo: string;
    descricao: string;
    horas_estimadas: number;
    ong: {
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
          rating,
          opportunity_id,
          opportunity:opportunities(
            id,
            titulo,
            descricao,
            horas_estimadas,
            ong:profiles!opportunities_ong_id_fkey(nome)
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
              <div className="grid gap-4 md:grid-cols-2">
                {matches
                  .filter((m) => m.status === 'concluido')
                  .map((match) => (
                    <Card key={match.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{match.opportunity.ong?.nome}</CardTitle>
                            <CardDescription className="mt-1">{match.opportunity.titulo}</CardDescription>
                          </div>
                          {match.rating && (
                            <div className="flex flex-col items-end">
                              <StarRating rating={match.rating} size="sm" />
                              <span className="text-xs text-muted-foreground mt-1">
                                {match.rating}/5
                              </span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {match.feedback_ong ? (
                          <div className="bg-muted p-4 rounded-lg relative">
                            <MessageSquare className="h-4 w-4 text-muted-foreground absolute top-4 left-3" />
                            <p className="text-sm italic text-muted-foreground pl-5">
                              "{match.feedback_ong}"
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            Sem comentário em texto.
                          </p>
                        )}
                        <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{match.horas_validadas || 0} horas validadas</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

        </Tabs >
      </main >
    </div >
  );
}
