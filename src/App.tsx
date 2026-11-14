import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { RequireRole } from './auth/RequireRole';
import { homeFor } from './auth/guard';
import { Spinner } from './components/Primitives';
import { Health } from './Health';
import { DoctorHome, PatientHome } from './pages/Homes';
import { AddSymptom } from './features/diary/AddSymptom';
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
          <Route path="/patient/diary" element={<RequireRole role="patient"><AddSymptom /></RequireRole>} />
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
