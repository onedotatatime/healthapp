/**
 * MIN-4658: a Cloudflare Pages build of the branch named exactly `staging` is a `demo` build, so the staging
 * address reads and writes healthapp_demo (the founder's records). Every other branch keeps the Pages variable.
 * Pure, so it is unit tested; vite.config.ts is the only caller.
 */
export function buildEnv(branch: string | undefined, variable: string | undefined): string | undefined {
  return branch === 'staging' ? 'demo' : variable;
}
