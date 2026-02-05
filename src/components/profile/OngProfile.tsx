import { Link } from 'react-router-dom';
import { ProfileData, useOngOpportunities } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Clock, MapPin, Mail, Briefcase, ArrowRight } from 'lucide-react';

interface OngProfileProps {
  profile: ProfileData;
}

export function OngProfile({ profile }: OngProfileProps) {
  const { data: opportunities, isLoading: loadingOpportunities } = useOngOpportunities(profile.id);

  const areasList = profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.nome} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                {profile.nome.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{profile.nome}</h1>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                  <Building2 className="mr-1 h-3 w-3" />
                  ONG
                </Badge>
              </div>

              {areasList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {areasList.map((area, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {area}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Sobre a Organização</h3>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {profile.bio || (
                <span className="italic opacity-50">
                  Esta organização ainda não adicionou uma descrição.
                </span>
              )}
            </p>
          </div>

          <div className="pt-4 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Nossas Oportunidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingOpportunities ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : opportunities && opportunities.length > 0 ? (
            <div className="space-y-4">
              {opportunities.map((opportunity) => {
                const skills = opportunity.skills_required
                  ? opportunity.skills_required.split(',').map(s => s.trim()).filter(Boolean)
                  : [];

                return (
                  <Link
                    key={opportunity.id}
                    to={`/vaga/${opportunity.id}`}
                    className="block p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold group-hover:text-primary transition-colors">
                        {opportunity.titulo}
                      </h4>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {opportunity.descricao}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 text-primary">
                        <Clock className="h-4 w-4" />
                        {opportunity.horas_estimadas}h
                      </div>
                      {skills.slice(0, 3).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {skills.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{skills.length - 3}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Esta ONG ainda não publicou oportunidades.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
