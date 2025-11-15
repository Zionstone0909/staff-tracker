// app/layout.tsx
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import ClientWrapper from '@/components/ClientWrapper';
import './globals.css';

const geist = Geist({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Staff Salary & Expense Tracker',
  description:
    'Complete business management system for staff salaries, expenses, inventory, and sales',
  generator: 'v0.app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        {children}

        {/* Client-only dynamic UI */}
        <ClientWrapper />

        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
