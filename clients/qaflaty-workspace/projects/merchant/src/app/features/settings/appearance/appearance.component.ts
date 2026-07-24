import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ThemeService, Theme, TextSize } from '../../../core/services/theme.service';
import { DirectionService, Language } from '../../../core/services/direction.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface PalettePreview {
  id: Theme;
  rail: string;
  surface: string;
  canvas: string;
  primary: string;
  text: string;
}

/**
 * Settings ▸ Appearance: the theme picker (nine named palettes shown as live
 * mini-previews with a tick on the active one — no hex, no sliders), plus the
 * language toggle and text-size control. All state lives in ThemeService /
 * DirectionService (persisted to localStorage), so switching is instant.
 */
@Component({
  selector: 'app-appearance',
  standalone: true,
  imports: [TranslocoPipe, IconComponent],
  templateUrl: './appearance.component.html',
  styleUrl: './appearance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppearanceComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly direction = inject(DirectionService);

  /** Representative colours per palette for the live preview cards (from Design System §02). */
  protected readonly previews: PalettePreview[] = [
    { id: 'blue', rail: '#16233d', surface: '#ffffff', canvas: '#f4f5f7', primary: '#2563eb', text: '#16181d' },
    { id: 'light', rail: '#1e2536', surface: '#ffffff', canvas: '#f4f5f7', primary: '#4f46e5', text: '#16181d' },
    { id: 'slate', rail: '#0f1218', surface: '#1d212a', canvas: '#14171d', primary: '#6366f1', text: '#eef1f6' },
    { id: 'grey', rail: '#24282f', surface: '#ffffff', canvas: '#f3f4f6', primary: '#4b5563', text: '#1c1f24' },
    { id: 'purple', rail: '#241a3c', surface: '#ffffff', canvas: '#f6f4fb', primary: '#7c3aed', text: '#1e1a29' },
    { id: 'amber', rail: '#2a2010', surface: '#ffffff', canvas: '#faf7f1', primary: '#b45309', text: '#241f16' },
    { id: 'emerald', rail: '#0f241d', surface: '#ffffff', canvas: '#f2f7f4', primary: '#059669', text: '#16211c' },
    { id: 'teal', rail: '#0c2320', surface: '#ffffff', canvas: '#f1f7f6', primary: '#0d9488', text: '#142320' },
    { id: 'rose', rail: '#2a1018', surface: '#ffffff', canvas: '#faf3f4', primary: '#be123c', text: '#241318' },
  ];

  protected selectTheme(id: Theme): void {
    this.theme.set(id);
  }

  protected selectLang(lang: Language): void {
    this.direction.setLang(lang);
  }

  protected selectTextSize(size: TextSize): void {
    this.theme.setTextSize(size);
  }
}
