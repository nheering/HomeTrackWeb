'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="ht-card max-w-sm w-full text-center flex flex-col items-center gap-4 py-8">
        <div className="w-14 h-14 rounded-full bg-bg-hover flex items-center justify-center text-accent">
          <WifiOff size={28} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-tx-primary">Du bist offline</h1>
          <p className="text-sm text-tx-secondary mt-1">
            Diese Seite ist nicht im Cache verfügbar. Sobald du wieder online bist, kannst du
            HomeTrack normal weiterverwenden.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="ht-btn-primary"
        >
          <RefreshCw size={16} />
          Erneut versuchen
        </button>
      </div>
    </main>
  );
}
