'use client';

interface EvalBarProps {
  evaluation: number; // from white's perspective
  mate: number | null;
}

export default function EvalBar({ evaluation, mate }: EvalBarProps) {
  // Map eval to white percentage (50% at eval=0, 95% at +10, 5% at -10)
  const clampedEval = Math.max(-10, Math.min(10, evaluation));
  const whitePercent = mate !== null
    ? (mate > 0 ? 97 : 3)
    : 50 + (clampedEval / 10) * 45;

  const label = mate !== null
    ? `M${Math.abs(mate)}`
    : (evaluation >= 0 ? '+' : '') + evaluation.toFixed(1);

  return (
    <div className="w-7 flex-shrink-0 rounded-md overflow-hidden relative border border-border" style={{ height: 512 }}>
      {/* Black side (top) */}
      <div className="absolute inset-0 bg-[#333]" />
      {/* White side (bottom) */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-[height] duration-500"
        style={{
          height: `${whitePercent}%`,
          background: 'linear-gradient(to top, #f5f0e8, #e8e0d0)',
        }}
      />
      {/* Label */}
      <div
        className="absolute top-1/2 left-1/2 z-10 font-[family-name:var(--font-mono)] text-[0.58rem] font-semibold text-text-primary tracking-wide"
        style={{
          transform: 'translate(-50%, -50%)',
          writingMode: 'vertical-lr',
          textOrientation: 'mixed',
          textShadow: '0 0 4px #0c0c10, 0 0 4px #0c0c10, 0 0 4px #0c0c10',
        }}
      >
        {label}
      </div>
    </div>
  );
}
