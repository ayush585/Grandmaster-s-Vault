import './globals.css';
import Footer from '@/components/Footer';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Grandmaster’s Vault</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-bg-primary text-text-primary">
        {children}
        <Footer />
      </body>
    </html>
  );
}
