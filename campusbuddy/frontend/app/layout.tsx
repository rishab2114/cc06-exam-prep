import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CampusBuddy',
  description:
    'Campus chores done by verified students at your university — laundry, parcels, meals, study help. Launching at NTU.',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-sunken text-text antialiased">{children}</body>
    </html>
  );
}
