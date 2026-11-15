/** The real handshake calls: Cron's functions (MIN-4484) and Realtime on `grants`. Every answer is parsed against contract.ts. */
import { ApiError } from '../../api/call';
import { authedCall } from '../../api/authed';
import { callFunction, supabase } from '../../api/client';
import { envState } from '../../lib/env';
import type { HandshakeApi } from './api';
import { GrantEnvelope, GrantStatusResponse, HandshakeCreateResponse } from './contract';

function need() {
  if (!supabase || !callFunction) throw new ApiError(0, 'Not configured.');
  return { supabase, callFunction };
}

export const realApi: HandshakeApi = {
  async create() {
    return authedCall((accessToken) => need().callFunction('handshake-create', {}, HandshakeCreateResponse, { accessToken }));
  },
  async claim(input) {
    return authedCall((accessToken) => need().callFunction('handshake-claim', input, GrantEnvelope, { accessToken }));
  },
  async status(grantId) {
    return authedCall((accessToken) => need().callFunction('grant-status', grantId ? { grant_id: grantId } : {}, GrantStatusResponse, { accessToken }));
  },
  async decide(grantId, approve) {
    return authedCall((accessToken) => need().callFunction('grant-decide', { grant_id: grantId, approve }, GrantEnvelope, { accessToken }));
  },
  async revoke(grantId) {
    return authedCall((accessToken) => need().callFunction('grant-revoke', { grant_id: grantId }, GrantEnvelope, { accessToken }));
  },
  subscribe(onSignal) {
    if (!supabase || envState.status !== 'ok') return () => {};
    // The row payload is not used: any change is a nudge to ask `grant-status`, which carries server_now and the party names.
    const channel = supabase
      .channel(`grants-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: envState.schema, table: 'grants' }, onSignal)
      .subscribe();
    return () => {
      void supabase?.removeChannel(channel);
    };
  },
};
