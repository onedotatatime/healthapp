import { createContext, useContext } from 'react';
import type { AssistantApi } from './api';
import { realAssistantApi } from './real';

/** Default is the real server. The preview page and tests provide the in-memory one. */
export const AssistantContext = createContext<AssistantApi>(realAssistantApi);
export const useAssistantApi = () => useContext(AssistantContext);
