import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { RequireRole } from './auth/RequireRole';
import { homeFor } from './auth/guard';
import { Spinner } from './components/Primitives';
import { ExamsRoutes } from './features/exams/ExamsRoutes';
import { Health } from './Health';

// The simulation screen and the matches preview read synthetic data; they stay out of the main chunk.
const Simulation = lazy(() => import('./features/matches/Simulation'));
const MatchesPreview = lazy(() => import('./features/matches/MatchesPreview'));
import { DoctorHome, PatientHome } from './pages/Homes';
import { AddSymptom } from './features/diary/AddSymptom';
import { Kit } from './pages/Kit';
import { Login } from './pages/Login';
import { DoctorConnect } from './features/handshake/DoctorConnect';
import { PatientShare } from './features/handshake/PatientShare';
import { ClaimLink, EntryBar } from './features/handshake/routes';

// Review fixtures (in-memory server, synthetic record) stay out of the main chunk.
const HandshakePreview = lazy(() => import('./features/handshake/Preview').then((m) => ({ default: m.HandshakePreview })));

function Root() {
  const { state } = useAuth();
  if (state.status === 'loading') return <main className="page"><Spinner label="Loading" /></main>;
  return <Navigate to={state.status === 'in' ? homeFor(state.role) : '/login'} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/login" element={<Login />} />
          <Route path="/simulation" element={<Suspense fallback={<Spinner label="Loading" />}><Simulation /></Suspense>} />
          <Route path="/preview/matches" element={<Suspense fallback={<Spinner label="Loading" />}><MatchesPreview /></Suspense>} />
          <Route path="/patient/exams/*" element={<RequireRole role="patient"><ExamsRoutes /></RequireRole>} />
          <Route path="/preview/exams/*" element={<ExamsRoutes preview />} />
          <Route path="/patient/diary" element={<RequireRole role="patient"><AddSymptom /></RequireRole>} />
          <Route path="/patient/*" element={<RequireRole role="patient"><PatientHome /></RequireRole>} />
          <Route path="/doctor/*" element={<RequireRole role="doctor"><DoctorHome /></RequireRole>} />
          <Route path="/patient" element={<RequireRole role="patient"><PatientHome /><EntryBar to="/patient/share" label="Share with a doctor" /></RequireRole>} />
          <Route path="/patient/share" element={<RequireRole role="patient"><PatientShare /></RequireRole>} />
          <Route path="/doctor" element={<RequireRole role="doctor"><DoctorHome /><EntryBar to="/doctor/connect" label="Connect to a patient" /></RequireRole>} />
          <Route path="/doctor/connect" element={<RequireRole role="doctor"><DoctorConnect /></RequireRole>} />
          <Route path="/s" element={<ClaimLink />} />
          <Route path="/preview/handshake" element={<Suspense fallback={<Spinner label="Loading" />}><HandshakePreview /></Suspense>} />
          <Route path="/health" element={<Health />} />
          <Route path="/kit" element={<Kit />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
