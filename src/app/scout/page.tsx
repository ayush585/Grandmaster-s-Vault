'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AuthModal from '@/components/AuthModal';
import ScoutView from '@/components/scout/ScoutView';
import { ScoutProvider } from '@/contexts/ScoutContext';
import { useAuth } from '@/hooks/useAuth';
import { signOutUser } from '@/lib/auth';

export default function ScoutPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const handleViewChange = useCallback(
    (view: 'analysis' | 'library' | 'scout') => {
      if (view === 'analysis') {
        router.push('/');
        return;
      }
      if (view === 'library') {
        router.push('/?view=library');
        return;
      }
      router.push('/scout');
    },
    [router]
  );

  const handleSignOut = useCallback(async () => {
    await signOutUser();
    router.push('/');
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-deep">
        <div className="text-center">
          <span className="text-[3rem] text-gold block mb-4" style={{ animation: 'shimmer 4s ease-in-out infinite' }}>Q</span>
          <p className="text-text-tertiary text-[0.9rem]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        currentView="scout"
        onViewChange={handleViewChange}
        onUploadClick={() => router.push('/')}
        user={user}
        onSignInClick={() => setAuthOpen(true)}
        onSignOut={handleSignOut}
      />

      {!user ? (
        <main className="flex-1 flex items-center justify-center bg-bg-deep">
          <div className="text-center max-w-[520px] px-6">
            <span className="text-[4rem] text-gold block mb-6" style={{ animation: 'shimmer 4s ease-in-out infinite' }}>Q</span>
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] font-bold text-text-primary mb-3">
              Scouting Lab
            </h2>
            <p className="text-text-secondary text-[1rem] mb-8 leading-relaxed">
              Sign in to scout opponents, analyze your own weaknesses, and train with targeted puzzles.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="px-8 py-3 rounded-md text-[1rem] font-semibold text-bg-deep bg-gradient-to-br from-gold to-gold-bright
                hover:shadow-[0_0_30px_rgba(201,162,39,0.2),0_4px_12px_rgba(201,162,39,0.3)] hover:-translate-y-0.5
                transition-all cursor-pointer"
            >
              Sign In to Continue
            </button>
          </div>
        </main>
      ) : (
        <ScoutProvider>
          <ScoutView />
        </ScoutProvider>
      )}

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setAuthOpen(false)}
      />
    </div>
  );
}
