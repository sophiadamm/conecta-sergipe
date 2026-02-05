import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  cpf: string | null;
  tipo: 'voluntario' | 'ong';
  bio: string | null;
  skills: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, profileData: Partial<Profile>) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileFetchedRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    // Prevent duplicate fetches for the same user
    if (profileFetchedRef.current === userId) {
      return profile;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    profileFetchedRef.current = userId;
    return data as Profile | null;
  }, [profile]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMountedRef.current) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Only fetch profile on specific events to avoid redundant calls
        if (newSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setTimeout(() => {
            if (!isMountedRef.current) return;
            fetchProfile(newSession.user.id).then((p) => {
              if (isMountedRef.current) setProfile(p);
            });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          profileFetchedRef.current = null;
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMountedRef.current) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then((p) => {
          if (isMountedRef.current) {
            setProfile(p);
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (
    email: string,
    password: string,
    profileData: Partial<Profile>
  ): Promise<{ error: Error | null }> => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        nome: profileData.nome || '',
        cpf: profileData.cpf || null,
        tipo: profileData.tipo || 'voluntario',
        bio: profileData.bio || null,
        skills: profileData.skills || null,
      });

      if (profileError) {
        return { error: new Error(profileError.message) };
      }

      // Mark as fetched and set profile directly (avoid redundant fetch)
      profileFetchedRef.current = data.user.id;
      setProfile({
        id: '', // Will be updated on next fetch
        user_id: data.user.id,
        nome: profileData.nome || '',
        cpf: profileData.cpf || null,
        tipo: profileData.tipo || 'voluntario',
        bio: profileData.bio || null,
        skills: profileData.skills || null,
        avatar_url: null,
      });
    }

    return { error: null };
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    profileFetchedRef.current = null;
  };

  const refreshProfile = async () => {
    if (user) {
      profileFetchedRef.current = null; // Force refetch
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
