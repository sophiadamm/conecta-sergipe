import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Heart,
  Users,
  Building2,
  Sparkles,
  Clock,
  Star,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">
                Plataforma de Voluntariado de Sergipe
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Conectando{' '}
              <span className="text-gradient">corações</span>
              <br />
              que querem{' '}
              <span className="text-gradient">transformar</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              O Conecta Sergipe une voluntários apaixonados a ONGs que precisam de ajuda,
              usando inteligência artificial para criar matches perfeitos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button size="lg" className="gap-2" asChild>
                  <Link to="/dashboard">
                    Acessar Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="gap-2" asChild>
                    <Link to="/auth?mode=signup">
                      Quero ser voluntário
                      <Heart className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2" asChild>
                    <Link to="/auth?mode=signup">
                      Sou uma ONG
                      <Building2 className="h-5 w-5" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Como funciona</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma simples e inteligente para conectar quem quer ajudar
              com quem precisa de ajuda.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-primary/10 hover:shadow-glow transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Cadastre-se</CardTitle>
                <CardDescription>
                  Crie seu perfil como voluntário ou ONG em poucos minutos.
                  Conte suas habilidades e áreas de interesse.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-secondary/10 hover:shadow-glow-secondary transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg gradient-secondary flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>Match Inteligente</CardTitle>
                <CardDescription>
                  Nossa IA analisa seu perfil e encontra oportunidades que combinam
                  com suas habilidades e interesses.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-success/10 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-success flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-success-foreground" />
                </div>
                <CardTitle>Faça a diferença</CardTitle>
                <CardDescription>
                  Candidate-se, contribua e construa seu portfólio de impacto
                  com horas validadas e feedbacks.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* For Volunteers */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Heart className="h-4 w-4" />
                Para Voluntários
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Construa seu portfólio de impacto
              </h2>
              <p className="text-muted-foreground mb-6">
                Cada hora que você doa é registrada, validada e se torna parte
                do seu histórico. Receba feedbacks e avaliações das ONGs.
              </p>
              <ul className="space-y-3">
                {[
                  'Recomendações personalizadas por IA',
                  'Portfólio com horas validadas',
                  'Feedbacks e avaliações',
                  'Certificação de voluntariado',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="p-6 shadow-glow">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-bold text-2xl">156h</p>
                      <p className="text-sm text-muted-foreground">Horas doadas</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Star className="h-8 w-8 text-warning" />
                    <div>
                      <p className="font-bold text-2xl">4.9</p>
                      <p className="text-sm text-muted-foreground">Avaliação média</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                    <div>
                      <p className="font-bold text-2xl">12</p>
                      <p className="text-sm text-muted-foreground">Projetos concluídos</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* For NGOs */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Card className="p-6 shadow-glow-secondary order-2 md:order-1">
              <CardContent className="p-0 space-y-4">
                {[
                  { title: 'Professor de Informática', skills: 'tecnologia, ensino', hours: 20 },
                  { title: 'Designer Voluntário', skills: 'design, criatividade', hours: 15 },
                  { title: 'Apoio Jurídico', skills: 'direito, advocacy', hours: 10 },
                ].map((opp, i) => (
                  <div key={i} className="p-4 bg-background rounded-lg border">
                    <p className="font-medium">{opp.title}</p>
                    <p className="text-sm text-muted-foreground">{opp.skills}</p>
                    <div className="flex items-center gap-1 mt-2 text-sm text-primary">
                      <Clock className="h-4 w-4" />
                      {opp.hours}h estimadas
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
                <Building2 className="h-4 w-4" />
                Para ONGs
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Encontre voluntários qualificados
              </h2>
              <p className="text-muted-foreground mb-6">
                Publique oportunidades, receba candidaturas de voluntários
                com as habilidades certas e valide o trabalho realizado.
              </p>
              <ul className="space-y-3">
                {[
                  'Crie oportunidades em minutos',
                  'Receba candidaturas filtradas por habilidades',
                  'Valide horas e dê feedbacks',
                  'Gestão completa de voluntários',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <Card className="p-8 md:p-12 text-center gradient-hero text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para fazer a diferença?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de sergipanos que já estão transformando
              vidas através do voluntariado.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="gap-2"
              asChild
            >
              <Link to="/auth?mode=signup">
                Começar agora
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <Heart className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">Conecta Sergipe</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Conecta Sergipe. Feito com ❤️ para Sergipe.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
