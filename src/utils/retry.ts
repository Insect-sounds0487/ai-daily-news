export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; backoffMs: number; label: string }
): Promise<T> {
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === options.maxRetries) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      const delay = options.backoffMs * Math.pow(2, attempt) + Math.random() * options.backoffMs;
      console.warn(`[${options.label}] 第 ${attempt + 1} 次失败: ${msg}，${Math.round(delay)}ms 后重试...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('unreachable');
}
