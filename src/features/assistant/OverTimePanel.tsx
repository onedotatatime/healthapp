/** The container for the "Over time" panel (MIN-4552): one call to `healthapp-over-time` when the workspace opens. The answer lives in this component's state only: when access ends the shell unmounts and it goes with it. */
import { useEffect, useState } from 'react';
import { isGrantGone, type AssistantApi } from './api';
import { OverTimeView, type OverTimeState } from './OverTime';
import type { RecordIndex } from './record';

interface Props {
  api: AssistantApi;
  grantId: string;
  index: RecordIndex;
  openCite: string | null;
  onOpenCite(cite: string): void;
  onGone(): void;
}

export function OverTimePanel({ api, grantId, index, openCite, onOpenCite, onGone }: Props) {
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
  return <OverTimeView state={state} index={index} openCite={openCite} onOpenCite={onOpenCite} onRetry={() => setAttempt((n) => n + 1)} />;
}
