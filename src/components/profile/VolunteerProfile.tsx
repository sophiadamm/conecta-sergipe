import { Link } from 'react-router-dom';
import { ProfileData, useVolunteerCompletedMatches, useVolunteerReviews, calculateReviewStats } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { VolunteerReviewsSection } from './VolunteerReviewsSection';
import { 
  User, 
  Star, 
  Clock, 
  Briefcase, 
  Linkedin, 
  Github, 
  Award,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface VolunteerProfileProps {
  profile: ProfileData;
}

const experienceLevelMap: Record<string, { label: string; color: string }> = {
  iniciante: { label: 'Iniciante', color: 'bg-blue-100 text-blue-800' },
  junior: { label: 'Júnior', color: 'bg-green-100 text-green-800' },
  senior: { label: 'Sênior', color: 'bg-purple-100 text-purple-800' },
};

export function VolunteerProfile({ profile }: VolunteerProfileProps) {
  const { data: completedMatches, isLoading: loadingMatches } = useVolunteerCompletedMatches(profile.id);
  const { data: reviews, isLoading: loadingReviews } = useVolunteerReviews(profile.id);
  
  const reviewStats = calculateReviewStats(reviews || []);

  const skillsList = profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const experienceLevel = experienceLevelMap[profile.experience_level || 'iniciante'] || experienceLevelMap.iniciante;

  // Calculate total stats
  const totalHours = completedMatches?.reduce((sum, m) => sum + (m.horas_validadas || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-24 w-24 border-4 border-secondary/20">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.nome} />
              ) : null}
              <AvatarFallback className="bg-secondary/10 text-secondary text-3xl font-bold">
                {profile.nome.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{profile.nome}</h1>
                <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/20">
                  <User className="mr-1 h-3 w-3" />
                  Voluntário
                </Badge>
                <Badge className={experienceLevel.color}>
                  <Award className="mr-1 h-3 w-3" />
                  {experienceLevel.label}
                </Badge>
              </div>

              {/* Social Links */}
              {(profile.linkedin_url || profile.github_url) && (
                <div className="flex gap-3 mt-3">
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                      <span className="hidden sm:inline">LinkedIn</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Github className="h-5 w-5" />
                      <span className="hidden sm:inline">GitHub</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                  <Clock className="h-5 w-5" />
                  {totalHours}h
                </div>
                <p className="text-xs text-muted-foreground">Horas</p>
              </div>
              {reviewStats.avgRating > 0 && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-warning">
                    <Star className="h-5 w-5 fill-warning" />
                    {reviewStats.avgRating.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">Avaliação</p>
                </div>
              )}
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  {completedMatches?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Projetos</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Bio */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Sobre</h3>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {profile.bio || (
                <span className="italic opacity-50">
                  Este voluntário ainda não adicionou uma bio.
                </span>
              )}
            </p>
          </div>

          {/* Skills */}
          {skillsList.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Competências</h3>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="px-3 py-1.5 text-sm bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <VolunteerReviewsSection 
        reviews={reviews || []} 
        stats={reviewStats} 
        isLoading={loadingReviews} 
      />

      {/* Portfolio Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-secondary" />
            Portfólio de Impacto
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMatches ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : completedMatches && completedMatches.length > 0 ? (
            <div className="space-y-4">
              {completedMatches.map((match) => (
                <div
                  key={match.id}
                  className="p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{match.opportunity.titulo}</h4>
                      <Link
                        to={`/perfil/${match.opportunity.ong.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {match.opportunity.ong.nome}
                      </Link>
                    </div>
                    {match.rating && (
                      <div className="flex items-center gap-1 text-warning">
                        <Star className="h-4 w-4 fill-warning" />
                        <span className="font-medium">{match.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {match.horas_validadas || 0}h validadas
                    </div>
                    <div className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-4 w-4" />
                      Concluído
                    </div>
                  </div>

                  {match.feedback_ong && (
                    <div className="mt-3 p-3 bg-background rounded border-l-2 border-primary/50">
                      <p className="text-sm italic text-muted-foreground">
                        "{match.feedback_ong}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Este voluntário ainda não concluiu nenhum projeto.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
