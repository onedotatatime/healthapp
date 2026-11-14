import { useAuth } from '../auth/AuthProvider';
import { EmptyState } from '../components/Primitives';

function SignOut() {
  const { signOut } = useAuth();
  return (
    <button type="button" className="btn" data-testid="sign-out" onClick={() => void signOut()}>
      Sign out
    </button>
  );
}

/** Empty shell: the screens of drops 1 to 4 are built into it. */
export function PatientHome() {
  const { displayName } = useAuth();
  return (
    <main className="page" data-testid="patient-home">
      <h1>Your record</h1>
      <p className="muted" data-testid="signed-in-as">Signed in as {displayName ?? 'the patient'}.</p>
      <EmptyState>No exams yet. They will appear here once they are added.</EmptyState>
      <p style={{ marginTop: 'var(--space-6)' }}>
        <SignOut />
      </p>
    </main>
  );
}

export function DoctorHome() {
  const { displayName } = useAuth();
  return (
    <main className="page doctor" data-testid="doctor-home">
      <h1>Patients</h1>
      <p className="muted" data-testid="signed-in-as">Signed in as {displayName ?? 'the doctor'}.</p>
      <EmptyState>No patient has shared a record with you yet.</EmptyState>
      <p style={{ marginTop: 'var(--space-6)' }}>
        <SignOut />
      </p>
    </main>
  );
}
