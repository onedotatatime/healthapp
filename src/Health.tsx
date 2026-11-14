import { useEffect, useState } from 'react';
import { commitSha, envState } from './lib/env';

type Hello = { state: 'checking' } | { state: 'ok'; status: number } | { state: 'error'; message: string };

export function Health() {
  const [hello, setHello] = useState<Hello>({ state: 'checking' });

  useEffect(() => {
    if (envState.status !== 'ok') return;
    const { supabaseUrl, anonKey, env } = envState;
    const ctl = new AbortController();
    fetch(`${supabaseUrl}/functions/v1/healthapp-hello`, {
      method: 'POST',
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'x-healthapp-env': env },
      signal: ctl.signal,
    })
      .then((res) =>
        setHello(res.ok ? { state: 'ok', status: res.status } : { state: 'error', message: `hello returned HTTP ${res.status}` }),
      )
      .catch((e: unknown) => {
        if (!ctl.signal.aborted) setHello({ state: 'error', message: e instanceof Error ? e.message : 'request failed' });
      });
    return () => ctl.abort();
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.25rem' }}>healthapp health check</h1>
      {envState.status === 'error' ? (
        <p role="alert" data-testid="env-error" style={{ color: '#b91c1c' }}>
          {envState.message}
        </p>
      ) : (
        <dl>
          <dt>Environment</dt>
          <dd data-testid="env">{envState.env}</dd>
          <dt>Schema</dt>
          <dd data-testid="schema">{envState.schema}</dd>
        </dl>
      )}
      <dl>
        <dt>Commit</dt>
        <dd data-testid="sha">{commitSha}</dd>
        <dt>Backend hello</dt>
        <dd data-testid="hello" role="status">
          {envState.status !== 'ok' && 'Not checked'}
          {envState.status === 'ok' && hello.state === 'checking' && 'Checking'}
          {hello.state === 'ok' && `OK (HTTP ${hello.status})`}
          {hello.state === 'error' && `Error: ${hello.message}`}
        </dd>
      </dl>
    </main>
  );
}
