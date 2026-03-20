'use client';

import React, { useMemo } from 'react';
import { NhostProvider as NhostReactProvider } from '@nhost/nextjs';
import { ApolloClient, ApolloProvider, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import nhost, { graphqlUrl } from '@/lib/nhost';

export function NhostProvider({ children }: { children: React.ReactNode }) {
  const apolloClient = useMemo(() => {
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
  }, []);

  return (
    <NhostReactProvider nhost={nhost}>
      <ApolloProvider client={apolloClient}>
        {children}
      </ApolloProvider>
    </NhostReactProvider>
  );
}
