import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOpportunitySearch, CATEGORIES } from '@/hooks/useOpportunitySearch';
import { useOngSearch } from '@/hooks/useOngSearch';
import { Search, Clock, Building2, ArrowRight, Briefcase } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebounce } from '@/hooks/useDebounce';

export default function Explore() {
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('all');

  const [searchType, setSearchType] = useState('vagas');

  const debouncedQuery = useDebounce(searchInput, 300);

  const { data: opportunities, isLoading: loadingOpps, error: errorOpps } = useOpportunitySearch({
    query: debouncedQuery,
    category,
  });

  const { data: ongs, isLoading: loadingOngs, error: errorOngs } = useOngSearch({
    query: debouncedQuery,
    category,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explorar Oportunidades</h1>
          <p className="text-muted-foreground">
            Encontre oportunidades de voluntariado que combinam com você
          </p>
        </div>

        {/* Tabs to switch context */}
        <Tabs defaultValue="vagas" className="w-full mb-8" onValueChange={(val) => setSearchType(val)}>
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="vagas">Buscar Vagas</TabsTrigger>
            <TabsTrigger value="ongs">Buscar ONGs</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchType === 'vagas' ? "Buscar por título, descrição ou habilidades..." : "Buscar por nome da ONG ou bio..."}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {searchType === 'vagas' ? (
          /* OPPORTUNITIES LIST */
          loadingOpps ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : errorOpps ? (
            <Card className="p-8 text-center">
              <p className="text-destructive">Erro ao carregar oportunidades. Tente novamente.</p>
            </Card>
          ) : opportunities && opportunities.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {opportunities.length} oportunidade{opportunities.length !== 1 ? 's' : ''} encontrada{opportunities.length !== 1 ? 's' : ''}
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((opportunity) => {
                  const skills = opportunity.skills_required
                    ? opportunity.skills_required.split(',').map(s => s.trim()).filter(Boolean)
                    : [];

                  return (
                    <Card
                      key={opportunity.id}
                      className="overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all group"
                    >
                      <CardContent className="p-6">
                        {/* ONG Info */}
                        <Link
                          to={`/perfil/${opportunity.ong.id}`}
                          className="flex items-center gap-3 mb-4 group/ong"
                        >
                          <Avatar className="h-10 w-10 border">
                            {opportunity.ong.avatar_url ? (
                              <AvatarImage src={opportunity.ong.avatar_url} alt={opportunity.ong.nome} />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {opportunity.ong.nome.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground group-hover/ong:text-primary transition-colors">
                            {opportunity.ong.nome}
                          </span>
                        </Link>

                        {/* Opportunity Info */}
                        <Link to={`/vaga/${opportunity.id}`}>
                          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                            {opportunity.titulo}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                            {opportunity.descricao}
                          </p>
                        </Link>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {skills.slice(0, 3).map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{skills.length - 3}
                            </Badge>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-1 text-sm text-primary">
                            <Clock className="h-4 w-4" />
                            {opportunity.horas_estimadas}h
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1" asChild>
                            <Link to={`/vaga/${opportunity.id}`}>
                              Ver vaga
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma oportunidade encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchInput || category !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Ainda não há oportunidades publicadas'}
              </p>
              {(searchInput || category !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInput('');
                    setCategory('all');
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </Card>
          )
        ) : (
          /* ONGS LIST */
          loadingOngs ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : errorOngs ? (
            <Card className="p-8 text-center">
              <p className="text-destructive">Erro ao carregar ONGs. Tente novamente.</p>
            </Card>
          ) : ongs && ongs.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {ongs.length} ongs encontradas
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ongs.map((ong) => (
                  <Card key={ong.id} className="overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <Avatar className="h-24 w-24 mb-4 border-2 border-border">
                        {ong.avatar_url ? (
                          <AvatarImage src={ong.avatar_url} alt={ong.nome} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                          {ong.nome.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <h3 className="font-semibold text-xl mb-2">{ong.nome}</h3>

                      <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                        {ong.bio || "Sem descrição disponível."}
                      </p>

                      <Button className="w-full gap-2" variant="outline" asChild>
                        <Link to={`/perfil/${ong.id}`}>
                          Ver Perfil
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma ONG encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchInput
                  ? 'Tente ajustar os termos da busca'
                  : 'Ainda não há ONGs cadastradas'}
              </p>
              {searchInput && (
                <Button variant="outline" onClick={() => setSearchInput('')}>
                  Limpar busca
                </Button>
              )}
            </Card>
          )
        )}
      </main>
    </div>
  );
}
