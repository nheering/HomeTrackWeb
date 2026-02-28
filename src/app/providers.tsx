'use client';

import { NhostProvider as NhostReactProvider } from '@nhost/nextjs';
import { NhostApolloProvider } from '@nhost/react-apollo';
import nhost from '@/lib/nhost';

export function NhostProvider({ children }: { children: React.ReactNode }) {
  return (
    <NhostReactProvider nhost={nhost}>
      <NhostApolloProvider nhost={nhost}>
        {children}
      </NhostApolloProvider>
    </NhostReactProvider>
  );
}
