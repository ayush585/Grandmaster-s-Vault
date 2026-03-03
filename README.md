# Grandmaster's Vault

A chess game review platform with interactive board replay, Stockfish engine analysis, and cloud storage.

## Features

- **Score Sheet Upload** — Paste moves in any format (PGN, numbered algebraic, plain moves) or upload `.pgn` files. Player names, tournament, time control, and result are auto-extracted from PGN headers.
- **Interactive Chessboard** — Replay games move by move with keyboard navigation (arrow keys, Home/End). Flip the board, see last-move highlighting.
- **Stockfish Engine Analysis** — Browser-side Stockfish (WASM) analyzes every position. Provides evaluation after each move, best move suggestions, and move classification (best, good, inaccuracy, mistake, blunder).
- **Evaluation Graph** — Visual chart of evaluation over the entire game. Click any point to jump to that move.
- **Analysis Report** — Accuracy percentages for both players, classification breakdown, and key moments (blunders/mistakes with suggested improvements).
- **Game Library** — All games are saved locally (IndexedDB) with optional Firebase cloud sync. Search by player name, opponent, tournament, or date.

## Tech Stack

- **Next.js 16** (React 19, TypeScript, App Router)
- **Tailwind CSS v4**
- **chess.js** — Move validation and PGN parsing
- **react-chessboard** — Board rendering
- **Stockfish.js** — Engine analysis via Web Worker
- **Recharts** — Evaluation graph
- **Firebase Firestore** — Optional cloud storage
- **IndexedDB** — Local storage (works offline, no setup needed)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Enabling Cloud Storage (Firebase)

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Add a web app and copy the config
3. Create a Firestore database
4. Fill in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

5. Restart the dev server. The badge in the header will switch from "Local" to "Cloud".

Without Firebase credentials, the app works fully offline using IndexedDB.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Main page
│   └── globals.css           # Theme & styles
├── components/
│   ├── Header.tsx            # Navigation
│   ├── ChessBoardView.tsx    # Board + eval bar + controls
│   ├── MoveList.tsx          # Move list with classifications
│   ├── EnginePanel.tsx       # Engine evaluation display
│   ├── EvalChart.tsx         # Evaluation graph
│   ├── AnalysisReport.tsx    # Accuracy & breakdown
│   ├── UploadModal.tsx       # Game upload form
│   ├── GameLibrary.tsx       # Saved games browser
│   └── Toast.tsx             # Notifications
├── lib/
│   ├── firebase.ts           # Firebase initialization
│   ├── storage.ts            # Firestore + IndexedDB
│   ├── engine.ts             # Stockfish Web Worker
│   └── pgn-parser.ts         # Multi-format move parser
└── types/
    └── index.ts              # TypeScript types
```
