import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Scenario } from './config.ts';
import type { OrderAttempt } from './shopper.ts';

export interface RunSummary {
  scenario: string;
  runId: string;
  storeSlug: string;
  baseUrl: string;
  attempted: number;
  placed: number;
  failed: number;
  statuses: Record<string, number>;
  errorCodes: Record<string, number>;
  totalValue: number;
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

  summarize(): RunSummary {
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

    return {
      scenario: this.scenario.name,
      runId: this.runId,
      storeSlug: this.scenario.storeSlug,
      baseUrl: this.scenario.baseUrl,
      attempted: this.attempts.length,
      placed: this.attempts.filter((attempt) => attempt.outcome === 'placed').length,
      failed: this.attempts.filter((attempt) => attempt.outcome === 'failed').length,
      statuses,
      errorCodes,
      totalValue: Math.round(totalValue * 100) / 100,
      durationMs: Math.round(performance.now() - this.startedAt),
    };
  }

  async close(): Promise<RunSummary> {
    const summary = this.summarize();
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
  console.log(`Elapsed    ${(summary.durationMs / 1000).toFixed(1)}s`);
  console.log(`Report     ${reportPath}`);
}

function formatMoney(amount: number | null): string {
  return amount === null ? '—' : amount.toFixed(2);
}
