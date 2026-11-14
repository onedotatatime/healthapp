import { CaretRight, PlusCircle } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { DiaryList } from '../features/diary/DiaryList';
import { EmptyState } from '../components/Primitives';
import { PatientProfileLink, TabBar } from '../components/Shell';
import { RecordsList, ScanTile } from '../features/exams/RecordsList';
import { ShareTile } from '../features/handshake/routes';
import { MatchesOptIn } from '../features/matches/MatchesOptIn';
import { COPY as SIMULATE } from '../features/simulate/copy';

/** Empty shell: the screens of drops 1 to 4 are built into it. */
export function PatientHome() {
  const { displayName } = useAuth();
  return (
    <>
      <main className="page tabbed" data-testid="patient-home">
        <PatientProfileLink />
        <h1>Your record</h1>
        <p className="muted" data-testid="signed-in-as">Signed in as {displayName ?? 'the patient'}.</p>
        <div className="tiles">
          <ScanTile />
          <ShareTile />
        </div>
        <RecordsList />
        <DiaryList />
        <div className="group section-title">
          <Link to="/patient/diary" data-testid="add-symptom">
            <PlusCircle size={22} weight="bold" aria-hidden="true" />
            Add symptom
            <CaretRight className="chev" size={18} weight="bold" aria-hidden="true" />
          </Link>
          <Link to="/patient/access" data-testid="access-log-link">
            Who had access to your record
            <CaretRight className="chev" size={18} weight="bold" aria-hidden="true" />
          </Link>
        </div>
        <MatchesOptIn />
      </main>
      <TabBar />
    </>
  );
}

export function DoctorHome() {
  const { displayName } = useAuth();
  return (
    <main className="page doctor" data-testid="doctor-home">
      <div className="title-row">
        <h1>Patients</h1>
        <Link to="/doctor/profile" className="profile-link" aria-label="Profile" data-testid="profile-link">
          <img src="/profile/doctor.webp" width={44} height={44} alt="" />
        </Link>
      </div>
      <p className="muted" data-testid="signed-in-as">Signed in as {displayName ?? 'the doctor'}.</p>
      <EmptyState>No patient has shared a record with you yet.</EmptyState>
      <p style={{ marginTop: 'var(--space-4)' }}><Link to="/doctor/simulate" data-testid="simulate-link">{SIMULATE.home}</Link></p>
    </main>
  );
}
