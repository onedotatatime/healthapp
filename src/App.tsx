import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { RequireRole } from './auth/RequireRole';
import { homeFor } from './auth/guard';
import { Spinner } from './components/Primitives';
import { ExamsRoutes } from './features/exams/ExamsRoutes';
import { Health } from './Health';
import { DoctorHome, PatientHome } from './pages/Homes';
import { Kit } from './pages/Kit';
import { Login } from './pages/Login';

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
          <Route path="/patient/exams/*" element={<RequireRole role="patient"><ExamsRoutes /></RequireRole>} />
          <Route path="/preview/exams/*" element={<ExamsRoutes preview />} />
          <Route path="/patient/*" element={<RequireRole role="patient"><PatientHome /></RequireRole>} />
          <Route path="/doctor/*" element={<RequireRole role="doctor"><DoctorHome /></RequireRole>} />
          <Route path="/health" element={<Health />} />
          <Route path="/kit" element={<Kit />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
