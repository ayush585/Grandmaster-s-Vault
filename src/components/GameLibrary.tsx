'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllGames, searchGames, deleteGame } from '@/lib/storage';
import type { GameData } from '@/types';

interface GameLibraryProps {
  onLoadGame: (game: GameData) => void;
  refreshTrigger: number;
  userId?: string;
}

export default function GameLibrary({ onLoadGame, refreshTrigger, userId }: GameLibraryProps) {
  const [games, setGames] = useState<GameData[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingGameId, setLoadingGameId] = useState<string | null>(null);

  const handleLoadGame = useCallback(async (game: GameData) => {
    setLoadingGameId(game.id);
    try {
      await onLoadGame(game);
    } finally {
      setLoadingGameId(null);
    }
  }, [onLoadGame]);

  const loadGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = query.trim() ? await searchGames(query, userId) : await getAllGames(userId);
      setGames(results);
    } catch (e) {
      console.error('Failed to load games:', e);
      setError('Failed to load games. Please try again.');
    }
    setLoading(false);
  }, [query, userId]);

  useEffect(() => {
    loadGames();
  }, [loadGames, refreshTrigger]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this game? This cannot be undone.')) return;
    try {
      await deleteGame(id, userId);
      loadGames();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="flex-1 p-7 bg-bg-deep">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[1.8rem] font-bold text-text-primary">
            Game Library
          </h2>
          <span className="text-[0.8rem] text-text-tertiary font-medium">
            {games.length} game{games.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="relative w-[360px]">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            width="16" height="16" viewBox="0 0 16 16" fill="none"
          >
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="w-full py-2.5 px-4 pl-10 bg-bg-secondary border border-border rounded-lg text-text-primary font-[family-name:var(--font-body)] text-[0.85rem] outline-none transition-colors focus:border-border-accent placeholder:text-text-muted"
            placeholder="Search by player, tournament, or date..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Game Grid */}
      {loading ? (
        <div className="text-center py-16 text-text-tertiary">Loading games...</div>
      ) : error ? (
        <div className="text-center py-16">
          <span className="text-[2rem] opacity-40 block mb-3">⚠</span>
          <p className="text-[1rem] text-blunder mb-3">{error}</p>
          <button
            onClick={loadGames}
            className="px-5 py-2 border border-border rounded-md text-text-secondary text-[0.85rem] font-semibold hover:border-text-tertiary hover:text-text-primary transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-[3rem] opacity-20 block mb-3">♔</span>
          <p className="text-[1.1rem] text-text-tertiary mb-1">
            {query ? 'No games match your search' : 'No games saved yet'}
          </p>
          <span className="text-[0.8rem] text-text-muted">
            {query ? 'Try a different search term' : 'Upload your first game to build your library'}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => handleLoadGame(game)}
              className={`group bg-bg-primary border border-border rounded-lg p-4 cursor-pointer transition-all relative overflow-hidden
                hover:border-border-accent hover:shadow-[0_0_20px_rgba(201,162,39,0.1)] hover:-translate-y-0.5
                ${loadingGameId === game.id ? 'opacity-60 pointer-events-none' : ''}`}
            >
              {/* Gold top bar on hover */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold-dim via-gold to-gold-dim opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Loading overlay */}
              {loadingGameId === game.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/50">
                  <svg className="animate-spin text-gold" width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1v4M8 11v4M1 8h4M11 8h4M3.05 3.05l2.83 2.83M10.12 10.12l2.83 2.83M3.05 12.95l2.83-2.83M10.12 5.88l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}

              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="font-[family-name:var(--font-display)] text-[1.05rem] font-semibold text-text-primary leading-tight">
                  {game.whiteName || 'White'} <span className="text-text-muted font-normal italic">vs</span> {game.blackName || 'Black'}
                </div>
                {game.result && (
                  <span className="font-[family-name:var(--font-mono)] text-[0.8rem] font-bold text-gold px-2 py-0.5 rounded bg-[rgba(201,162,39,0.1)] whitespace-nowrap">
                    {game.result}
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="flex gap-4 text-[0.75rem] text-text-tertiary">
                {game.tournament && <span>{game.tournament}</span>}
                {game.timeControl && <span>{game.timeControl}</span>}
                {game.date && <span>{game.date}</span>}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-border">
                <span className="font-[family-name:var(--font-mono)] text-[0.72rem] text-text-muted">
                  {game.moves?.length || 0} moves
                  {game.analysis && ' · Analyzed'}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLoadGame(game); }}
                    className="px-2.5 py-1 border border-border bg-transparent text-text-secondary text-[0.72rem] font-medium rounded cursor-pointer transition-all hover:border-border-accent hover:text-gold"
                  >
                    Open
                  </button>
                  <button
                    onClick={(e) => handleDelete(game.id, e)}
                    className="px-2.5 py-1 border border-border bg-transparent text-text-secondary text-[0.72rem] font-medium rounded cursor-pointer transition-all hover:border-blunder hover:text-blunder"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
