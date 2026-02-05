import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { validateCPF } from '@/lib/cpf';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, Linkedin, Github } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { PREDEFINED_SKILLS } from '@/lib/skills';

const profileSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  cpf: z.string().optional(),
  bio: z.string().optional(),
  skills: z.string().optional(),
  linkedin_url: z.string().url('URL inválida').optional().or(z.literal('')),
  github_url: z.string().url('URL inválida').optional().or(z.literal('')),
  experience_level: z.string().optional(),
}).refine((data) => {
  if (data.cpf) {
    return validateCPF(data.cpf);
  }
  return true;
}, {
  message: 'CPF inválido',
  path: ['cpf'],
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      bio: '',
      skills: '',
      linkedin_url: '',
      github_url: '',
      experience_level: 'iniciante',
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        nome: profile.nome || '',
        cpf: profile.cpf || '',
        bio: profile.bio || '',
        skills: profile.skills || '',
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
        experience_level: profile.experience_level || 'iniciante',
      });
    }
  }, [profile, form]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: data.nome,
          cpf: data.cpf || null,
          bio: data.bio || null,
          skills: data.skills || null,
          linkedin_url: data.linkedin_url || null,
          github_url: data.github_url || null,
          experience_level: data.experience_level || 'iniciante',
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro ao atualizar',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {profile.nome.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{profile.nome}</CardTitle>
            <CardDescription className="capitalize">
              {profile.tipo === 'ong' ? 'ONG' : 'Voluntário'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  {profile.tipo === 'ong' ? 'Nome da ONG' : 'Nome completo'}
                </Label>
                <Input id="nome" {...form.register('nome')} />
                {form.formState.errors.nome && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.nome.message}
                  </p>
                )}
              </div>

              {profile.tipo === 'voluntario' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" {...form.register('cpf')} />
                    {form.formState.errors.cpf && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.cpf.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience_level">Nível de Experiência</Label>
                    <Controller
                      name="experience_level"
                      control={form.control}
                      render={({ field }) => (
                        <Select value={field.value || 'iniciante'} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o nível" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="iniciante">Iniciante</SelectItem>
                            <SelectItem value="junior">Júnior</SelectItem>
                            <SelectItem value="senior">Sênior</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="bio">
                  {profile.tipo === 'ong' ? 'Sobre a ONG' : 'Sobre você'}
                </Label>
                <Textarea
                  id="bio"
                  rows={4}
                  placeholder={
                    profile.tipo === 'ong'
                      ? 'Descreva a missão e atividades da sua ONG...'
                      : 'Conte um pouco sobre você e suas motivações...'
                  }
                  {...form.register('bio')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">
                  {profile.tipo === 'ong' ? 'Áreas de atuação' : 'Habilidades'}
                </Label>
                <Controller
                  name="skills"
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
                <p className="text-xs text-muted-foreground">
                  Selecione as habilidades que você possui ou busca.
                </p>
              </div>

              {profile.tipo === 'voluntario' && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">Links Sociais</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin_url"
                      placeholder="https://linkedin.com/in/seu-perfil"
                      {...form.register('linkedin_url')}
                    />
                    {form.formState.errors.linkedin_url && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.linkedin_url.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github_url" className="flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      GitHub
                    </Label>
                    <Input
                      id="github_url"
                      placeholder="https://github.com/seu-usuario"
                      {...form.register('github_url')}
                    />
                    {form.formState.errors.github_url && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.github_url.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar alterações
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
