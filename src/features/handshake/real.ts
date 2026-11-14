/** The real handshake calls: Cron's functions (MIN-4484) and Realtime on `grants`. Every answer is parsed against contract.ts. */
import { ApiError } from '../../api/call';
import { callFunction, supabase } from '../../api/client';
import { envState } from '../../lib/env';
import type { HandshakeApi } from './api';
import { GrantEnvelope, GrantStatusResponse, HandshakeCreateResponse } from './contract';

function need() {
  if (!supabase || !callFunction) throw new ApiError(0, 'Not configured.');
  return { supabase, callFunction };
}

async function token(): Promise<string> {
  const { data } = await need().supabase.auth.getSession();
  if (!data.session) throw new ApiError(401, 'Not signed in.', 'unauthenticated');
  return data.session.access_token;
}

export const realApi: HandshakeApi = {
  async create() {
    return need().callFunction('handshake-create', {}, HandshakeCreateResponse, { accessToken: await token() });
  },
  async claim(input) {
    return need().callFunction('handshake-claim', input, GrantEnvelope, { accessToken: await token() });
  },
  async status(grantId) {
    return need().callFunction('grant-status', grantId ? { grant_id: grantId } : {}, GrantStatusResponse, { accessToken: await token() });
  },
  async decide(grantId, approve) {
    return need().callFunction('grant-decide', { grant_id: grantId, approve }, GrantEnvelope, { accessToken: await token() });
  },
  async revoke(grantId) {
    return need().callFunction('grant-revoke', { grant_id: grantId }, GrantEnvelope, { accessToken: await token() });
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
