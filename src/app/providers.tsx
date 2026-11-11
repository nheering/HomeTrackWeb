'use client';

import React, { useMemo } from 'react';
import { NhostProvider as NhostReactProvider } from '@nhost/nextjs';
import { ApolloClient, ApolloProvider, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import nhost, { graphqlUrl } from '@/lib/nhost';
import { PlusActionProvider } from '@/lib/plus-action-context';
import { NavSettingsProvider } from '@/lib/nav-settings-context';
import { config, isNhostBackend, isPostgresBackend } from '@/lib/config';
import { createAuthProvider, AuthContext } from '@/lib/auth';

/**
 * Haupt-Provider-Komponente
 * 
 * Diese Komponente stellt die Authentifizierung und Apollo-Client
 * basierend auf der gewählten Backend-Konfiguration bereit.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Auth-Provider basierend auf Konfiguration erstellen
  const authProvider = useMemo(() => createAuthProvider(), []);

  // Apollo-Client nur für Nhost erstellen
  const apolloClient = useMemo(() => {
    if (isNhostBackend()) {
      const httpLink = createHttpLink({ uri: graphqlUrl });

      const authLink = setContext((_, { headers }) => {
        const token = nhost.auth.getAccessToken();
        return {
          headers: {
            ...headers,
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
        };
      });

      return new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache(),
        devtools: { enabled: process.env.NODE_ENV === 'development' },
      });
    }
    return null;
  }, []);

  // Für PostgreSQL-Backend wird kein Nhost-Provider benötigt
  if (isPostgresBackend()) {
    return (
      <AuthContext.Provider value={authProvider}>
        <NavSettingsProvider>
          <PlusActionProvider>
            {children}
          </PlusActionProvider>
        </NavSettingsProvider>
      </AuthContext.Provider>
    );
  }

  // Für Nhost-Backend (Standard)
  return (
    <NhostReactProvider nhost={nhost}>
      <AuthContext.Provider value={authProvider}>
        <ApolloProvider client={apolloClient!}>
          <NavSettingsProvider>
            <PlusActionProvider>
              {children}
            </PlusActionProvider>
          </NavSettingsProvider>
        </ApolloProvider>
      </AuthContext.Provider>
    </NhostReactProvider>
  );
}

// Altes Export für Kompatibilität
export const NhostProvider = Providers;

export default Providers;
