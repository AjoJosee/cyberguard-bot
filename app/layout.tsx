import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CyberGuard AI | Cybersecurity Safety & Incident Assistant',
  description: 'AI-assisted and rule-based cybersecurity advisor for everyday users. Get immediate guidance on scams, compromised accounts, phishing, malware, passwords, and safe online habits.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
