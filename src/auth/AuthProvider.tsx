import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError } from '../api/call';
import { callFunction, supabase } from '../api/client';
import { DemoLoginResponse, Profile, type DemoPersona, type Role } from '../api/contract';
import type { AuthState } from './guard';

interface Auth {
  state: AuthState;
  displayName: string | null;
  /** Throws ApiError (HTTP status in `.status`) when the passcode or the server refuses. */
  signInDemo(persona: DemoPersona, passcode: string): Promise<Role>;
  /** Signs out this device only. */
  signOut(): Promise<void>;
  /** True when the session ended and this device did not ask for it (MIN-4648): Login says so. */
  sessionEnded: boolean;
}

const Ctx = createContext<Auth | null>(null);

async function readProfile(uid: string): Promise<Profile | null> {
  if (!supabase) return null;
  // Own row only: a doctor with an active grant can also read the patient's profile under RLS.
  const { data, error } = await supabase.from('profiles').select('id, role, full_name').eq('id', uid).maybeSingle();
  if (error || !data) return null;
  const p = Profile.safeParse(data);
  return p.success ? p.data : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  /** True while this device itself is signing out, so its own SIGNED_OUT is not reported as an ended session. */
  const selfSignOut = useRef(false);

  useEffect(() => {
    if (!supabase) {
      setState({ status: 'out' });
      return;
    }
    let live = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!live) return;
      if (!data.session) return setState({ status: 'out' });
      const p = await readProfile(data.session.user.id);
      if (!live) return;
      if (!p) return setState({ status: 'out' }); // a session with no healthapp profile sees nothing
      setDisplayName(p.full_name);
      setState({ status: 'in', role: p.role });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        if (!selfSignOut.current) setSessionEnded(true);
        setState({ status: 'out' });
      }
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /** This device only: `scope: 'local'` leaves the account's other devices signed in (MIN-4648). */
  const signOutHere = useCallback(async () => {
    selfSignOut.current = true;
    try {
      await supabase?.auth.signOut({ scope: 'local' });
    } finally {
      selfSignOut.current = false;
    }
  }, []);

  const signInDemo = useCallback(async (persona: DemoPersona, passcode: string): Promise<Role> => {
    if (!supabase || !callFunction) throw new ApiError(0, 'Not configured.');
    const res = await callFunction('demo-login', { persona, passcode }, DemoLoginResponse);
    setSessionEnded(false);
    const { error } = await supabase.auth.setSession({ access_token: res.access_token, refresh_token: res.refresh_token });
    if (error) throw new ApiError(0, 'The session was not accepted.');
    const p = await readProfile(res.user_id);
    if (!p) {
      await signOutHere();
      throw new ApiError(404, 'This account has no profile in this environment.');
    }
    setDisplayName(p.full_name);
    setState({ status: 'in', role: p.role });
    return p.role;
  }, [signOutHere]);

  const signOut = useCallback(async () => {
    await signOutHere();
    setDisplayName(null);
    setState({ status: 'out' });
  }, [signOutHere]);

  const value = useMemo(() => ({ state, displayName, signInDemo, signOut, sessionEnded }), [state, displayName, signInDemo, signOut, sessionEnded]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): Auth {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
