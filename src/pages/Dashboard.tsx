import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple navigations
    if (loading || hasNavigatedRef.current) return;
    
    if (!profile) {
      hasNavigatedRef.current = true;
      navigate('/auth', { replace: true });
    } else if (profile.tipo === 'voluntario') {
      hasNavigatedRef.current = true;
      navigate('/voluntario', { replace: true });
    } else if (profile.tipo === 'ong') {
      hasNavigatedRef.current = true;
      navigate('/ong', { replace: true });
    }
  }, [profile, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
