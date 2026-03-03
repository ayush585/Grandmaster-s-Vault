import type { MoveAnalysis, GameData } from '@/types';

function classificationToNAG(classification?: string): string {
  switch (classification) {
    case 'brilliant': return '$3';
    case 'great': return '$1';
    case 'best': return '$1';
    case 'good': return '$2';
    case 'inaccuracy': return '$6';
    case 'mistake': return '$4';
    case 'blunder': return '$4';
    default: return '';
  }
}

function formatEval(m: MoveAnalysis): string {
  if (m.mate !== null) {
    return `#${m.mate}`;
  }
  const sign = m.eval >= 0 ? '+' : '';
  return `${sign}${m.eval.toFixed(2)}`;
}

export function generateAnnotatedPGN(game: GameData): string {
  const lines: string[] = [];

  // PGN headers
  lines.push(`[Event "${game.tournament || '?'}"]`);
  lines.push(`[Site "?"]`);
  lines.push(`[Date "${game.date ? game.date.replace(/-/g, '.') : '????.??.??'}"]`);
  lines.push(`[Round "?"]`);
  lines.push(`[White "${game.whiteName || '?'}"]`);
  lines.push(`[Black "${game.blackName || '?'}"]`);
  lines.push(`[Result "${game.result || '*'}"]`);
  if (game.timeControl) {
    lines.push(`[TimeControl "${game.timeControl}"]`);
  }
  if (game.whiteAccuracy !== undefined) {
    lines.push(`[WhiteAccuracy "${game.whiteAccuracy}"]`);
  }
  if (game.blackAccuracy !== undefined) {
    lines.push(`[BlackAccuracy "${game.blackAccuracy}"]`);
  }
  lines.push(`[Annotator "Grandmaster's Vault / Stockfish"]`);
  lines.push('');

  // Build move text
  const moves = game.moves || [];
  const analysis = game.analysis || [];
  const parts: string[] = [];

  for (let i = 0; i < moves.length; i++) {
    const moveNum = Math.floor(i / 2) + 1;
    const isWhite = i % 2 === 0;

    // Move number
    if (isWhite) {
      parts.push(`${moveNum}.`);
    } else if (i === 0) {
      parts.push(`${moveNum}...`);
    }

    // The move itself
    let movePart = moves[i];

    // Add NAG if we have analysis
    const moveAnalysis = analysis[i];
    if (moveAnalysis) {
      const nag = classificationToNAG(moveAnalysis.classification);
      if (nag) {
        movePart += ` ${nag}`;
      }

      // Add eval comment
      const evalComment = `{${formatEval(moveAnalysis)}/${moveAnalysis.depth}}`;
      movePart += ` ${evalComment}`;

      // Add best move comment for mistakes/blunders
      if (
        moveAnalysis.bestMoveSan &&
        moveAnalysis.bestMoveSan !== moves[i] &&
        (moveAnalysis.classification === 'mistake' ||
          moveAnalysis.classification === 'blunder' ||
          moveAnalysis.classification === 'inaccuracy')
      ) {
        movePart += ` {Best: ${moveAnalysis.bestMoveSan}}`;
      }
    }

    parts.push(movePart);
  }

  // Add result
  parts.push(game.result || '*');

  // Word-wrap at ~80 chars
  let currentLine = '';
  for (const part of parts) {
    if (currentLine.length + part.length + 1 > 80 && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = part;
    } else {
      currentLine = currentLine ? `${currentLine} ${part}` : part;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.join('\n') + '\n';
}

function sanitizeFilename(str: string): string {
  return str
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 100);
}

export function downloadPGN(game: GameData): void {
  const pgn = generateAnnotatedPGN(game);
  const blob = new Blob([pgn], { type: 'application/x-chess-pgn' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  const white = sanitizeFilename(game.whiteName || 'White');
  const black = sanitizeFilename(game.blackName || 'Black');
  const dateStr = (game.date || 'undated').replace(/-/g, '');
  a.download = `${white}_vs_${black}_${dateStr}.pgn`;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
