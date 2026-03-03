'use client';

interface AnalysisProgressModalProps {
  isOpen: boolean;
  progress: number; // 0-100
  statusText: string;
  errorText?: string;
  onCancel: () => void;
  onRetry?: () => void;
}

export default function AnalysisProgressModal({ isOpen, progress, statusText, errorText, onCancel, onRetry }: AnalysisProgressModalProps) {
  if (!isOpen) return null;

  const hasError = !!errorText;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className="bg-bg-secondary border border-border rounded-2xl w-[90%] max-w-[400px] shadow-2xl modal-enter">
        <div className="p-8 text-center">
          {hasError ? (
            <>
              <div className="text-[2rem] mb-4">⚠</div>
              <h3 className="font-[family-name:var(--font-display)] text-[1.2rem] font-semibold text-text-primary mb-3">
                Analysis Error
              </h3>
              <p className="font-[family-name:var(--font-mono)] text-[0.78rem] text-blunder mb-5">
                {errorText}
              </p>
              <div className="flex gap-2 justify-center">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-6 py-2.5 rounded-md text-[0.85rem] font-semibold text-bg-deep bg-gradient-to-br from-gold to-gold-bright
                      hover:shadow-[0_0_20px_rgba(201,162,39,0.15),0_2px_8px_rgba(201,162,39,0.3)]
                      transition-all cursor-pointer"
                  >
                    Retry
                  </button>
                )}
                <button
                  onClick={onCancel}
                  className="px-6 py-2.5 border border-border rounded-md text-text-secondary text-[0.85rem] font-semibold hover:border-text-tertiary hover:text-text-primary transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2.5 mb-6">
                <svg
                  width="24" height="24" viewBox="0 0 16 16" fill="none"
                  className="text-gold" style={{ animation: 'spin 2s linear infinite' }}
                >
                  <path
                    d="M8 1v4M8 11v4M1 8h4M11 8h4M3.05 3.05l2.83 2.83M10.12 10.12l2.83 2.83M3.05 12.95l2.83-2.83M10.12 5.88l2.83-2.83"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  />
                </svg>
                <h3 className="font-[family-name:var(--font-display)] text-[1.2rem] font-semibold text-text-primary">
                  Analyzing Game
                </h3>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #8a7020, #c9a227)',
                  }}
                />
              </div>

              <p className="font-[family-name:var(--font-mono)] text-[0.78rem] text-text-tertiary mb-5">
                {statusText}
              </p>

              <button
                onClick={onCancel}
                className="px-6 py-2.5 border border-border rounded-md text-text-secondary text-[0.85rem] font-semibold hover:border-text-tertiary hover:text-text-primary transition-all cursor-pointer"
              >
                Cancel Analysis
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
