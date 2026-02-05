import { useParams, useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { OngProfile } from '@/components/profile/OngProfile';
import { VolunteerProfile } from '@/components/profile/VolunteerProfile';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: profile, isLoading, error } = useProfile(id);

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

        {isLoading ? (
          <ProfileSkeleton />
        ) : error ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Perfil não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              O perfil que você procura não existe ou foi removido.
            </p>
            <Button onClick={() => navigate('/explorar')}>
              Explorar oportunidades
            </Button>
          </Card>
        ) : profile ? (
          profile.tipo === 'ong' ? (
            <OngProfile profile={profile} />
          ) : (
            <VolunteerProfile profile={profile} />
          )
        ) : null}
      </main>
    </div>
  );
}
