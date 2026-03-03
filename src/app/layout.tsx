import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Grandmaster's Vault — Chess Game Review & Analysis",
  description: 'Upload chess score sheets, replay games move by move, and analyze with Stockfish engine. Cloud storage for your game library.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="grain-overlay" />
        {children}
      </body>
    </html>
  );
}
