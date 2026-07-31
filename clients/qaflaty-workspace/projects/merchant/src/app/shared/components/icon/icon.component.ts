import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A tiny line-icon set rendered as inline SVG (Lucide-style: 24×24, 2px stroke,
 * round caps, `currentColor`). Keeps icons crisp and themeable via `color`,
 * replacing the emoji icons of the old shell. Add new glyphs by extending the
 * @switch in icon.component.html.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  /** Glyph name — see the template's @switch for the supported set. */
  readonly name = input.required<string>();
  /** Pixel size of the square icon. */
  readonly size = input<number>(20);
}
