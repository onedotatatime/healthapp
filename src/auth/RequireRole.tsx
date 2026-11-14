import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import type { Role } from '../api/contract';
import { Spinner } from '../components/Primitives';
import { useAuth } from './AuthProvider';
import { guard } from './guard';

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { state } = useAuth();
  const g = guard(state, role);
  if (g.kind === 'wait') return <main className="page"><Spinner label="Loading" /></main>;
  if (g.kind === 'redirect') return <Navigate to={g.to} replace />;
  return <>{children}</>;
}
