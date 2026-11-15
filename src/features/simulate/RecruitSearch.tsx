/**
 * The recruitment search, first section of /doctor/simulate (MIN-4706, built under MIN-4711). A doctor writes one sentence; a fixed
 * parser reads a number and one condition (recruit.ts); the search runs in this browser over the 50,000 seeded synthetic records of
 * data/synthetic/recruit-50000.json. That file is its own chunk, loaded with `import()` after the first paint. No network call, no
 * model, nothing stored or logged: the sentence lives in this component's state and nowhere else. Every count on screen is what
 * recruit() returned at this search. Synthetic data only.
 */
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { COPY as MATCHES_COPY } from '../matches/copy';
import { RECRUIT_CONDITION_NAMES, RECRUIT_COPY as T, recruitFill } from './copy';
import { codeLabel, countryName } from './format';
import { parseRecruitFile, parseRequest, recruit, type RecruitCondition, type RecruitFile } from './recruit';
import './recruit.css';

const nf = (n: number) => n.toLocaleString('en-US');
const nameOf = (c: RecruitCondition) => RECRUIT_CONDITION_NAMES[c.id as keyof typeof RECRUIT_CONDITION_NAMES] ?? c.name;
const defaultLoad = () => import('./recruit-data').then((m) => m.default);

type Loaded = { state: 'loading' } | { state: 'error' } | { state: 'ready'; file: RecruitFile };

/** `load` is the file's loader; tests and the review harness may pass another, the page passes none. */
export default function RecruitSearch({ load = defaultLoad }: { load?: () => Promise<unknown> }) {
  const [text, setText] = useState('');
  const [query, setQuery] = useState<string | null>(null); // the sentence at the last submit; null until the first one
  const [data, setData] = useState<Loaded>({ state: 'loading' });
  const input = useRef<HTMLInputElement>(null);

  // After the first paint: the timer runs once the first commit is on screen, so the 50,000 records are never on the first paint's path.
  useEffect(() => {
    let alive = true;
    const t = window.setTimeout(() => {
      load()
        .then((json) => { if (alive) setData({ state: 'ready', file: parseRecruitFile(json) }); })
        .catch(() => { if (alive) setData({ state: 'error' }); });
    }, 0);
    return () => { alive = false; window.clearTimeout(t); };
  }, [load]);

  const file = data.state === 'ready' ? data.file : null;
  const parsed = useMemo(() => (file && query !== null ? parseRequest(query, file.conditions, file.n) : null), [file, query]);
  const result = useMemo(() => (file && parsed?.kind === 'ok' ? recruit(file, parsed.condition, parsed.asked) : null), [file, parsed]);

  const submit = (e: FormEvent) => { e.preventDefault(); setQuery(text); };
  const fill = (c: RecruitCondition) => {
    setText(recruitFill(parsed && 'asked' in parsed && parsed.asked ? parsed.asked : 40, c.name));
    input.current?.focus();
  };

  return (
    <section className="sm-card" aria-labelledby="rc-h" data-testid="recruit">
      <h2 id="rc-h">{T.title}</h2>
      <p className="muted">{T.intro}</p>
      <form className="rc-form" onSubmit={submit} data-testid="recruit-form">
        <div className="rc-field">
          <label htmlFor="rc-input">{T.inputLabel}</label>
          <input
            ref={input}
            id="rc-input"
            className="rc-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={T.placeholder}
            maxLength={300}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            data-testid="recruit-input"
          />
        </div>
        <button type="submit" className="btn primary" data-testid="recruit-submit">{T.button}</button>
      </form>
      <div className="rc-labels">
        <p className="sm-fixed" data-testid="recruit-understands">{T.understandsLabel}</p>
        {file && <p className="sm-fixed" data-testid="recruit-source">{/boxd/i.test(file.made.where) ? T.sourceLabelBoxd : T.sourceLabelDev}</p>}
      </div>

      <div className="rc-out" aria-live="polite" data-testid="recruit-out">
        {data.state === 'loading' && <p className="muted" data-testid="recruit-loading">{T.loading}</p>}
        {data.state === 'error' && <p role="alert" data-testid="recruit-load-error">{MATCHES_COPY.panelError}</p>}
        {file && parsed && <Outcome file={file} parsed={parsed} result={result} onPick={fill} />}
      </div>
    </section>
  );
}

