import { createContext, useContext } from 'react';
import { realApi } from './real';
import type { ExamsApi } from './logic';

/** `base` is where the exam routes are mounted, so links work both under /patient/exams and /preview/exams. */
export interface ExamsCtx {
  api: ExamsApi;
  base: string;
  /** Where "back to your record" goes: the patient home, or the preview list. */
  home: string;
}
export const ExamsContext = createContext<ExamsCtx>({ api: realApi, base: '/patient/exams', home: '/patient' });
export const useExams = () => useContext(ExamsContext);
