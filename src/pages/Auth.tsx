import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { validateCPF, formatCPF } from '@/lib/cpf';
import { validateCNPJ, formatCNPJ } from '@/lib/cnpj';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Loader2, Building2, User, Linkedin, Github } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import { PREDEFINED_CAUSES } from '@/lib/causes';
import { SERGIPE_CITIES } from '@/lib/locations';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  tipo: z.enum(['voluntario', 'ong']),
  bio: z.string().optional(),
  skills: z.string().optional(),
  interests: z.string().optional(),
  locations: z.string().optional(),
  linkedin_url: z.string().url('URL inválida').optional().or(z.literal('')),
  github_url: z.string().url('URL inválida').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Senhas não conferem',
      path: ['confirmPassword'],
    });
  }

  if (data.tipo === 'ong') {
    if (data.cnpj && !validateCNPJ(data.cnpj)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CNPJ inválido',
        path: ['cnpj'],
      });
    }
  }

  if (data.tipo === 'voluntario') {
    if (data.cpf && !validateCPF(data.cpf)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CPF inválido',
        path: ['cpf'],
      });
    }

    if (!data.locations || data.locations.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Localização é obrigatória',
        path: ['locations'],
      });
    }

    if (!data.interests || data.interests.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione pelo menos uma área de interesse',
        path: ['interests'],
      });
    }
  }
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, signIn, signUp, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      nome: '',
      cpf: '',
      cnpj: '',
      tipo: 'voluntario',
      bio: '',
      skills: '',
      interests: '',
      locations: '',
      linkedin_url: '',
      github_url: '',
    },
  });

  const userType = signupForm.watch('tipo');

  useEffect(() => {
    if (user && !authLoading) {
      if (profile) {
        navigate('/dashboard');
      }
      // Removed automatic signOut - give time for profile creation
      // If profile doesn't exist after signup, it will be handled by the signup error flow
    }
  }, [user, profile, authLoading, navigate]);

  const handleLogin = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const { error } = await signUp(data.email, data.password, {
        nome: data.nome,
        cpf: data.cpf ? data.cpf.replace(/\D/g, '') : null,
        cnpj: data.cnpj ? data.cnpj.replace(/\D/g, '') : null,
        tipo: data.tipo,
        bio: data.bio || null,
        skills: data.skills || null,
        interests: data.interests || null,
        locations: data.locations ? data.locations.split(',').map(l => l.trim()).filter(Boolean) : null,
        linkedin_url: data.linkedin_url || null,
        github_url: data.github_url || null,
      });

      if (error) {
        if (error.message.includes('already registered')) {
          // If user is already registered but has an active session, redirect to dashboard
          if (user) {
            navigate('/dashboard');
            return;
          }
          setError('Este email já está cadastrado. Faça login para continuar.');
        } else {
          setError(error.message);
        }
      } else {
        // Success - navigate to dashboard explicitly
        // The useEffect will also handle this, but we do it here for immediate feedback
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent via-background to-background p-4">
      <Card className="w-full max-w-lg shadow-glow">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary shadow-lg">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Conecta Sergipe</CardTitle>
          <CardDescription>
            Conectando voluntários e ONGs para transformar vidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register('password')}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <div className="space-y-3">
                  <Label>Tipo de conta</Label>
                  <RadioGroup
                    value={userType}
                    onValueChange={(value) => signupForm.setValue('tipo', value as 'voluntario' | 'ong')}
                    className="grid grid-cols-2 gap-4"
                  >
                    <Label
                      htmlFor="voluntario"
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${userType === 'voluntario'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                        }`}
                    >
                      <RadioGroupItem value="voluntario" id="voluntario" className="sr-only" />
                      <User className="h-8 w-8 mb-2 text-primary" />
                      <span className="font-medium">Voluntário</span>
                      <span className="text-xs text-muted-foreground">Quero ajudar</span>
                    </Label>
                    <Label
                      htmlFor="ong"
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all ${userType === 'ong'
                        ? 'border-secondary bg-secondary/5'
                        : 'border-muted hover:border-secondary/50'
                        }`}
                    >
                      <RadioGroupItem value="ong" id="ong" className="sr-only" />
                      <Building2 className="h-8 w-8 mb-2 text-secondary" />
                      <span className="font-medium">ONG</span>
                      <span className="text-xs text-muted-foreground">Preciso de ajuda</span>
                    </Label>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">
                    {userType === 'ong' ? 'Nome da ONG' : 'Nome completo'}
                  </Label>
                  <Input
                    id="nome"
                    placeholder={userType === 'ong' ? 'Nome da sua ONG' : 'Seu nome completo'}
                    {...signupForm.register('nome')}
                  />
                  {signupForm.formState.errors.nome && (
                    <p className="text-sm text-destructive">
                      {signupForm.formState.errors.nome.message}
                    </p>
                  )}
                </div>

                {userType === 'voluntario' && (
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      {...signupForm.register('cpf')}
                    />
                    {signupForm.formState.errors.cpf && (
                      <p className="text-sm text-destructive">
                        {signupForm.formState.errors.cpf.message}
                      </p>
                    )}
                  </div>
                )}

                {userType === 'ong' && (
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      {...signupForm.register('cnpj')}
                    />
                    {signupForm.formState.errors.cnpj && (
                      <p className="text-sm text-destructive">
                        {signupForm.formState.errors.cnpj.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...signupForm.register('email')}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      {...signupForm.register('password')}
                    />
                    {signupForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {signupForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      {...signupForm.register('confirmPassword')}
                    />
                    {signupForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {signupForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">
                    {userType === 'ong' ? 'Sobre a ONG' : 'Sobre você'}
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder={
                      userType === 'ong'
                        ? 'Descreva a missão e atividades da sua ONG...'
                        : 'Conte um pouco sobre você e suas motivações...'
                    }
                    {...signupForm.register('bio')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">
                    {userType === 'ong' ? 'Áreas de Atuação / Causas' : 'Habilidades / Skills'}
                  </Label>
                  <Controller
                    name="skills"
                    control={signupForm.control}
                    render={({ field }) => (
                      <MultiSelect
                        options={userType === 'ong' ? Object.values(PREDEFINED_CAUSES) : Object.values(PREDEFINED_SKILLS)}
                        selected={field.value ? field.value.split(',').map(s => s.trim()).filter(Boolean) : []}
                        onChange={(selected) => field.onChange(selected.join(','))}
                        placeholder={userType === 'ong' ? "Selecione as causas..." : "Selecione as habilidades..."}
                        className="bg-background"
                      />
                    )}
                  />
                </div>

                {userType === 'voluntario' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="locations">Onde você pode atuar?</Label>
                      <Controller
                        name="locations"
                        control={signupForm.control}
                        render={({ field }) => (
                          <MultiSelect
                            options={SERGIPE_CITIES as unknown as string[]}
                            selected={field.value ? field.value.split(',').map(s => s.trim()).filter(Boolean) : []}
                            onChange={(selected) => field.onChange(selected.join(','))}
                            placeholder="Selecione as cidades..."
                            className="bg-background"
                          />
                        )}
                      />
                      {signupForm.formState.errors.locations && (
                        <p className="text-sm text-destructive">
                          {signupForm.formState.errors.locations.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Selecione as cidades de Sergipe onde você pode atuar.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interests">Áreas de Interesse</Label>
                      <Controller
                        name="interests"
                        control={signupForm.control}
                        render={({ field }) => (
                          <MultiSelect
                            options={Object.values(PREDEFINED_CAUSES)}
                            selected={field.value ? field.value.split(',').map(s => s.trim()).filter(Boolean) : []}
                            onChange={(selected) => field.onChange(selected.join(','))}
                            placeholder="Selecione as causas..."
                            className="bg-background"
                          />
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        Causas que você tem interesse em apoiar.
                      </p>
                      {signupForm.formState.errors.interests && (
                        <p className="text-sm text-destructive">
                          {signupForm.formState.errors.interests.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </Label>
                        <Input
                          id="linkedin_url"
                          placeholder="Link do perfil"
                          {...signupForm.register('linkedin_url')}
                        />
                        {signupForm.formState.errors.linkedin_url && (
                          <p className="text-sm text-destructive">
                            {signupForm.formState.errors.linkedin_url.message}
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
                          placeholder="Link do perfil"
                          {...signupForm.register('github_url')}
                        />
                        {signupForm.formState.errors.github_url && (
                          <p className="text-sm text-destructive">
                            {signupForm.formState.errors.github_url.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar conta'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
