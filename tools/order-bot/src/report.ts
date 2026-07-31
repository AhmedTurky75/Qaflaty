import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Scenario } from './config.ts';
import type { OrderAttempt } from './shopper.ts';

export interface RunSummary {
  scenario: string;
  runId: string;
  storeSlug: string;
  baseUrl: string;
  concurrency: number;
  pacing: string;
  aborted: boolean;
  abortReason: string | null;
  attempted: number;
  placed: number;
  failed: number;
  statuses: Record<string, number>;
  errorCodes: Record<string, number>;
  totalValue: number;
  /** End-to-end duration per order (all steps, including pacing think-time), not per HTTP call. */
  latencyMs: { p50: number; p95: number; p99: number };
  ordersPerSecond: number;
  durationMs: number;
}

export class RunReport {
  private scenario: Scenario;
  private runId: string;
  private directory: string;
  private attempts: OrderAttempt[] = [];
  private startedAt = performance.now();

  constructor(scenario: Scenario, runId: string, runsRoot: string) {
    this.scenario = scenario;
    this.runId = runId;
    this.directory = join(runsRoot, `${runId}-${scenario.name}`);
  }

  async open(): Promise<void> {
    await mkdir(this.directory, { recursive: true });
  }

  async record(attempt: OrderAttempt): Promise<void> {
    this.attempts.push(attempt);
    await appendFile(join(this.directory, 'orders.jsonl'), `${JSON.stringify(attempt)}\n`, 'utf8');
  }

  summarize(aborted: boolean, abortReason: string | null): RunSummary {
    const statuses: Record<string, number> = {};
    const errorCodes: Record<string, number> = {};
    let totalValue = 0;

    for (const attempt of this.attempts) {
      if (attempt.outcome === 'placed') {
        const status = attempt.status ?? 'Unknown';
        statuses[status] = (statuses[status] ?? 0) + 1;
        totalValue += attempt.total ?? 0;
      } else {
        const code = attempt.error?.code ?? 'BotError';
        errorCodes[code] = (errorCodes[code] ?? 0) + 1;
      }
    }

    const durations = this.attempts.map((attempt) => attempt.durationMs).sort((a, b) => a - b);
    const elapsedMs = Math.round(performance.now() - this.startedAt);

    return {
      scenario: this.scenario.name,
      runId: this.runId,
      storeSlug: this.scenario.storeSlug,
      baseUrl: this.scenario.baseUrl,
      concurrency: this.scenario.concurrency,
      pacing: this.scenario.pacing,
      aborted,
      abortReason,
      attempted: this.attempts.length,
      placed: this.attempts.filter((attempt) => attempt.outcome === 'placed').length,
      failed: this.attempts.filter((attempt) => attempt.outcome === 'failed').length,
      statuses,
      errorCodes,
      totalValue: Math.round(totalValue * 100) / 100,
      latencyMs: {
        p50: Math.round(percentile(durations, 0.5)),
        p95: Math.round(percentile(durations, 0.95)),
        p99: Math.round(percentile(durations, 0.99)),
      },
      ordersPerSecond:
        elapsedMs > 0 ? Math.round((this.attempts.length / (elapsedMs / 1000)) * 100) / 100 : 0,
      durationMs: elapsedMs,
    };
  }

  async close(aborted = false, abortReason: string | null = null): Promise<RunSummary> {
    const summary = this.summarize(aborted, abortReason);
    await writeFile(
      join(this.directory, 'summary.json'),
      `${JSON.stringify(summary, null, 2)}\n`,
      'utf8',
    );
    return summary;
  }

  get path(): string {
    return this.directory;
  }
}

export function printAttempt(attempt: OrderAttempt): void {
  const label = `#${String(attempt.index).padStart(3, ' ')}`;
  const itemSummary = attempt.items
    .map((item) => `${item.quantity}× ${item.productName}`)
    .join(', ');

  if (attempt.outcome === 'placed') {
    const otp = attempt.otpVerified ? ' otp✓' : '';
    console.log(
      `  ${label} ok   ${attempt.orderNumber} ${attempt.status}${otp} ` +
        `${formatMoney(attempt.total)} — ${itemSummary} (${Math.round(attempt.durationMs)}ms)`,
    );
    return;
  }

  const error = attempt.error;
  console.log(
    `  ${label} FAIL ${error?.step ?? '?'} → ${error?.code ?? '?'} (HTTP ${error?.status ?? '?'})`,
  );
  console.log(`       ${error?.detail ?? 'no detail'}`);
}

export function printSummary(summary: RunSummary, reportPath: string): void {
  console.log('');
  console.log(`Scenario   ${summary.scenario}  (run ${summary.runId})`);
  console.log(`Target     ${summary.baseUrl}  store '${summary.storeSlug}'`);
  console.log(`Workers    ${summary.concurrency} concurrent, pacing '${summary.pacing}'`);

  if (summary.aborted) {
    console.log(`Aborted    ${summary.abortReason ?? 'stopped early'}`);
  }

  console.log(`Orders     ${summary.placed} placed / ${summary.attempted} attempted`);

  const statuses = Object.entries(summary.statuses);
  if (statuses.length > 0) {
    console.log(`Statuses   ${statuses.map(([key, count]) => `${key}=${count}`).join('  ')}`);
  }

  const errors = Object.entries(summary.errorCodes);
  if (errors.length > 0) {
    console.log(`Errors     ${errors.map(([key, count]) => `${key}=${count}`).join('  ')}`);
  }

  console.log(`Value      ${formatMoney(summary.totalValue)}`);
  console.log(
    `Latency    p50=${summary.latencyMs.p50}ms  p95=${summary.latencyMs.p95}ms  p99=${summary.latencyMs.p99}ms` +
      `  (${summary.ordersPerSecond} orders/sec)`,
  );
  console.log(`Elapsed    ${(summary.durationMs / 1000).toFixed(1)}s`);
  console.log(`Report     ${reportPath}`);
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(sortedValues.length - 1, Math.floor(p * sortedValues.length));
  return sortedValues[index]!;
}

function formatMoney(amount: number | null): string {
  return amount === null ? '—' : amount.toFixed(2);
}
