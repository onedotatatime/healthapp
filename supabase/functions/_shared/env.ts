// The only two environments healthapp knows (MIN-4449, decision 1.1).
export const ENVS = ["dev", "demo"] as const;
export type HealthappEnv = (typeof ENVS)[number];

export function readEnv(req: Request): HealthappEnv | null {
  const v = req.headers.get("x-healthapp-env");
  return v === "dev" || v === "demo" ? v : null;
}
