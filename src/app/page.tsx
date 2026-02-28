'use client';

import { useQuery } from '@apollo/client';
import { useAuthenticationStatus } from '@nhost/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { subMonths, startOfYear, format } from 'date-fns';
import { Loader2, RefreshCw } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import VerbrauchsKachel from '@/components/home/VerbrauchsKachel';
import { GET_DASHBOARD_DATA, GET_VERBRAUCHSWERTE_STATS } from '@/lib/graphql/queries';

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthenticationStatus();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_DATA, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  const verbrauchstypen = data?.verbrauchstyp ?? [];

  return (
    <div className="min-h-screen bg-bg-base bg-grid pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg-base/90 backdrop-blur-xl border-b border-bg-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-tx-primary tracking-tight">
              <span className="text-accent">Home</span>Track
            </h1>
            <p className="text-xs text-tx-muted">Verbrauchsübersicht</p>
          </div>
          <button
            onClick={() => refetch()}
            className="ht-btn-ghost"
            title="Aktualisieren"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6">
        {error && (
          <div className="ht-card border-red-500/30 bg-red-500/5 mb-6">
            <p className="text-red-400 text-sm">Fehler beim Laden: {error.message}</p>
          </div>
        )}

        {verbrauchstypen.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {verbrauchstypen.map((typ: any) => {
              const standardStelle = typ.verbrauchsstellen?.[0];
              const letzterWert = standardStelle?.verbrauchswerte?.[0];

              return (
                <VerbrauchsKachel
                  key={typ.id}
                  verbrauchstyp={typ}
                  letzterWert={letzterWert}
                  onClick={() => {/* TODO: Detail-Ansicht */}}
                />
              );
            })}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
        <span className="text-3xl">⚡</span>
      </div>
      <h2 className="text-lg font-semibold text-tx-primary mb-2">Noch keine Verbrauchstypen</h2>
      <p className="text-sm text-tx-secondary max-w-xs mb-6">
        Tippe auf das <span className="text-accent font-medium">+</span> unten in der Mitte um deinen ersten Verbrauchstyp anzulegen.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        {['⚡ Strom', '🔥 Gas', '💧 Wasser'].map(label => (
          <span key={label} className="ht-badge bg-bg-card border border-bg-border text-tx-secondary text-xs px-3 py-1.5">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
