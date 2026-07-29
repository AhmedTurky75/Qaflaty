import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * The built-in glyphs a merchant can assign to a category when they'd rather not upload an image.
 * Keys are persisted on the category (`iconName`), so renaming one orphans existing categories —
 * add new keys instead. `grid` is the fallback used for unknown/blank names.
 */
export const CATEGORY_ICONS = [
  'grid',
  'bag',
  'shirt',
  'laptop',
  'home',
  'sparkles',
  'dumbbell',
  'book',
  'gift',
  'food',
  'tag',
  'heart',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

/** Lucide-style 24×24 paths, 2px stroke, drawn in `currentColor`. */
const ICON_PATHS: Record<string, string[]> = {
  grid: [
    'M4 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z',
    'M14 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V6z',
    'M4 16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2z',
    'M14 16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2z',
  ],
  bag: ['M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z', 'M3 6h18', 'M16 10a4 4 0 0 1-8 0'],
  shirt: [
    'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z',
  ],
  laptop: ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9H3V5z', 'M2 14h20v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1z'],
  home: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z', 'M9 22V12h6v10'],
  sparkles: [
    'M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z',
    'M19 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z',
  ],
  dumbbell: ['M6.5 6.5v11', 'M17.5 6.5v11', 'M3 9v6', 'M21 9v6', 'M6.5 12h11'],
  book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  gift: [
    'M20 12v10H4V12',
    'M2 7h20v5H2z',
    'M12 22V7',
    'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z',
    'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
  ],
  food: ['M18 8h1a4 4 0 0 1 0 8h-1', 'M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z', 'M6 1v3', 'M10 1v3', 'M14 1v3'],
  tag: ['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z', 'M7 7h.01'],
  heart: [
    'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  ],
};

/**
 * Renders a category's built-in glyph. Unknown or blank names fall back to `grid` so a category
 * always has something to show.
 */
@Component({
  selector: 'lib-category-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @for (d of paths(); track d) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryIconComponent {
  readonly name = input<string | null | undefined>('grid');
  readonly size = input<number>(24);

  protected readonly paths = computed(() => {
    const key = (this.name() ?? '').trim();
    return ICON_PATHS[key] ?? ICON_PATHS['grid'];
  });
}
