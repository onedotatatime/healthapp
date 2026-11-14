import { createContext, useContext } from 'react';
import type { MatchesApi } from './api';
import { realMatchesApi } from './real';

/** Default is the real server (the way the exams and assistant contexts work). The preview page provides the in-memory one. */
export const MatchesContext = createContext<MatchesApi>(realMatchesApi);
export const useMatchesApi = () => useContext(MatchesContext);
