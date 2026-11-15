/** The one call to `healthapp-over-time` per workspace open (MIN-4552, MIN-4664). The answer lives in this hook's state only: the cards, the flag chips and the footer read the same answer, and when access ends the shell unmounts and it goes with it. */
import { useEffect, useState } from 'react';
import { isGrantGone, type AssistantApi } from './api';
import type { OverTimeState } from './OverTime';

export function useOverTime(api: AssistantApi, grantId: string, onGone: () => void): [OverTimeState, () => void] {
  const [state, setState] = useState<OverTimeState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    api.overTime(grantId).then(
      (data) => alive && setState({ status: 'ready', data }),
      (e) => {
        if (!alive) return;
        setState({ status: 'error' });
        if (isGrantGone(e)) onGone();
      },
    );
    return () => {
      alive = false;
    };
  }, [api, grantId, attempt, onGone]);
  return [state, () => setAttempt((n) => n + 1)];
}
