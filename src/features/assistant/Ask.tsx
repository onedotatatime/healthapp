/**
 * E2: the ask box and the conversation. One whole response per question (not streamed): the question is echoed with
 * "Reading the record" until it arrives. A failed call keeps the question in the box with a retry. The conversation
 * lives in this component's state only: it is gone when the grant ends and the workspace unmounts.
 */
import { useEffect, useRef, useState } from 'react';
import { Spinner } from '../../components/Primitives';
import { askErrorMessage, isGrantGone, type AssistantApi } from './api';
import { Answer, type ChipCtx } from './Blocks';
import type { AssistantResponse } from './contract';

type Turn = { id: number; question: string; status: 'loading' | 'done' | 'error'; response?: AssistantResponse; error?: string };

export const QUICK_ASKS = ['What do the CRP results show?', 'Which conditions are written in the documents?'];
const MAX = 1000;

interface Props {
  api: AssistantApi;
  grantId: string;
  ctx: Omit<ChipCtx, 'numberFor'>;
  onGone(): void;
}

export function AskPanel({ api, grantId, ctx, onGone }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState('');
  const seq = useRef(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true; // StrictMode runs the cleanup once before the real mount
    return () => void (alive.current = false);
  }, []);
  const busy = turns.some((t) => t.status === 'loading');

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    const id = ++seq.current;
    setTurns((t) => [...t.filter((x) => x.status !== 'error'), { id, question: q, status: 'loading' }]);
    setText('');
    try {
      const response = await api.ask(grantId, q);
      if (alive.current) setTurns((t) => t.map((x) => (x.id === id ? { ...x, status: 'done', response } : x)));
    } catch (e) {
      if (!alive.current) return;
      setTurns((t) => t.map((x) => (x.id === id ? { ...x, status: 'error', error: askErrorMessage(e) } : x)));
      setText(q); // the question stays in the box
      if (isGrantGone(e)) onGone();
    }
  };

  return (
    <div className="as-panel" data-testid="assistant">
      <p className="as-strip" data-testid="ai-strip">Answers come from an AI reading this record. Check each one against its source.</p>
      <form onSubmit={(e) => { e.preventDefault(); void ask(text); }} className="as-form">
        <label className="field">
          <span>Ask about this patient</span>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX} autoComplete="off" data-testid="ask-input" />
        </label>
        <button type="submit" className="btn primary as-btn" disabled={busy || !text.trim()} data-testid="ask-submit">Ask</button>
      </form>
      <div className="as-quick" aria-label="Quick questions">
        {QUICK_ASKS.map((q) => <button key={q} type="button" className="btn as-btn" disabled={busy} onClick={() => void ask(q)} data-testid="quick-ask">{q}</button>)}
      </div>
      <div className="as-thread" aria-live="polite">
        {turns.map((t) => (
          <section key={t.id} className="as-turn" data-testid="turn" data-status={t.status}>
            <p className="as-q"><span className="muted">You asked:</span> {t.question}</p>
            {t.status === 'loading' && <p><Spinner label="Reading the record" /></p>}
            {t.status === 'done' && t.response && <Answer response={t.response} ctx={ctx} />}
            {t.status === 'error' && (
              <div className="note" role="alert" data-testid="ask-error">
                <span>{t.error}</span>
                <button type="button" className="as-link" onClick={() => void ask(t.question)} data-testid="ask-retry">Try again</button>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
