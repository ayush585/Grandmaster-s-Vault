'use client';

import { useState } from 'react';
import type { User } from 'firebase/auth';

interface HeaderProps {
  currentView: 'analysis' | 'library';
  onViewChange: (view: 'analysis' | 'library') => void;
  onUploadClick: () => void;
  user: User | null;
  onSignInClick: () => void;
  onSignOut: () => void;
}

export default function Header({ currentView, onViewChange, onUploadClick, user, onSignInClick, onSignOut }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="h-[60px] flex items-center justify-between px-7 bg-bg-primary border-b border-border sticky top-0 z-50 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="text-[28px] text-gold" style={{ animation: 'shimmer 4s ease-in-out infinite' }}>
          ♛
        </span>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[1.35rem] font-semibold text-text-primary tracking-wide leading-tight">
            Grandmaster&apos;s Vault
          </h1>
          <span className="text-[0.65rem] text-text-tertiary tracking-[0.15em] uppercase font-medium">
            Chess Game Review & Analysis
          </span>
        </div>
      </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          {/* Desktop navigation */}
          <nav className="hidden sm:flex gap-1">
            <button
              onClick={() => onViewChange('analysis')}
              aria-current={currentView === 'analysis' ? 'page' : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-[0.85rem] font-medium transition-all cursor-pointer
                ${currentView === 'analysis'
                  ? 'bg-bg-tertiary text-gold'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Analysis Board
            </button>

            <button
              onClick={() => onViewChange('library')}
              aria-current={currentView === 'library' ? 'page' : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-[0.85rem] font-medium transition-all cursor-pointer
                ${currentView === 'library'
                  ? 'bg-bg-tertiary text-gold'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 3h12M2 6h12M2 9h9M2 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Game Library
            </button>

            <button
              onClick={onUploadClick}
              disabled={!user}
              aria-disabled={!user}
              title={user ? 'Upload a game' : 'Sign in to upload games'}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-[0.85rem] font-semibold ml-2 transition-all cursor-pointer
                bg-gradient-to-br from-gold-dim to-gold text-bg-deep hover:from-gold hover:to-gold-bright hover:shadow-[0_0_20px_rgba(201,162,39,0.15)]
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v7M5 5.5L8 3l3 2.5M3 10v2a1 1 0 001 1h8a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Upload Game
            </button>
          </nav>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 text-text-secondary hover:text-gold"
            aria-label="Toggle navigation"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden absolute top-full left-0 w-full bg-bg-primary border-b border-border p-2 flex flex-col gap-2">
            <button
              onClick={() => { onViewChange('analysis'); setMobileOpen(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-[0.85rem] font-medium transition-all cursor-pointer
                ${currentView === 'analysis'
                  ? 'bg-bg-tertiary text-gold'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Analysis Board
            </button>
            <button
              onClick={() => { onViewChange('library'); setMobileOpen(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-[0.85rem] font-medium transition-all cursor-pointer
                ${currentView === 'library'
                  ? 'bg-bg-tertiary text-gold'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 3h12M2 6h12M2 9h9M2 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Game Library
            </button>
            <button
              onClick={() => { onUploadClick(); setMobileOpen(false); }}
              disabled={!user}
              title={user ? 'Upload a game' : 'Sign in to upload games'}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-[0.85rem] font-semibold transition-all cursor-pointer
                bg-gradient-to-br from-gold-dim to-gold text-bg-deep hover:from-gold hover:to-gold-bright hover:shadow-[0_0_20px_rgba(201,162,39,0.15)]
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v7M5 5.5L8 3l3 2.5M3 10v2a1 1 0 001 1h8a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Upload Game
            </button>
          </div>
        )}

      {/* Auth Section */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-[0.8rem] text-text-secondary font-medium max-w-[140px] truncate">
              {user.displayName || user.email}
            </span>
            <button
              onClick={onSignOut}
              className="px-3 py-1.5 rounded-md border border-border text-[0.75rem] text-text-tertiary font-semibold
                hover:border-text-tertiary hover:text-text-primary transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </>
        ) : (
          <button
            onClick={onSignInClick}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md border border-border-accent text-[0.8rem] text-gold font-semibold
              hover:bg-[rgba(201,162,39,0.08)] transition-all cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 14c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
