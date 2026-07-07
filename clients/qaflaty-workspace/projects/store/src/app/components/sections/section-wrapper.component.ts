import { Component, input, computed } from '@angular/core';
import { SectionSettings } from 'shared';

/**
 * Wraps every rendered section and applies its `settingsJson` (background,
 * spacing, max-width, radius, device visibility, anchor id).
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
    <div [id]="anchorId() || null" [class]="outerClasses()" [style]="outerStyles()">
      @if (innerClasses()) {
        <div [class]="innerClasses()">
          <ng-content />
        </div>
      } @else {
        <ng-content />
      }
    </div>
  `
})
export class SectionWrapperComponent {
  /** Raw `settingsJson` string straight off the section DTO. */
  settingsJson = input<string | null | undefined>(undefined);

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

  anchorId = computed(() => this.settings().anchorId?.trim() || null);

  private cls(map: Record<string, string>, key: string | undefined): string {
    return (key && map[key]) || '';
  }

  outerClasses = computed(() => {
    const s = this.settings();
    const parts = [
      this.cls(this.visibilityClasses, s.visibility),
      this.cls(this.radiusClasses, s.borderRadius),
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
