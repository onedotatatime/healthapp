import { useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { AddExam } from './AddExam';
import { ExamsContext } from './context';
import { realApi } from './real';
import { mockApi } from './mock';
import { RecordView } from './RecordView';
import { RecordsList } from './RecordsList';
import type { ExamsApi } from './logic';
import './exams.css';

function PreviewHome() {
  return (
    <main className="page">
      <h1>Your record</h1>
      <p className="muted">Preview with synthetic data. Nothing here reaches a server.</p>
      <RecordsList />
    </main>
  );
}

/** Mounted at /patient/exams (real calls) and at /preview/exams (fixtures; `?outcome=` steers the read, see mock.ts). */
export function ExamsRoutes({ preview = false }: { preview?: boolean }) {
  const value = useMemo(
    () => ({
      api: (preview ? mockApi : realApi) as ExamsApi,
      base: preview ? '/preview/exams' : '/patient/exams',
      home: preview ? '/preview/exams' : '/patient',
    }),
    [preview],
  );
  return (
    <ExamsContext.Provider value={value}>
      <Routes>
        <Route index element={preview ? <PreviewHome /> : <Navigate to="/patient" replace />} />
        <Route path="add" element={<AddExam />} />
        <Route path=":id" element={<RecordView />} />
      </Routes>
    </ExamsContext.Provider>
  );
}
