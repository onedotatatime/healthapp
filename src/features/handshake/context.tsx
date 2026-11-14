import { createContext, useContext } from 'react';
import type { HandshakeApi } from './api';
import { realApi } from './real';
import type { GrantView } from './contract';

/** `home` is where "Back" goes. Tests provide the in-memory api from mock.ts; the app never does. */
export interface HandshakeCtx {
  api: HandshakeApi;
  home: string;
}
export const HandshakeContext = createContext<HandshakeCtx>({ api: realApi, home: '/' });
export const useHandshake = () => useContext(HandshakeContext);

/**
 * Given to whatever the doctor workspace shows once access is live (MIN-4488 builds the overview and the ask box
 * inside `DoctorWorkspace`). `onEmptyRead`: call it when a read under RLS comes back empty after data was shown.
 */
export interface ActiveGrant {
  grant: GrantView;
  onEmptyRead(): void;
}
export const ActiveGrantContext = createContext<ActiveGrant | null>(null);
export const useActiveGrant = () => useContext(ActiveGrantContext);
