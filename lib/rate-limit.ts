import { getRedis } from "@/lib/redis";

export async function rateLimit(
  key: string,
  maxPerWindow: number,
  windowSeconds: number,
): Promise<{ ok: boolean; remaining: number }> {
  const redis = getRedis();
  const k = `rl:${key}`;
  const count = (await redis.incr(k)) as number;
  if (count === 1) {
    await redis.expire(k, windowSeconds);
  }
  const ok = count <= maxPerWindow;
  return { ok, remaining: Math.max(0, maxPerWindow - count) };
}

export function clientIpFrom(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
