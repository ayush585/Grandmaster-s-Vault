'use client';

import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
    setLoading(false);
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      reset();
      onSuccess();
    } catch (e) {
      setLoading(false);
      setError(friendlyError(e));
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password || !displayName.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, displayName.trim());
      reset();
      onSuccess();
    } catch (e) {
      setLoading(false);
      setError(friendlyError(e));
    }
  };

  const switchTab = (t: 'signin' | 'signup') => {
    setTab(t);
    setError('');
  };

  const inputClass = 'w-full px-3.5 py-2.5 bg-bg-tertiary border border-border rounded-md text-text-primary font-[family-name:var(--font-body)] text-[0.9rem] outline-none transition-colors focus:border-gold-dim';

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-bg-secondary border border-border rounded-2xl w-[90%] max-w-[440px] shadow-2xl modal-enter">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-border">
          <h2 className="font-[family-name:var(--font-display)] text-[1.4rem] font-bold text-text-primary">
            {tab === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary text-[1.5rem] hover:bg-bg-tertiary hover:text-text-primary transition-all cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => switchTab('signin')}
            className={`flex-1 py-3 text-[0.85rem] font-semibold transition-all cursor-pointer
              ${tab === 'signin'
                ? 'text-gold border-b-2 border-gold'
                : 'text-text-tertiary hover:text-text-secondary'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => switchTab('signup')}
            className={`flex-1 py-3 text-[0.85rem] font-semibold transition-all cursor-pointer
              ${tab === 'signup'
                ? 'text-gold border-b-2 border-gold'
                : 'text-text-tertiary hover:text-text-secondary'}`}
          >
            Sign Up
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          {tab === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-secondary">
                Display Name
              </label>
              <input
                className={inputClass}
                placeholder="e.g., Coach Smith"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-secondary">
              Email
            </label>
            <input
              type="email"
              className={inputClass}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-secondary">
              Password
            </label>
            <input
              type="password"
              className={inputClass}
              placeholder={tab === 'signup' ? 'At least 6 characters' : 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  tab === 'signin' ? handleSignIn() : handleSignUp();
                }
              }}
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-[rgba(224,85,85,0.1)] border border-[rgba(224,85,85,0.3)] rounded-md">
              <p className="text-[0.82rem] text-blunder">{error}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={tab === 'signin' ? handleSignIn : handleSignUp}
              disabled={loading}
              className="w-full px-6 py-2.5 rounded-md text-[0.85rem] font-semibold text-bg-deep bg-gradient-to-br from-gold to-gold-bright
                hover:shadow-[0_0_20px_rgba(201,162,39,0.15),0_2px_8px_rgba(201,162,39,0.3)] hover:-translate-y-px
                transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading
                ? (tab === 'signin' ? 'Signing in...' : 'Creating account...')
                : (tab === 'signin' ? 'Sign In' : 'Create Account')}
            </button>
          </div>

          <p className="text-center text-[0.8rem] text-text-tertiary">
            {tab === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button onClick={() => switchTab('signup')} className="text-gold hover:underline cursor-pointer">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => switchTab('signin')} className="text-gold hover:underline cursor-pointer">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function friendlyError(e: unknown): string {
  const code = (e as { code?: string })?.code;
  switch (code) {
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/user-disabled': return 'This account has been disabled.';
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/invalid-credential': return 'Invalid email or password.';
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
    default: return e instanceof Error ? e.message : 'An unexpected error occurred.';
  }
}
