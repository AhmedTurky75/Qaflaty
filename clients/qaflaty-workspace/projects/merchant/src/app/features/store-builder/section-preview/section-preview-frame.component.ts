import {
  AfterViewInit, Component, ElementRef, OnDestroy, computed, effect, inject, input, signal
} from '@angular/core';

/**
 * Fixed-ratio, non-interactive window onto a full-size section rendering.
 *
 * The projected content is laid out at `DESIGN_WIDTH` (a real desktop width) and
 * scaled down with `transform: scale()`, so a miniature is the same markup as
 * the full-size block rather than a separate small-screen design. Pointer events
 * are off, so nothing inside can be clicked, focused or dragged by itself.
 */
@Component({
  selector: 'app-section-preview-frame',
  standalone: true,
  template: `
    <div class="qf-frame" [style.height.px]="frameHeight()" aria-hidden="true">
      <div class="qf-scaled" [style.width.px]="designWidth" [style.transform]="'scale(' + scale() + ')'">
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .qf-frame {
      position: relative;
      width: 100%;
      overflow: hidden;
      pointer-events: none;
      user-select: none;
      background: #fff;
    }
    .qf-scaled {
      position: absolute;
      inset-inline-start: 0;
      top: 0;
      transform-origin: top left;
    }
    /* Miniatures always read left-to-right regardless of dashboard direction. */
    :host { direction: ltr; }
  `]
})
export class SectionPreviewFrameComponent implements AfterViewInit, OnDestroy {
  /** width : height of the visible window. */
  aspect = input<number>(16 / 9);
  /** Hard cap so tall sections do not dominate the panel. */
  maxHeight = input<number>(280);

  readonly designWidth = 1200;

  private host = inject(ElementRef<HTMLElement>);
  private observer: ResizeObserver | null = null;
  private hostWidth = signal(0);

  scale = computed(() => {
    const width = this.hostWidth();
    return width > 0 ? width / this.designWidth : 0;
  });

  frameHeight = computed(() => {
    const width = this.hostWidth();
    if (width <= 0) return 0;
    return Math.min(width / this.aspect(), this.maxHeight());
  });

  constructor() {
    // Keep the wrapper's own height in sync so surrounding layout never jumps.
    effect(() => {
      const height = this.frameHeight();
      (this.host.nativeElement as HTMLElement).style.minHeight = height ? `${height}px` : '';
    });
  }

  ngAfterViewInit(): void {
    const el = this.host.nativeElement as HTMLElement;
    this.hostWidth.set(el.clientWidth);

    if (typeof ResizeObserver === 'undefined') return;
    this.observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.hostWidth.set(entry.contentRect.width);
      }
    });
    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}
