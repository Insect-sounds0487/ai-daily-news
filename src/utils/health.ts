import type { HealthCheckResult } from '../types';

export async function checkUrlHealth(
  url: string,
  timeoutMs: number
): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HealthCheck/1.0)' },
      });
      // 任何 HTTP 响应（包括 403/503）都说明服务器可达
      return {
        sourceName: '',
        healthy: true,
        latencyMs: Date.now() - start,
        url,
      };
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    return {
      sourceName: '',
      healthy: false,
      latencyMs: Date.now() - start,
      url,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
