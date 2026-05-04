import type { Metadata, Viewport } from 'next';
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
  applicationName: 'HomeTrack',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HomeTrack',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
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
