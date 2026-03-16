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
      // Apollo Client 3.x/4.x verwendet devtools.enabled
      // In @nhost/apollo (v9) wird dies intern als connectToDevTools weitergegeben, 
      // aber wir können auch das native Verhalten erzwingen falls nötig.
      connectToDevTools: true,
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
