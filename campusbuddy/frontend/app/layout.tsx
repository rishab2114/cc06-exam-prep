import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CampusBuddy',
  description:
    'Interactive CampusBuddy demo for student-to-student campus tasks, services, chat, negotiation and ratings.',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-sunken text-text antialiased">{children}</body>
    </html>
  );
}
