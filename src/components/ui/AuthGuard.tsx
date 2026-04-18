'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ children, requireAdmin = false, redirectTo = '/auth/login' }: Props) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace(`${redirectTo}?callbackUrl=${encodeURIComponent(window.location.pathname)}`); return; }
    if (requireAdmin && !isAdmin) { router.replace('/'); return; }
  }, [user, isAdmin, loading, requireAdmin, redirectTo, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted tracking-wider uppercase">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (requireAdmin && !isAdmin) return null;

  return <>{children}</>;
}
