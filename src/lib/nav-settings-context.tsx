'use client';

import React, { createContext, useContext } from 'react';
import { useQuery } from '@apollo/client';
import { useAuthenticationStatus } from '@nhost/nextjs';
import { GET_USER_SETTINGS } from '@/lib/graphql/queries';

export type NavPosition = 'bottom' | 'left';

interface NavSettingsContextValue {
  navPosition: NavPosition;
}

const NavSettingsContext = createContext<NavSettingsContextValue>({ navPosition: 'bottom' });

export function NavSettingsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthenticationStatus();
  const { data } = useQuery(GET_USER_SETTINGS, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  const navPosition: NavPosition = (data?.user_settings?.[0]?.nav_position as NavPosition) ?? 'bottom';

  return (
    <NavSettingsContext.Provider value={{ navPosition }}>
      {children}
    </NavSettingsContext.Provider>
  );
}

export function useNavSettings() {
  return useContext(NavSettingsContext);
}
