import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError } from '../api/call';
import { callFunction, supabase } from '../api/client';
import { DemoLoginResponse, Profile, type Role } from '../api/contract';
import type { AuthState } from './guard';

interface Auth {
  state: AuthState;
  displayName: string | null;
  /** Throws ApiError (HTTP status in `.status`) when the passcode or the server refuses. */
  signInDemo(persona: Role, passcode: string): Promise<Role>;
  signOut(): Promise<void>;
}

const Ctx = createContext<Auth | null>(null);

async function readProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('id, role, display_name').maybeSingle();
  if (error || !data) return null;
  const p = Profile.safeParse(data);
  return p.success ? p.data : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setState({ status: 'out' });
      return;
    }
    let live = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!live) return;
      if (!data.session) return setState({ status: 'out' });
      const p = await readProfile();
      if (!live) return;
      if (!p) return setState({ status: 'out' }); // a session with no healthapp profile sees nothing
      setDisplayName(p.display_name ?? null);
      setState({ status: 'in', role: p.role });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setState({ status: 'out' });
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInDemo = useCallback(async (persona: Role, passcode: string): Promise<Role> => {
    if (!supabase || !callFunction) throw new ApiError(0, 'Not configured.');
    const res = await callFunction('demo-login', { persona, passcode }, DemoLoginResponse);
    const { error } = await supabase.auth.setSession(res.session);
    if (error) throw new ApiError(0, 'The session was not accepted.');
    const p = await readProfile();
    if (!p) {
      await supabase.auth.signOut();
      throw new ApiError(404, 'This account has no profile in this environment.');
    }
    setDisplayName(p.display_name ?? null);
    setState({ status: 'in', role: p.role });
    return p.role;
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setDisplayName(null);
    setState({ status: 'out' });
  }, []);

  const value = useMemo(() => ({ state, displayName, signInDemo, signOut }), [state, displayName, signInDemo, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): Auth {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
