import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RefusalNote } from './Marks';
import { ProvenanceMark } from '../../components/ProvenanceMark';
import { docMarks, refusalView } from './logic';

const html = (r: Parameters<typeof refusalView>[0]) => renderToStaticMarkup(createElement(RefusalNote, { view: refusalView(r) }));

describe('B1 refusal screen, three variants', () => {
  it('name mismatch', () => {
    expect(html('name_mismatch')).toContain("This exam isn&#x27;t yours.");
    expect(html('name_mismatch')).toContain('The name on it');
    expect(html('name_mismatch')).toContain("We didn&#x27;t save it.");
  });
  it('ID mismatch', () => {
    expect(html('id_mismatch')).toContain('The ID on it');
    expect(html('id_mismatch')).toContain("We didn&#x27;t save it.");
  });
  it('no readable name', () => {
    expect(html('name_missing')).toContain("We can&#x27;t find your name on this exam.");
    expect(html('name_missing')).toContain('Nothing was saved.');
  });
});

describe('B2 marks', () => {
  const words = (d: Parameters<typeof docMarks>[0]) => docMarks(d).map((k) => renderToStaticMarkup(createElement(ProvenanceMark, { kind: k })));
  it('verified, uploaded, and name match only come out as words', () => {
    expect(words({ provenance: 'verified_by_source', identity_status: 'match' }).join('|')).toContain('Verified by source');
    expect(words({ provenance: 'uploaded_by_patient', identity_status: 'match' }).join('|')).toContain('Uploaded by patient');
    const n = words({ provenance: 'uploaded_by_patient', identity_status: 'name_only' }).join('|');
    expect(n).toContain('Uploaded by patient');
    expect(n).toContain('Name match only');
  });
});
