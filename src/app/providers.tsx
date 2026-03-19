'use client';

import React, { useMemo } from 'react';
import { NhostProvider as NhostReactProvider } from '@nhost/nextjs';
import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from '@nhost/apollo';
import nhost, { graphqlUrl } from '@/lib/nhost';

export function NhostProvider({ children }: { children: React.ReactNode }) {
  const apolloClient = useMemo(() => {
    return createApolloClient({
      nhost,
      graphqlUrl,
      devtools: {
        enabled: true,
      },
    });
  }, []);

  return (
    <NhostReactProvider nhost={nhost}>
      <ApolloProvider client={apolloClient}>
        {children}
      </ApolloProvider>
    </NhostReactProvider>
  );
}
