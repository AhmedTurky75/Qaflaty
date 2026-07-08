import { Component, input, computed, signal, viewChild, ElementRef, effect, OnDestroy } from '@angular/core';
import { SectionSettings } from 'shared';

/**
 * Wraps every rendered section and applies its `settingsJson` (background,
 * spacing, max-width, radius, device visibility, anchor id, scroll animation).
 *
 * Device visibility uses real responsive CSS classes (`hidden md:block` /
 * `md:hidden`) rather than JS so hidden-on-mobile content stays crawlable for
 * SEO and works under SSR.
 *
 * Class maps use full literal Tailwind strings so the JIT content scanner
 * (which globs every .ts source file) keeps them in the final stylesheet.
 */
@Component({
  selector: 'app-section-wrapper',
  standalone: true,
  template: `
    <div #outer [id]="anchorId() || null" [class]="outerClasses()" [class.qf-in]="animatedIn()" [style]="outerStyles()">
      @if (innerClasses()) {
        <div [class]="innerClasses()">
          <ng-content />
        </div>
      } @else {
        <ng-content />
      }
    </div>
  `,
  styles: [`
    .qf-anim { opacity: 0; transition: opacity .6s ease, transform .6s ease; will-change: opacity, transform; }
    .qf-slide-up { transform: translateY(28px); }
    .qf-slide-left { transform: translateX(28px); }
    .qf-zoom { transform: scale(.96); }
    .qf-in { opacity: 1 !important; transform: none !important; }
    @media (prefers-reduced-motion: reduce) {
      .qf-anim { opacity: 1 !important; transform: none !important; transition: none !important; }
    }
  `]
})
export class SectionWrapperComponent implements OnDestroy {
  /** Raw `settingsJson` string straight off the section DTO. */
  settingsJson = input<string | null | undefined>(undefined);

  private outerEl = viewChild<ElementRef<HTMLElement>>('outer');
  animatedIn = signal(false);
  private observer: IntersectionObserver | null = null;

  constructor() {
    // Attach an IntersectionObserver once the element exists and an animation is set.
    effect(() => {
      const el = this.outerEl()?.nativeElement;
      const anim = this.settings().animation;
      this.observer?.disconnect();
      this.observer = null;
      this.animatedIn.set(false);

      if (!el || !anim || anim === 'none') { this.animatedIn.set(true); return; }
      if (typeof IntersectionObserver === 'undefined') { this.animatedIn.set(true); return; }

      this.observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.animatedIn.set(true);
            this.observer?.disconnect();
            this.observer = null;
          }
        }
      }, { threshold: 0.12 });
      this.observer.observe(el);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private settings = computed<SectionSettings>(() => {
    const raw = this.settingsJson();
    if (!raw) return {};
    try { return JSON.parse(raw) as SectionSettings; }
    catch { return {}; }
  });

  private readonly visibilityClasses: Record<string, string> = {
    all: '',
    desktop: 'hidden md:block',
    mobile: 'block md:hidden'
  };

  private readonly paddingYClasses: Record<string, string> = {
    none: 'py-0',
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-16',
    xl: 'py-24'
  };

  private readonly paddingXClasses: Record<string, string> = {
    none: 'px-0',
    sm: 'px-2',
    md: 'px-4',
    lg: 'px-8'
  };

  private readonly maxWidthClasses: Record<string, string> = {
    full: 'w-full',
    wide: 'max-w-7xl mx-auto w-full',
    narrow: 'max-w-3xl mx-auto w-full'
  };

  private readonly radiusClasses: Record<string, string> = {
    none: '',
    sm: 'rounded overflow-hidden',
    md: 'rounded-lg overflow-hidden',
    lg: 'rounded-xl overflow-hidden',
    '2xl': 'rounded-2xl overflow-hidden'
  };

  private readonly animationClasses: Record<string, string> = {
    none: '',
    fade: 'qf-anim',
    'slide-up': 'qf-anim qf-slide-up',
    'slide-left': 'qf-anim qf-slide-left',
    zoom: 'qf-anim qf-zoom'
  };

  anchorId = computed(() => this.settings().anchorId?.trim() || null);

  private cls(map: Record<string, string>, key: string | undefined): string {
    return (key && map[key]) || '';
  }

  outerClasses = computed(() => {
    const s = this.settings();
    const parts = [
      this.cls(this.visibilityClasses, s.visibility),
      this.cls(this.radiusClasses, s.borderRadius),
      this.cls(this.animationClasses, s.animation),
      s.backgroundImageUrl ? 'bg-cover bg-center bg-no-repeat' : ''
    ];
    return parts.filter(Boolean).join(' ').trim();
  });

  outerStyles = computed(() => {
    const s = this.settings();
    const styles: string[] = [];
    if (s.backgroundColor) styles.push(`background-color:${s.backgroundColor}`);
    if (s.backgroundImageUrl) styles.push(`background-image:url('${s.backgroundImageUrl.replace(/'/g, "%27")}')`);
    if (s.textColor) styles.push(`color:${s.textColor}`);
    return styles.join(';');
  });

  /**
   * Inner container carries max-width + padding. Only rendered when at least one
   * of those is set, so sections with no layout settings render exactly as
   * before (no extra wrapper, no double padding).
   */
  innerClasses = computed(() => {
    const s = this.settings();
    const parts = [
      this.cls(this.maxWidthClasses, s.maxWidth),
      this.cls(this.paddingYClasses, s.paddingY),
      this.cls(this.paddingXClasses, s.paddingX)
    ];
    return parts.filter(Boolean).join(' ').trim();
  });
}
