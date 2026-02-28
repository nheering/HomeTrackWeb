import type { Metadata } from 'next';
import { Outfit, DM_Mono } from 'next/font/google';
import './globals.css';
import { NhostProvider } from './providers';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HomeTrack – Verbrauchsüberwachung',
  description: 'Erfasse und analysiere deine Haushaltsverbräuche: Strom, Gas, Wasser und mehr.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${outfit.variable} ${dmMono.variable}`}>
      <body className="bg-bg-base text-tx-primary font-sans antialiased">
        <NhostProvider>{children}</NhostProvider>
      </body>
    </html>
  );
}
