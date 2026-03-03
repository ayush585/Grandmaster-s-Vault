'use client';

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange } from '@/lib/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null });

  useEffect(() => {
    try {
      const unsub = onAuthChange((user) => {
        setState({ user, loading: false, error: null });
      });
      return () => { unsub?.(); };
    } catch (e) {
      setState({ user: null, loading: false, error: e instanceof Error ? e : new Error('Auth init failed') });
    }
  }, []);

  return state;
}
