import type { Scenario } from './config.ts';
import type { RunReport } from './report.ts';
import { placeOneOrder, type JourneyContext, type OrderAttempt } from './shopper.ts';

export interface RunOutcome {
  attempted: number;
  aborted: boolean;
  abortReason: string | null;
}

/** Below this many attempts, one or two unlucky failures shouldn't trip the breaker. */
const ABORT_MIN_ATTEMPTS = 10;
const ABORT_FAILURE_RATE = 0.5;

/**
 * Runs `scenario.orders` shoppers through `concurrency` workers at once, each worker picking up
 * the next order index as soon as it finishes its last one — not a fixed batch-of-N-then-wait.
 *
 * Ramp-up staggers each worker's *first* order only, spread evenly across `rampUpSeconds`; a
 * worker's later orders start back-to-back (pacing think-time aside), the same as a checkout
 * counter that opens on a schedule but then serves its own line at its own pace.
 *
 * A crude circuit breaker stops the run early once most attempts are failing, so a broken store
 * doesn't get hammered with hundreds of orders that were never going to succeed.
 */
export async function runOrders(
  scenario: Scenario,
  context: JourneyContext,
  report: RunReport,
  onAttempt: (attempt: OrderAttempt) => void,
): Promise<RunOutcome> {
  const total = scenario.orders;
  const concurrency = Math.max(1, Math.min(scenario.concurrency, total));

  let nextIndex = 1;
  let completed = 0;
  let failures = 0;
  let aborted = false;
  let abortReason: string | null = null;

  const takeNext = (): number | null => {
    if (aborted || nextIndex > total) return null;
    return nextIndex++;
  };

  const worker = async (workerId: number): Promise<void> => {
    if (concurrency > 1 && scenario.rampUpSeconds > 0) {
      const startDelayMs = (scenario.rampUpSeconds * 1000 * workerId) / concurrency;
      await sleep(startDelayMs);
    }

    let index = takeNext();
    while (index !== null) {
      const attempt = await placeOneOrder(context, index);
      await report.record(attempt);
      onAttempt(attempt);

      completed += 1;
      if (attempt.outcome === 'failed') failures += 1;

      if (!aborted && completed >= ABORT_MIN_ATTEMPTS && failures / completed >= ABORT_FAILURE_RATE) {
        aborted = true;
        abortReason =
          `${failures}/${completed} orders failed (≥${Math.round(ABORT_FAILURE_RATE * 100)}%) — ` +
          'stopping early rather than placing more orders that are unlikely to succeed. ' +
          'Check the error codes above.';
      }

      index = takeNext();
    }
  };

  await Promise.all(Array.from({ length: concurrency }, (_unused, workerId) => worker(workerId)));

  return { attempted: completed, aborted, abortReason };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
