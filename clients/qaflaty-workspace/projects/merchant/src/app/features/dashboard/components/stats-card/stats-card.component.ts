import { Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

type StatIcon = 'revenue' | 'orders' | 'products' | 'customers';
type StatColor = 'blue' | 'green' | 'purple' | 'orange';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [TranslocoPipe, IconComponent],
  templateUrl: './stats-card.component.html',
  styleUrl: './stats-card.component.scss',
})
export class StatsCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: string | number;
  @Input() trend?: number;
  @Input() icon: StatIcon = 'revenue';
  @Input() color: StatColor = 'blue';

  Math = Math;

  /** Maps the stat icon to an <app-icon> glyph name. */
  get iconName(): string {
    switch (this.icon) {
      case 'revenue': return 'wallet';
      case 'orders': return 'orders';
      case 'products': return 'products';
      case 'customers': return 'customers';
      default: return 'wallet';
    }
  }

  /** Token-based accent classes for the icon chip (themeable). */
  get accentClasses(): string {
    switch (this.color) {
      case 'green': return 'bg-success/10 text-success';
      case 'orange': return 'bg-warning/10 text-warning';
      case 'purple':
      case 'blue':
      default: return 'bg-primary-tint text-primary';
    }
  }
}
