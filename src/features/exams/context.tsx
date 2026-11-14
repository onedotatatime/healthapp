import { createContext, useContext } from 'react';
import { realApi } from './real';
import type { ExamsApi } from './logic';

/** `base` is where the exam routes are mounted, so links work. */
export interface ExamsCtx {
  api: ExamsApi;
  base: string;
  /** Where "back to your record" goes: the patient home. */
  home: string;
}
export const ExamsContext = createContext<ExamsCtx>({ api: realApi, base: '/patient/exams', home: '/patient' });
export const useExams = () => useContext(ExamsContext);
