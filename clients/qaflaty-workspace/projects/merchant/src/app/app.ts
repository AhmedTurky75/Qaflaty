import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { DirectionService } from './core/services/direction.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('merchant');

  private readonly theme = inject(ThemeService);
  private readonly direction = inject(DirectionService);

  constructor() {
    // Apply the persisted theme + language/direction/text-size on startup.
    this.theme.init();
    this.direction.init();
  }
}
