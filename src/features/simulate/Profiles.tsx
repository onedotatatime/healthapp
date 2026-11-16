/**
 * The two sections after "Asked XX. Found XX." on /doctor/simulate (MIN-4756): the selected records one by one, and what they have in
 * common. Read-only: no button on a card, no link, no name, no ID. Synthetic data only. Shown only inside the result block, so neither is
 * in the DOM before the last stage. The common lines are `prepared.common`, counted once at the click over every selected row.
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { RECRUIT_COPY as T } from './copy';
import { CARDS_FIRST, codeText, moreStep, profileBuilder, type Common, type Profile } from './profile';
import type { RecruitCondition, RecruitFile } from './recruit';

const nf = (n: number) => n.toLocaleString('en-US');

const Card = memo(function Card({ p }: { p: Profile }) {
  return (
    <li className="pf-card" data-testid="recruit-profile" data-record={p.position}>
      <strong className="pf-rec">{T.recordLabel(nf(p.position))}</strong>
      <p className="pf-meta">
        <span>{T.countryLabel}: {p.country}</span>
        <span>{T.ageBandLabel}: {p.ageBand}</span>
      </p>
      <p className="pf-codes" data-testid="recruit-profile-codes">{p.codes.map(codeText).join(', ')}</p>
    </li>
  );
});

/**
 * One card per selected row, in picking order. The first CARDS_FIRST show; one button adds a hundred more (or what is left) until all are
 * on. The cards are cheap to keep: each is memoised and `content-visibility: auto`, so a long list costs no layout until it is scrolled to.
 * `key` the component by the run, so a new search starts again at the first cards.
 */
export const Profiles = memo(function Profiles({ file, cond, rows }: { file: RecruitFile; cond: RecruitCondition; rows: number[] }) {
  const n = rows.length;
  const [count, setCount] = useState(Math.min(CARDS_FIRST, n));
  const build = useMemo(() => profileBuilder(file, cond), [file, cond]);
  const cache = useRef<Profile[]>([]);
  const status = useRef<HTMLParagraphElement>(null);
  const clicked = useRef(false);
  const step = moreStep(count, n);
  const list: Profile[] = [];
  for (let i = 0; i < count; i++) list.push((cache.current[i] ??= build(i + 1, rows[i])));

  // The button goes when the last card is on: the focus it had moves to the "Showing" line (without scrolling), not to the page top.
  useEffect(() => {
    if (clicked.current && count >= n) status.current?.focus({ preventScroll: true });
  }, [count, n]);

  return (
    <section className="pf" aria-labelledby="pf-h" data-testid="recruit-profiles">
      <h3 id="pf-h">{T.profilesTitle(nf(n))}</h3>
      <p className="muted sm-small" data-testid="recruit-profiles-note">{T.profilesNote}</p>
      <p ref={status} tabIndex={-1} className="pf-showing" aria-live="polite" data-testid="recruit-profiles-showing">{T.showing(nf(count), nf(n))}</p>
      <ul className="pf-list" role="list" data-testid="recruit-profile-list">
        {list.map((p) => <Card key={p.position} p={p} />)}
      </ul>
      {step > 0 && (
        <button
          type="button"
          className="btn pf-more"
          data-testid="recruit-profiles-more"
          onClick={() => { clicked.current = true; setCount((c) => Math.min(n, c + moreStep(c, n))); }}
        >
          {T.showMore(nf(step))}
        </button>
      )}
    </section>
  );
});

/** "What they have in common": the codes every selected record holds, the ones at least half hold, and the age bands. Counts are `common`'s. */
export const CommonView = memo(function CommonView({ common }: { common: Common }) {
  const n = nf(common.n);
  return (
    <section className="pf" aria-labelledby="pf-common-h" data-testid="recruit-common">
      <h3 id="pf-common-h">{T.commonTitle}</h3>
      <p className="muted sm-small">{T.commonBasis(n)}</p>
      <p className="pf-sub" data-testid="recruit-common-all-title"><strong>{T.allHave(n)}</strong></p>
      <ul className="pf-lines" role="list" data-testid="recruit-common-all">
        {common.all.map((code) => <li key={code} data-code={code}>{codeText(code)}</li>)}
      </ul>
      {common.half.length > 0 ? (
        <>
          <p className="pf-sub" data-testid="recruit-common-half-title"><strong>{T.halfHave}</strong></p>
          <ul className="pf-lines" role="list" data-testid="recruit-common-half">
            {common.half.map((h) => <li key={h.code} data-code={h.code} data-count={h.count}>{codeText(h.code)}: {T.xOfN(nf(h.count), n)}</li>)}
          </ul>
        </>
      ) : (
        <p data-testid="recruit-common-nothing">{T.commonNothingMore}</p>
      )}
      <p data-testid="recruit-common-ages">{T.ageBands(common.bands.map((b) => `${b.band}: ${nf(b.count)}`).join(', '))}</p>
    </section>
  );
});
