/**
 * `/preview/exams` (dev server only): the patient's scan screen, "My exams" list, saved exam and review against the
 * in-memory `mock.ts`, so every state can be looked at before the backend is live. SYNTHETIC only: Maria Papadopoulou
 * is the stage persona. Nothing here reaches a server; a result on this screen does not count toward the goal.
 * `?outcome=unreadable | name | id | missing | failed | offline` steers what the next scanned exam turns into.
 */
import { Link, Route, Routes } from 'react-router';
import { AddExam } from './AddExam';
import { ExamsContext } from './context';
import { mockApi } from './mock';
import { RecordsList } from './RecordsList';
import { RecordView } from './RecordView';
import { ReviewRoute } from './ReviewRoute';
import './exams.css';

const value = { api: mockApi, base: '/preview/exams', home: '/preview/exams' };

export default function ExamsPreview() {
  return (
    <ExamsContext.Provider value={value}>
      <Routes>
        <Route index element={<main className="page" data-testid="exams-preview"><h1>Your record</h1><p className="muted">Synthetic data: does not count toward the goal. Nothing here reaches a server.</p><RecordsList /><p><Link to="add">Scan screen</Link></p></main>} />
        <Route path="add" element={<AddExam />} />
        <Route path=":id" element={<RecordView />} />
        <Route path=":id/review" element={<ReviewRoute />} />
      </Routes>
    </ExamsContext.Provider>
  );
}
