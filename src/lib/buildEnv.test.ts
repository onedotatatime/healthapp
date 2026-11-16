import { describe, expect, it } from 'vitest';
import { buildEnv } from './buildEnv';

describe('buildEnv (MIN-4658)', () => {
  it('turns the branch named exactly staging into demo, whatever the variable says', () => {
    expect(buildEnv('staging', 'dev')).toBe('demo');
    expect(buildEnv('staging', undefined)).toBe('demo');
    expect(buildEnv('staging', 'demo')).toBe('demo');
  });
  it.each(['main', 'staging-dev', 'Staging', 'staging/x', 'fix/min-4658-staging-demo', ' staging', 'staging ', '', undefined])(
    'leaves the variable unchanged for branch %j',
    (branch) => {
      expect(buildEnv(branch, 'dev')).toBe('dev');
      expect(buildEnv(branch, 'demo')).toBe('demo');
      expect(buildEnv(branch, undefined)).toBeUndefined();
    },
  );
});
