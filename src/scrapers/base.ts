import type { Browser } from 'playwright';
import type { HealthCheckResult } from '../types';
import type { ReportMode } from '../config';
import { withRetry } from '../utils/retry';
import { checkUrlHealth } from '../utils/health';
import { CONFIG } from '../config';

export abstract class BaseScraper<T> {
  protected browser: Browser | null;

  constructor(browser?: Browser) {
    this.browser = browser ?? null;
  }

  async scrape(mode?: ReportMode): Promise<T[]> {
    return withRetry(() => this.doScrape(mode), {
      maxRetries: CONFIG.RETRY_MAX,
      backoffMs: CONFIG.RETRY_BACKOFF_MS,
      label: this.sourceName,
    });
  }

  async isHealthy(): Promise<HealthCheckResult> {
    const result = await checkUrlHealth(this.healthCheckUrl, CONFIG.HEALTH_CHECK_TIMEOUT_MS);
    return { ...result, sourceName: this.sourceName };
  }

  protected abstract get sourceName(): string;
  protected abstract get healthCheckUrl(): string;
  protected abstract doScrape(mode?: ReportMode): Promise<T[]>;
}
