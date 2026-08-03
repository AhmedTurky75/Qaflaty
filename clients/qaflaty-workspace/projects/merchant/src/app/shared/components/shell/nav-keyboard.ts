/**
 * Arrow-key roving focus for the sidebar surfaces.
 *
 * `Tab` still walks every header and item in order (they are native
 * button/anchor elements); this adds Up/Down/Home/End on top so a keyboard user
 * can traverse a long nav without tabbing through it. `Enter`/`Space` toggling a
 * group header needs no handling — the header is a real <button>.
 */
const FOCUSABLE = '[data-nav-focusable]';

export function handleNavKeydown(event: KeyboardEvent, container: HTMLElement): void {
  const step =
    event.key === 'ArrowDown' ? 1
    : event.key === 'ArrowUp' ? -1
    : event.key === 'Home' ? 'first'
    : event.key === 'End' ? 'last'
    : null;

  if (step === null) return;

  // Only visible entries: a collapsed group's children are `visibility: hidden`
  // and must not receive focus.
  const targets = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden',
  );
  if (!targets.length) return;

  event.preventDefault();

  if (step === 'first') {
    targets[0].focus();
    return;
  }
  if (step === 'last') {
    targets[targets.length - 1].focus();
    return;
  }

  const current = targets.indexOf(document.activeElement as HTMLElement);
  const next = current === -1 ? 0 : (current + step + targets.length) % targets.length;
  targets[next].focus();
}