function Outcome({ file, parsed, result, onPick }: { file: RecruitFile; parsed: ReturnType<typeof parseRequest>; result: ReturnType<typeof recruit> | null; onPick: (c: RecruitCondition) => void }) {
  if (parsed.kind === 'empty') return <p data-testid="recruit-empty">{T.emptyBox}</p>;
  if (parsed.kind === 'no_condition') {
    return (
      <>
        <p data-testid="recruit-unknown">{T.unknownCondition}</p>
        <ul className="rc-picks" aria-label={T.title}>
          {file.conditions.map((c) => (
            <li key={c.id}><button type="button" className="rc-pick" data-testid={`recruit-pick-${c.id}`} onClick={() => onPick(c)}>{nameOf(c)}</button></li>
          ))}
        </ul>
        <p className="muted sm-small">{T.groupNote}</p>
      </>
    );
  }
  if (parsed.kind === 'too_many') return <p data-testid="recruit-too-many">{T.tooMany(nf(file.n))}</p>;
  if (!result) return null;

  const { condition: c, asked, others } = parsed;
  const name = nameOf(c);
  const must = c.must.map(codeLabel).join(', ');
  const some = c.some.map(codeLabel).join(', ');
  return (
    <div className="rc-out" data-testid="recruit-result" data-condition={c.id}>
      {others.length > 0 && <p className="rc-notice" data-testid="recruit-two">{T.twoConditions(name)}</p>}
      <p className="rc-read" data-testid="recruit-read">{asked ? T.read(nf(asked), name) : T.readNoNumber(name)}</p>
      <p className="rc-read" data-testid="recruit-compared">{c.some.length === 0 ? T.comparedOnlyMust(must) : T.compared(must, some, String(c.min_some))}</p>
      {!result.shown ? (
        // The rule of five: one sentence, no count, no funnel, no countries (the funnel's later rows would give the count away).
        <p className="sm-big" data-testid="recruit-few">{T.fewerThanK(String(file.k))}</p>
      ) : (
        <>
          <div className="sm-enter" data-testid="recruit-found">
            {asked === null ? (
              <>
                <p className="sm-big" data-testid="recruit-line">{T.resultNoNumber(nf(result.selected))}</p>
                <p className="muted" data-testid="recruit-no-number">{T.noNumberNote}</p>
              </>
            ) : result.short > 0 ? (
              <p className="sm-big" data-testid="recruit-line">{T.resultShort(nf(result.eligible), nf(asked))}</p>
            ) : (
              <>
                <p className="sm-big" data-testid="recruit-line">{T.resultEqual(nf(asked), nf(result.selected))}</p>
                {result.eligible > asked && <p className="muted" data-testid="recruit-more">{T.resultMore(nf(result.eligible - asked))}</p>}
              </>
            )}
          </div>
          <ol className="rc-funnel" data-testid="recruit-funnel">
            {(
              [
                ['records', result.records],
                ['optedIn', result.optedIn],
                ['eligible', result.eligible],
                ['selected', result.selected],
              ] as const
            ).map(([key, n]) => (
              <li key={key} data-testid={`recruit-funnel-${key}`}>
                <span className="rc-num mono">{nf(n)}</span>
                <div>
                  <strong>{T.funnel[key].label}</strong>
                  <span className="rc-line">{T.funnel[key].line}</span>
                  <div className="sm-bar" aria-hidden="true"><i style={{ width: `${(n / result.records) * 100}%` }} /></div>
                </div>
              </li>
            ))}
          </ol>
          <p data-testid="recruit-countries">{T.countries(result.countries.map(countryName).sort((a, b) => a.localeCompare(b)).join(', '))}</p>
          <p className="muted sm-small" data-testid="recruit-simulated">{T.simulatedNote}</p>
          <p className="muted sm-small">{T.groupNote}</p>
        </>
      )}
    </div>
  );
}
