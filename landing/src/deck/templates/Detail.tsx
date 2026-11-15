import type { ReactNode } from 'react';
import type { DetailSlide } from '../types';
import { typo } from '../util';

/* A small markdown subset for appendix pages: **bold**, *label*, `code`, \* literal asterisk,
   "- " and "1. " lists (one nested level), | tables |, and a paragraph that is one bold line = a sub-heading. */

const inline = (src: string, key = 'i'): ReactNode[] => {
  const s = typo(src.replace(/\\\*/g, '\u0001'));
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  const lit = (x: string) => x.replace(/\u0001/g, '*');
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(lit(s.slice(last, m.index)));
    if (m[1] !== undefined) out.push(<strong key={`${key}${n++}`}>{inline(m[1], `${key}${n}b`)}</strong>);
    else out.push(<em key={`${key}${n++}`} className="lbl">{lit(m[2])}</em>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(lit(s.slice(last)));
  return out;
};

const isTableLine = (l: string) => l.trim().startsWith('|');
const listRe = /^(\s*)(- |\d+\. )(.*)$/;

function Table({ lines }: { lines: string[] }) {
  const rows = lines.map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  const head = rows[0];
  const body = rows.slice(2); // rows[1] is the |---| rule
  const isTotal = (r: string[]) => r.some((c) => /^\*\*(Total|SAM|Team total|Conservative total|Upside total)/.test(c));
  return (
    <table className="dt">
      <thead><tr>{head.map((h, i) => <th key={i}>{inline(h)}</th>)}</tr></thead>
      <tbody>
        {body.map((r, ri) => (
          <tr key={ri} className={isTotal(r) ? 'tot' : undefined}>
            {r.map((c, ci) => <td key={ci}>{inline(c)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function List({ lines }: { lines: string[] }) {
  type Item = { text: string; sub: string[] };
  const items: Item[] = [];
  let ordered = false;
  let start = 1;
  for (const l of lines) {
    const m = l.match(listRe)!;
    if (m[1].length >= 2 && items.length) items[items.length - 1].sub.push(m[3]);
    else {
      if (!items.length) { ordered = /\d/.test(m[2]); start = ordered ? parseInt(m[2], 10) : 1; }
      items.push({ text: m[3], sub: [] });
    }
  }
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className="dl" start={ordered ? start : undefined}>
      {items.map((it, i) => (
        <li key={i}>
          {inline(it.text)}
          {it.sub.length > 0 && <ul>{it.sub.map((x, j) => <li key={j}>{inline(x)}</li>)}</ul>}
        </li>
      ))}
    </Tag>
  );
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.replace(/^\n+|\n+$/g, '')).filter(Boolean);
  return (
    <>
      {blocks.map((b, bi) => {
        const lines = b.split('\n');
        // a paragraph, then a list or table, in one block: split it
        const parts: { kind: 'p' | 'ul' | 'tb'; lines: string[] }[] = [];
        for (const l of lines) {
          const kind = isTableLine(l) ? 'tb' : listRe.test(l) ? 'ul' : 'p';
          const prev = parts[parts.length - 1];
          if (prev && (prev.kind === kind || (kind === 'ul' && prev.kind === 'ul') || (kind === 'p' && prev.kind === 'ul' && /^\s{2,}/.test(l)))) prev.lines.push(l);
          else parts.push({ kind, lines: [l] });
        }
        return parts.map((p, pi) => {
          const k = `${bi}-${pi}`;
          if (p.kind === 'tb') return <Table key={k} lines={p.lines} />;
          if (p.kind === 'ul') return <List key={k} lines={p.lines} />;
          const t = p.lines.join(' ');
          if (/^\*\*[^*]+\*\*$/.test(t.trim())) return <h3 key={k} className="dh">{inline(t.trim().slice(2, -2))}</h3>;
          return <p key={k} className="dp">{inline(t)}</p>;
        });
      })}
    </>
  );
}

/** Appendix page: a compact title and one to three columns of small markdown. Smaller type than the main slides, tables where the content is tabular. */
export function Detail({ s }: { s: DetailSlide }) {
  return (
    <div className="t-detail">
      <h2 className="slide-h ap">{typo(s.headline)}</h2>
      <div className="dt-cols" style={{ gridTemplateColumns: s.grid, ['--fs' as string]: `${s.fs ?? 19}px` }}>
        {s.columns.map((c, i) => (
          <section key={i} className="dt-col"><Markdown text={c} /></section>
        ))}
      </div>
    </div>
  );
}
