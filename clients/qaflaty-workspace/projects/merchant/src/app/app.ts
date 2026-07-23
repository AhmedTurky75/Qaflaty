import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService, Theme } from './core/services/theme.service';
import { DirectionService } from './core/services/direction.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('merchant');

  // Exposed for the temporary Phase-1 theme proof widget (removed in later phases).
  protected readonly theme = inject(ThemeService);
  protected readonly direction = inject(DirectionService);
  protected readonly proofOpen = signal(false);

  constructor() {
    // Apply the persisted theme + language/direction on startup.
    this.theme.init();
    this.direction.init();
  }

  protected setTheme(t: string): void {
    this.theme.set(t as Theme);
  }
}
