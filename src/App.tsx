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
// The doctor's simulated matching over 5,000 synthetic records (MIN-4594): its data file stays out of the main chunk.
const DoctorSimulate = lazy(() => import('./features/simulate/Simulate'));
// Dev server only: import.meta.env.DEV is false in a build, so this route and its mock data are not in the shipped bundle.
const DoctorAnalysisPreview = import.meta.env.DEV ? lazy(() => import('./features/assistant/Preview')) : null;
const ExamsPreview = import.meta.env.DEV ? lazy(() => import('./features/exams/Preview')) : null;
import { DoctorHome, PatientHome } from './pages/Homes';
import { AccessLog } from './features/accesslog/AccessLog';
import { AddSymptom } from './features/diary/AddSymptom';
import { Kit } from './pages/Kit';
import { Login } from './pages/Login';
import { DoctorConnect } from './features/handshake/DoctorConnect';
import { PatientShare } from './features/handshake/PatientShare';
import { ClaimLink, EntryBar } from './features/handshake/routes';

function Root() {
  const { state } = useAuth();
  if (state.status === 'loading') return <main className="page"><Spinner label="Loading" /></main>;
  return <Navigate to={state.status === 'in' ? homeFor(state.role) : '/login'} replace />;
}

// The presenter's reset page: linked from nowhere, loaded only when its URL is opened.
const DemoPanel = lazy(() => import('./features/demo/DemoPanel'));

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/login" element={<Login />} />
          <Route path="/simulation" element={<Suspense fallback={<Spinner label="Loading" />}><Simulation /></Suspense>} />
          {DoctorAnalysisPreview && <Route path="/preview/doctor-analysis" element={<Suspense fallback={<Spinner label="Loading" />}><DoctorAnalysisPreview /></Suspense>} />}
          {ExamsPreview && <Route path="/preview/exams/*" element={<Suspense fallback={<Spinner label="Loading" />}><ExamsPreview /></Suspense>} />}
          <Route path="/preview/matches" element={<Suspense fallback={<Spinner label="Loading" />}><MatchesPreview /></Suspense>} />
          <Route path="/patient/exams/*" element={<RequireRole role="patient"><ExamsRoutes /></RequireRole>} />
          <Route path="/patient/access" element={<RequireRole role="patient"><AccessLog /></RequireRole>} />
          <Route path="/patient/diary" element={<RequireRole role="patient"><AddSymptom /></RequireRole>} />
          <Route path="/patient/*" element={<RequireRole role="patient"><PatientHome /></RequireRole>} />
          <Route path="/doctor/simulate" element={<RequireRole role="doctor"><Suspense fallback={<Spinner label="Loading" />}><DoctorSimulate /></Suspense></RequireRole>} />
          <Route path="/doctor/*" element={<RequireRole role="doctor"><DoctorHome /></RequireRole>} />
          <Route path="/patient" element={<RequireRole role="patient"><PatientHome /><EntryBar to="/patient/share" label="Share with a doctor" /></RequireRole>} />
          <Route path="/patient/share" element={<RequireRole role="patient"><PatientShare /></RequireRole>} />
          <Route path="/doctor" element={<RequireRole role="doctor"><DoctorHome /><EntryBar to="/doctor/connect" label="Connect to a patient" /></RequireRole>} />
          <Route path="/doctor/connect" element={<RequireRole role="doctor"><DoctorConnect /></RequireRole>} />
          <Route path="/s" element={<ClaimLink />} />
          <Route path="/demo" element={<Suspense fallback={<Spinner label="Loading" />}><DemoPanel /></Suspense>} />
          <Route path="/health" element={<Health />} />
          <Route path="/kit" element={<Kit />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
