'use client';

import { useState, useRef } from 'react';

export interface UploadData {
  whiteName: string;
  blackName: string;
  tournament: string;
  timeControl: string;
  date: string;
  result: string;
  movesText: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UploadData) => void;
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export default function UploadModal({ isOpen, onClose, onSubmit }: UploadModalProps) {
  const [whiteName, setWhiteName] = useState('');
  const [blackName, setBlackName] = useState('');
  const [tournament, setTournament] = useState('');
  const [timeControl, setTimeControl] = useState('');
  const [date, setDate] = useState('');
  const [result, setResult] = useState('');
  const [movesText, setMovesText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const hasInput = whiteName || blackName || tournament || timeControl || date || result || movesText;

  const handleClose = () => {
    if (isDirty && hasInput) {
      if (!confirm('Discard unsaved changes?')) return;
    }
    reset();
    onClose();
  };

  const reset = () => {
    setWhiteName('');
    setBlackName('');
    setTournament('');
    setTimeControl('');
    setDate('');
    setResult('');
    setMovesText('');
    setFileName('');
    setFileError('');
    setValidationError('');
    setIsDirty(false);
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File too large (${(file.size / 1024).toFixed(0)}KB). Maximum size is 1MB.`);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setFileName(file.name);
    setIsDirty(true);
    const reader = new FileReader();

    reader.onerror = () => {
      setFileError('Failed to read file. Please try again or paste the moves manually.');
      setFileName('');
    };

    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (!content || content.trim().length === 0) {
        setFileError('File is empty.');
        return;
      }

      setMovesText(content);

      // Try to extract PGN headers
      const headers: Record<string, string> = {};
      const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
      let match;
      while ((match = headerRegex.exec(content)) !== null) {
        headers[match[1]] = match[2];
      }
      if (headers['White'] && !whiteName) setWhiteName(headers['White']);
      if (headers['Black'] && !blackName) setBlackName(headers['Black']);
      if (headers['Event'] && !tournament) setTournament(headers['Event']);
      if (headers['TimeControl'] && !timeControl) setTimeControl(headers['TimeControl']);
      if (headers['Date'] && !date) {
        const d = headers['Date'].replace(/\./g, '-');
        setDate(d);
      }
      if (headers['Result'] && !result) setResult(headers['Result']);
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    setValidationError('');

    // Require at least one player name
    if (!whiteName.trim() && !blackName.trim()) {
      setValidationError('Please enter at least one player name.');
      return;
    }

    if (!movesText.trim()) {
      setValidationError('Please enter or upload moves.');
      return;
    }

    onSubmit({ whiteName, blackName, tournament, timeControl, date, result, movesText });
    reset();
  };

  const inputClass = 'w-full px-3.5 py-2.5 bg-bg-tertiary border border-border rounded-md text-text-primary font-[family-name:var(--font-body)] text-[0.9rem] outline-none transition-colors focus:border-gold-dim';

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-bg-secondary border border-border rounded-2xl w-[90%] max-w-[620px] max-h-[90vh] overflow-y-auto shadow-2xl modal-enter">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-border">
          <h2 className="font-[family-name:var(--font-display)] text-[1.4rem] font-bold text-text-primary">
            Upload Score Sheet
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary text-[1.5rem] hover:bg-bg-tertiary hover:text-text-primary transition-all cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-secondary">White Player *</label>
              <input className={inputClass} placeholder="e.g., Magnus Carlsen" value={whiteName} onChange={(e) => { setWhiteName(e.target.value); setIsDirty(true); }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-secondary">Black Player *</label>
              <input className={inputClass} placeholder="e.g., Hikaru Nakamura" value={blackName} onChange={(e) => { setBlackName(e.target.value); setIsDirty(true); }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-secondary">Tournament</label>
              <input className={inputClass} placeholder="e.g., World Championship 2024" value={tournament} onChange={(e) => { setTournament(e.target.value); setIsDirty(true); }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-secondary">Time Control / Format</label>
              <input className={inputClass} placeholder="e.g., 90+30, Classical" value={timeControl} onChange={(e) => { setTimeControl(e.target.value); setIsDirty(true); }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-secondary">Date</label>
              <input type="date" className={inputClass} value={date} onChange={(e) => { setDate(e.target.value); setIsDirty(true); }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-secondary">Result</label>
              <select
                className={`${inputClass} cursor-pointer appearance-none bg-no-repeat`}
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239994a8' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundPosition: 'right 12px center' }}
                value={result}
                onChange={(e) => { setResult(e.target.value); setIsDirty(true); }}
              >
                <option value="">Select result</option>
                <option value="1-0">White wins (1-0)</option>
                <option value="0-1">Black wins (0-1)</option>
                <option value="1/2-1/2">Draw (1/2-1/2)</option>
                <option value="*">Ongoing / Unknown</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-secondary">Moves / PGN</label>
            <textarea
              className={`${inputClass} font-[family-name:var(--font-mono)] text-[0.82rem] leading-relaxed resize-y`}
              rows={8}
              placeholder={`Paste your moves or complete PGN here...\n\nExamples:\n  1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 ...\n  e4 e5 Nf3 Nc6 Bb5 a6 ...\n  Full PGN with headers is also supported`}
              value={movesText}
              onChange={(e) => { setMovesText(e.target.value); setIsDirty(true); }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-secondary">Or upload a PGN file</label>
            <label
              className="flex items-center gap-2.5 px-4 py-3.5 bg-bg-tertiary border-2 border-dashed border-border rounded-md cursor-pointer text-text-tertiary text-[0.85rem] transition-all hover:border-gold-dim hover:text-text-secondary"
              htmlFor="pgn-file-upload"
            >
              <input
                ref={fileRef}
                id="pgn-file-upload"
                type="file"
                accept=".pgn,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v7M5 5.5L8 3l3 2.5M3 10v2a1 1 0 001 1h8a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{fileName || 'Choose .pgn or .txt file (max 1MB)'}</span>
            </label>
            {fileError && (
              <p className="text-[0.78rem] text-blunder">{fileError}</p>
            )}
          </div>

          {/* Validation error */}
          {validationError && (
            <div className="px-3 py-2 bg-[rgba(224,85,85,0.1)] border border-[rgba(224,85,85,0.3)] rounded-md">
              <p className="text-[0.82rem] text-blunder">{validationError}</p>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 border border-border rounded-md text-text-secondary text-[0.85rem] font-semibold hover:border-text-tertiary hover:text-text-primary transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!movesText.trim()}
              className="px-6 py-2.5 rounded-md text-[0.85rem] font-semibold text-bg-deep bg-gradient-to-br from-gold to-gold-bright
                hover:shadow-[0_0_20px_rgba(201,162,39,0.15),0_2px_8px_rgba(201,162,39,0.3)] hover:-translate-y-px
                transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Load Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
