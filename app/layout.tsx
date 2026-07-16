import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Botvalia Genesis | Autonomous AI Employee Engine',
  description: 'An advanced AI Employee Generator that scans business websites, extracts structured knowledge, maps interactive knowledge graphs, and spawns digital workers.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className="bg-slate-950 text-slate-100 antialiased font-sans min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}

