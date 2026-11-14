import { createContext, useContext } from 'react';
import type { HandshakeApi } from './api';
import { realApi } from './real';
import type { GrantView } from './contract';

/** `home` is where "Back" goes; `preview` turns on the simulated scan button (no camera in the preview page). */
export interface HandshakeCtx {
  api: HandshakeApi;
  home: string;
  preview: boolean;
}
export const HandshakeContext = createContext<HandshakeCtx>({ api: realApi, home: '/', preview: false });
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
