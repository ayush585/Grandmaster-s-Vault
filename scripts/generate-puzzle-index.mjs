#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const DEFAULT_THEMES = [
  'fork',
  'pin',
  'endgame',
  'rookEndgame',
  'pawnEndgame',
  'bishopEndgame',
  'opening',
  'middlegame',
  'hangingPiece',
  'trappedPiece',
  'attackingF2F7',
  'deflection',
  'doubleCheck',
  'skewer',
  'xRayAttack',
  'backRankMate',
  'mateIn1',
  'mateIn2',
  'short',
  'oneMove',
];

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = next;
    i += 1;
  }
  return parsed;
}

function parseCsvLine(line) {
  const parts = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      const escaped = line[i + 1] === '"';
      if (escaped) {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      parts.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  parts.push(current);
  return parts;
}

function ensureFile(inputPath) {
  if (!inputPath) {
    throw new Error('Missing --input <path-to-lichess_db_puzzle.csv>');
  }
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }
}

function getThemes(value) {
  if (!value) return DEFAULT_THEMES;
  return value.split(',').map((t) => t.trim()).filter(Boolean);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = args.input;
  const output = args.output || path.join('src', 'data', 'puzzle-ids.json');
  const targetPerTheme = Number(args.target || 100);
  const themes = getThemes(args.themes);

  ensureFile(input);
  if (!Number.isFinite(targetPerTheme) || targetPerTheme <= 0) {
    throw new Error('--target must be a positive number');
  }

  const byTheme = Object.fromEntries(themes.map((t) => [t, []]));
  const seenByTheme = Object.fromEntries(themes.map((t) => [t, new Set()]));

  const stream = fs.createReadStream(input, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let lineNo = 0;
  for await (const line of rl) {
    lineNo += 1;
    if (!line || lineNo === 1) continue;

    const cols = parseCsvLine(line);
    if (cols.length < 8) continue;

    const puzzleId = (cols[0] || '').trim();
    if (!/^[A-Za-z0-9]{5}$/.test(puzzleId)) continue;

    const rowThemes = (cols[7] || '').trim().split(' ').map((t) => t.trim()).filter(Boolean);
    for (const rowTheme of rowThemes) {
      if (!Object.prototype.hasOwnProperty.call(byTheme, rowTheme)) continue;
      if (byTheme[rowTheme].length >= targetPerTheme) continue;
      if (seenByTheme[rowTheme].has(puzzleId)) continue;
      seenByTheme[rowTheme].add(puzzleId);
      byTheme[rowTheme].push(puzzleId);
    }

    const complete = themes.every((t) => byTheme[t].length >= targetPerTheme);
    if (complete) break;
  }

  const schema = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: path.basename(input),
    targetPerTheme,
    themes: byTheme,
  };

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(schema, null, 2)}\n`, 'utf8');

  const summary = Object.fromEntries(themes.map((t) => [t, byTheme[t].length]));
  const missing = themes.filter((t) => byTheme[t].length < targetPerTheme);
  console.log('Generated puzzle index at:', output);
  console.table(summary);

  if (missing.length > 0) {
    console.warn('Themes below target:', missing.join(', '));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[generate-puzzle-index] Failed:', error);
  process.exit(1);
});
