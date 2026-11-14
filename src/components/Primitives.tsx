import type { ReactNode } from 'react';

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span className="spinner" role="status">
      <i aria-hidden="true" />
      {label}
    </span>
  );
}

/** tone `error` is for sign-in and doctor-side errors; never on a patient result (Drop 0). */
export function ErrorNote({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'caution' }) {
  return (
    <div className={tone === 'caution' ? 'note caution' : 'note'} role="alert" data-testid="error-note">
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
