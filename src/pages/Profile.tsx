import { CaretLeft, SignOut } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { NavBar, TabBar } from '../components/Shell';

/** The profile page of each side (MIN-4595): a round photo, the display name and the one account action. The photos are static
 *  assets (patient: the founder's own; doctor: a synthetic illustration made with fal). No upload, no stored field. */
function ProfileBody({ photo }: { photo: string }) {
  const { displayName, signOut } = useAuth();
  const name = displayName ?? '';
  return (
    <>
      <h1>Profile</h1>
      <div className="profile-id">
        <img className="profile-photo" src={photo} width={128} height={128} alt={name} data-testid="profile-photo" />
        <p className="profile-name" data-testid="profile-name">{name}</p>
      </div>
      <div className="group">
        <button type="button" data-testid="sign-out" onClick={() => void signOut()}>
          <SignOut size={22} weight="bold" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </>
  );
}

export function PatientProfile() {
  return (
    <>
      <NavBar to="/patient" />
      <main className="page tabbed pushed" data-testid="profile">
        <ProfileBody photo="/profile/patient.webp" />
      </main>
      <TabBar />
    </>
  );
}

export function DoctorProfile() {
  return (
    <>
      <header className="navbar">
        <Link to="/doctor" className="nav-back" aria-label="Back">
          <CaretLeft size={22} weight="bold" aria-hidden="true" />
        </Link>
      </header>
      <main className="page pushed" data-testid="profile">
        <ProfileBody photo="/profile/doctor.webp" />
      </main>
    </>
  );
}
