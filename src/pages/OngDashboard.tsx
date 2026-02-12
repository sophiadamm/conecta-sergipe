import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useOngReviews } from '@/hooks/useOngReviews';
import { supabase } from '@/integrations/supabase/client';
import { generateEmbedding, buildOpportunityText } from '@/lib/embeddings';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  Trash2,
  Pencil,
  User,
  Mail,
  MapPin,
  Star,
  Search
} from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import { ReviewCard } from '@/components/profile/ReviewCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SERGIPE_CITIES } from '@/lib/locations';
import { VOLUNTEER_TAGS } from '@/lib/feedback-tags';

const opportunitySchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  skills_required: z.string().optional(),
  horas_estimadas: z.coerce.number().min(1, 'Horas devem ser maior que 0'),
  location: z.string().min(1, 'Localização é obrigatória'),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

interface Opportunity {
  id: string;
  titulo: string;
  descricao: string;
  skills_required: string | null;
  horas_estimadas: number;
  ativa: boolean;
  location: string | null;
  embedding?: number[] | null;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'opportunities';

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewingMatch, setReviewingMatch] = useState<Match | null>(null);
  const [reviewData, setReviewData] = useState({ feedback: '', rating: 5, horas: 0, tags: [] as string[] });
  const [opportunityToDelete, setOpportunityToDelete] = useState<string | null>(null);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [selectedOpportunityFilter, setSelectedOpportunityFilter] = useState<string>('all');
  const [selectedActiveOpportunityFilter, setSelectedActiveOpportunityFilter] = useState<string>('all');
  const [viewingVolunteer, setViewingVolunteer] = useState<Match['voluntario'] | null>(null);
  const [isOptimizingOpportunities, setIsOptimizingOpportunities] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState({ current: 0, total: 0 });

  const { reviews: ongReviews, avgRating: ongAvgRating, totalCount: ongReviewsCount } = useOngReviews(profile?.id);

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      skills_required: '',
      horas_estimadas: 4,
      location: '',
    },
  });

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

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
      setOpportunities(oppsData as unknown as Opportunity[] || []);

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

  const handleSaveOpportunity = async (data: OpportunityFormData) => {
    if (!profile) return;

    setIsSubmitting(true);

    try {
      // Generate embedding from opportunity text
      const opportunityText = buildOpportunityText({
        titulo: data.titulo,
        descricao: data.descricao,
        skills_required: data.skills_required || null,
      });
      const embedding = await generateEmbedding(opportunityText);

      const updateData: any = {
        titulo: data.titulo,
        descricao: data.descricao,
        skills_required: data.skills_required || null,
        horas_estimadas: data.horas_estimadas,
        location: data.location,
      };

      if (embedding) {
        updateData.embedding = JSON.stringify(embedding);
      }

      if (editingOpportunity) {
        // Update existing opportunity
        const { error } = await supabase
          .from('opportunities')
          .update(updateData)
          .eq('id', editingOpportunity.id);

        if (error) throw error;

        toast({
          title: 'Oportunidade atualizada!',
          description: 'As alterações foram salvas com sucesso.',
        });
      } else {
        // Create new opportunity
        const { error } = await supabase.from('opportunities').insert({
          ...updateData,
          ong_id: profile.id,
        });

        if (error) throw error;

        toast({
          title: 'Oportunidade criada!',
          description: 'Voluntários poderão se candidatar agora.',
        });
      }

      setShowCreateDialog(false);
      setEditingOpportunity(null);
      form.reset();
      loadData();
    } catch (error) {
      console.error('Error saving opportunity:', error);
      toast({
        title: editingOpportunity ? 'Erro ao atualizar' : 'Erro ao criar oportunidade',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptimizeOpportunities = async () => {
    if (!profile) return;

    setIsOptimizingOpportunities(true);
    setOptimizationProgress({ current: 0, total: 0 });

    try {
      // Buscar todas as oportunidades da ONG sem embedding
      const { data: opportunitiesWithoutEmbedding, error: fetchError } = await supabase
        .from('opportunities')
        .select('id, titulo, descricao, skills_required')
        .eq('ong_id', profile.id)
        .is('embedding', null);

      if (fetchError) throw fetchError;

      if (!opportunitiesWithoutEmbedding || opportunitiesWithoutEmbedding.length === 0) {
        toast({
          title: 'Tudo otimizado!',
          description: 'Todas as suas oportunidades já possuem embeddings gerados.',
        });
        setIsOptimizingOpportunities(false);
        return;
      }

      setOptimizationProgress({ current: 0, total: opportunitiesWithoutEmbedding.length });

      // Processar cada oportunidade
      for (let i = 0; i < opportunitiesWithoutEmbedding.length; i++) {
        const opp = opportunitiesWithoutEmbedding[i];
        
        try {
          // Gerar embedding
          const opportunityText = buildOpportunityText({
            titulo: opp.titulo,
            descricao: opp.descricao,
            skills_required: opp.skills_required || null,
          });
          const embedding = await generateEmbedding(opportunityText);

          if (embedding) {
            // Atualizar no Supabase
            const { error: updateError } = await supabase
              .from('opportunities')
              .update({ embedding: JSON.stringify(embedding) })
              .eq('id', opp.id);

            if (updateError) {
              console.error(`Erro ao atualizar oportunidade ${opp.id}:`, updateError);
            }
          }

          setOptimizationProgress({ current: i + 1, total: opportunitiesWithoutEmbedding.length });
        } catch (error) {
          console.error(`Erro ao processar oportunidade ${opp.id}:`, error);
        }
      }

      toast({
        title: 'Otimização concluída!',
        description: `${opportunitiesWithoutEmbedding.length} oportunidade(s) processada(s) com sucesso.`,
      });

      // Recarregar dados
      loadData();
    } catch (error) {
      console.error('Error optimizing opportunities:', error);
      toast({
        title: 'Erro ao otimizar',
        description: 'Ocorreu um erro ao processar as oportunidades. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsOptimizingOpportunities(false);
      setOptimizationProgress({ current: 0, total: 0 });
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
          tags_ong: reviewData.tags.length > 0 ? reviewData.tags : null,
        })
        .eq('id', reviewingMatch.id);

      if (error) throw error;

      toast({
        title: 'Trabalho concluído!',
        description: `${reviewData.horas} horas foram adicionadas ao portfólio do voluntário.`,
      });

      setReviewingMatch(null);
      setReviewData({ feedback: '', rating: 5, horas: 0, tags: [] });
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

  const handleDeleteOpportunity = async () => {
    if (!opportunityToDelete) return;

    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', opportunityToDelete);

      if (error) throw error;

      toast({
        title: 'Oportunidade excluída',
        description: 'A oportunidade foi removida com sucesso.',
      });

      loadData();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      toast({
        title: 'Erro ao excluir',
        variant: 'destructive',
      });
    } finally {
      setOpportunityToDelete(null);
    }
  };

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
          <Button onClick={() => navigate('/ong/nova-oportunidade')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Oportunidade
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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

          <Card className="border-warning/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avaliação Média
              </CardTitle>
              <Star className="h-5 w-5 text-warning fill-warning" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">
                  {ongReviewsCount === 0 ? '—' : ongAvgRating.toFixed(1)}
                </span>
                {ongReviewsCount > 0 && (
                  <StarRating rating={Math.round(ongAvgRating)} size="sm" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {ongReviewsCount === 0
                  ? 'Nenhuma avaliação ainda'
                  : `${ongReviewsCount} avaliação${ongReviewsCount !== 1 ? 'ões' : ''} recebida${ongReviewsCount !== 1 ? 's' : ''}`}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
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
            <TabsTrigger value="feedbacks" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Meus Feedbacks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-4">
            {opportunities.length > 0 && (
              <Card className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Otimização de Vagas</h3>
                      <p className="text-sm text-muted-foreground">
                        Gere embeddings para melhorar o matching semântico das suas oportunidades
                      </p>
                    </div>
                    <Button
                      onClick={handleOptimizeOpportunities}
                      disabled={isOptimizingOpportunities}
                      variant="outline"
                      className="gap-2"
                    >
                      {isOptimizingOpportunities ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Briefcase className="h-4 w-4" />
                          Otimizar Vagas
                        </>
                      )}
                    </Button>
                  </div>
                  {isOptimizingOpportunities && optimizationProgress.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Processando oportunidades...
                        </span>
                        <span className="font-medium">
                          {optimizationProgress.current} / {optimizationProgress.total}
                        </span>
                      </div>
                      <Progress
                        value={(optimizationProgress.current / optimizationProgress.total) * 100}
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              </Card>
            )}
            {opportunities.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Você ainda não criou nenhuma oportunidade.
                </p>
                <Button onClick={() => navigate('/ong/nova-oportunidade')}>
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
                    <CardFooter className="justify-end gap-2 pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/ong/editar-oportunidade/${opp.id}`)}
                        className="gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setOpportunityToDelete(opp.id)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {/* Opportunity Filter */}
            <div className="flex items-center gap-4 mb-4">
              <Label htmlFor="opportunity-filter" className="text-sm font-medium">
                Filtrar por oportunidade:
              </Label>
              <Select value={selectedOpportunityFilter} onValueChange={setSelectedOpportunityFilter}>
                <SelectTrigger id="opportunity-filter" className="w-[300px]">
                  <SelectValue placeholder="Todas as oportunidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as oportunidades</SelectItem>
                  {opportunities.map((opp) => (
                    <SelectItem key={opp.id} value={opp.id}>
                      {opp.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {matches.filter((m) =>
              m.status === 'pendente' &&
              (selectedOpportunityFilter === 'all' || m.opportunity?.id === selectedOpportunityFilter)
            ).length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {selectedOpportunityFilter === 'all'
                    ? 'Nenhuma candidatura pendente.'
                    : 'Nenhuma candidatura pendente para esta oportunidade.'}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {matches
                  .filter((m) =>
                    m.status === 'pendente' &&
                    (selectedOpportunityFilter === 'all' || m.opportunity?.id === selectedOpportunityFilter)
                  )
                  .map((match) => (
                    <Card key={match.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <Link
                                to={`/perfil/${match.voluntario?.id}`}
                                className="hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
                              >
                                {match.voluntario?.nome}
                              </Link>
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
                      <CardFooter className="flex justify-between items-center gap-2 pt-2">
                        {/* Action Group 1: Communication (Safe Zone) */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/chat?newChatWith=${match.voluntario?.id}`)}
                          className="gap-2 text-primary hover:text-primary hover:bg-primary/10 border-primary/20"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Conversar
                        </Button>

                        {/* Action Group 2: Decision (Critical Zone) */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMatchAction(match.id, 'rejeitar')}
                            className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-4 w-4" />
                            Rejeitar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMatchAction(match.id, 'aprovar')}
                            className="gap-2 bg-success hover:bg-success/90 text-white"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Aprovar
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {/* Opportunity Filter */}
            <div className="flex items-center gap-4 mb-4">
              <Label htmlFor="active-opportunity-filter" className="text-sm font-medium">
                Filtrar por oportunidade:
              </Label>
              <Select value={selectedActiveOpportunityFilter} onValueChange={setSelectedActiveOpportunityFilter}>
                <SelectTrigger id="active-opportunity-filter" className="w-[300px]">
                  <SelectValue placeholder="Todas as oportunidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as oportunidades</SelectItem>
                  {opportunities.map((opp) => (
                    <SelectItem key={opp.id} value={opp.id}>
                      {opp.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {matches.filter((m) =>
              m.status === 'aprovado' &&
              (selectedActiveOpportunityFilter === 'all' || m.opportunity?.id === selectedActiveOpportunityFilter)
            ).length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {selectedActiveOpportunityFilter === 'all'
                    ? 'Nenhum trabalho em andamento.'
                    : 'Nenhum trabalho em andamento para esta oportunidade.'}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {matches
                  .filter((m) =>
                    m.status === 'aprovado' &&
                    (selectedActiveOpportunityFilter === 'all' || m.opportunity?.id === selectedActiveOpportunityFilter)
                  )
                  .map((match) => (
                    <Card key={match.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              <Link
                                to={`/perfil/${match.voluntario?.id}`}
                                className="hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
                              >
                                {match.voluntario?.nome}
                              </Link>
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
                              tags: [],
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

          <TabsContent value="feedbacks" className="space-y-4">
            {ongReviewsCount === 0 ? (
              <Card className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground font-medium">Nenhuma avaliação recebida ainda</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Quando voluntários concluírem experiências e avaliarem sua organização, as notas e comentários aparecerão aqui.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {ongReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    reviewer={{
                      id: review.voluntario_id,
                      name: review.voluntario?.nome ?? 'Voluntário',
                      avatarUrl: review.voluntario?.avatar_url,
                    }}
                    rating={review.rating_voluntario}
                    date={new Date(review.updated_at).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    subtitle={review.opportunity?.titulo ?? 'Oportunidade'}
                    comment={review.feedback_voluntario}
                    tags={review.tags_voluntario}
                    expandLabel="Ver pontos fortes"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create/Edit Opportunity Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) {
          setEditingOpportunity(null);
          form.reset({
            titulo: '',
            descricao: '',
            skills_required: '',
            horas_estimadas: 4,
            location: '',
          });
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOpportunity ? 'Editar Oportunidade' : 'Nova Oportunidade'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSaveOpportunity)} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="location">Localização da Vaga *</Label>
              <Controller
                name="location"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Selecione a cidade..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SERGIPE_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.location && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.location.message}
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
                  editingOpportunity ? 'Salvar Alterações' : 'Criar Oportunidade'
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
              <Label className="text-muted-foreground text-xs">Destaques do Voluntário (opcional)</Label>
              <div className="flex flex-wrap gap-2">
                {VOLUNTEER_TAGS.map((tag) => {
                  const selected = reviewData.tags.includes(tag);
                  return (
                    <Button
                      key={tag}
                      type="button"
                      variant={selected ? 'default' : 'outline'}
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        setReviewData({
                          ...reviewData,
                          tags: selected
                            ? reviewData.tags.filter((t) => t !== tag)
                            : [...reviewData.tags, tag],
                        })
                      }
                    >
                      {tag}
                    </Button>
                  );
                })}
              </div>
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

      <AlertDialog open={!!opportunityToDelete} onOpenChange={() => setOpportunityToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Oportunidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta oportunidade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOpportunity} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Volunteer Profile Dialog */}
      <Dialog open={!!viewingVolunteer} onOpenChange={() => setViewingVolunteer(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil do Candidato
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-lg mb-1">{viewingVolunteer?.nome}</h3>
              <p className="text-sm text-muted-foreground">ID: {viewingVolunteer?.id}</p>
            </div>

            {viewingVolunteer?.bio && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sobre</Label>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  {viewingVolunteer.bio}
                </p>
              </div>
            )}

            {viewingVolunteer?.skills && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Habilidades</Label>
                <div className="flex flex-wrap gap-2">
                  {viewingVolunteer.skills.split(',').map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {!viewingVolunteer?.bio && !viewingVolunteer?.skills && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Este candidato ainda não completou seu perfil.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingVolunteer(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
