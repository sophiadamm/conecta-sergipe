import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building, User, Mail, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PublicProfileData {
    id: string;
    nome: string;
    bio: string | null;
    skills: string | null;
    tipo: 'ong' | 'voluntario' | 'admin';
    created_at: string;
}

export default function PublicProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<PublicProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadProfile();
        }
    }, [id]);

    const loadProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, nome, bio, skills, tipo, created_at')
                .eq('id', id)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error('Error loading profile:', error);
            toast({
                title: 'Erro ao carregar perfil',
                description: 'Perfil não encontrado ou erro de conexão.',
                variant: 'destructive',
            });
            navigate(-1); // Go back if error
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8 max-w-2xl">
                    <Button variant="ghost" className="mb-6" disabled>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                    <Card className="text-center p-8">
                        <div className="flex flex-col items-center space-y-4">
                            <Skeleton className="h-24 w-24 rounded-full" />
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </Card>
                </main>
            </div>
        );
    }

    if (!profile) return null;

    const skillsList = profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8 max-w-3xl">
                <Button
                    variant="ghost"
                    className="mb-6"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                <Card className="mb-6">
                    <CardHeader className="text-center pt-8 pb-4">
                        <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                                {profile.nome.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-3xl font-bold">{profile.nome}</CardTitle>
                        <div className="flex justify-center gap-2 mt-2">
                            <Badge variant={profile.tipo === 'ong' ? 'default' : 'secondary'}>
                                {profile.tipo === 'ong' ? <Building className="mr-1 h-3 w-3" /> : <User className="mr-1 h-3 w-3" />}
                                {profile.tipo === 'ong' ? 'ONG' : 'Voluntário'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">
                                {profile.tipo === 'ong' ? 'Sobre a Organização' : 'Sobre'}
                            </h3>
                            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                {profile.bio || (
                                    <span className="italic opacity-50">
                                        {profile.tipo === 'ong'
                                            ? 'Esta organização ainda não adicionou uma descrição.'
                                            : 'Este usuário ainda não adicionou ma bio.'}
                                    </span>
                                )}
                            </p>
                        </div>

                        {skillsList.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">
                                    {profile.tipo === 'ong' ? 'Áreas de Atuação' : 'Habilidades'}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {skillsList.map((skill, index) => (
                                        <Badge key={index} variant="outline" className="px-3 py-1 text-sm bg-background">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t text-sm text-muted-foreground text-center">
                            Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
