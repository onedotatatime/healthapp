import { useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { AddExam } from './AddExam';
import { ExamsContext } from './context';
import { realApi } from './real';
import { RecordView } from './RecordView';
import type { ExamsApi } from './logic';
import './exams.css';

/** Mounted at /patient/exams. Real calls only (MIN-4515: the /preview fixtures are gone from the app). */
export function ExamsRoutes() {
  const value = useMemo(
    () => ({ api: realApi as ExamsApi, base: '/patient/exams', home: '/patient' }),
    [],
  );
  return (
    <ExamsContext.Provider value={value}>
      <Routes>
        <Route index element={<Navigate to="/patient" replace />} />
        <Route path="add" element={<AddExam />} />
        <Route path=":id" element={<RecordView />} />
      </Routes>
    </ExamsContext.Provider>
  );
}
