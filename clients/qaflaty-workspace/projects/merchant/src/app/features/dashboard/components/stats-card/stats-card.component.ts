import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-600 mb-1">{{ title }}</p>
          <p class="text-2xl font-bold text-gray-900">{{ value }}</p>
          @if (trend !== undefined && trend !== null) {
            <div class="flex items-center mt-2">
              @if (trend > 0) {
                <svg class="h-4 w-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span class="text-sm font-medium text-green-600">{{ trend }}%</span>
              } @else if (trend < 0) {
                <svg class="h-4 w-4 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span class="text-sm font-medium text-red-600">{{ Math.abs(trend) }}%</span>
              } @else {
                <span class="text-sm font-medium text-gray-500">0%</span>
              }
              <span class="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          }
        </div>
        <div [class]="iconContainerClass">
          <svg class="h-6 w-6" [class]="iconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="iconPath" />
          </svg>
        </div>
      </div>
    </div>
  `
})
export class StatsCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: string | number;
  @Input() trend?: number;
  @Input() icon: 'revenue' | 'orders' | 'products' | 'customers' = 'revenue';
  @Input() color: 'blue' | 'green' | 'purple' | 'orange' = 'blue';

  Math = Math;

  get iconPath(): string {
    switch (this.icon) {
      case 'revenue':
        return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'orders':
        return 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z';
      case 'products':
        return 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4';
      case 'customers':
        return 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z';
      default:
        return '';
    }
  }

  get iconContainerClass(): string {
    const baseClass = 'flex items-center justify-center h-12 w-12 rounded-lg';
    switch (this.color) {
      case 'blue':
        return `${baseClass} bg-blue-100`;
      case 'green':
        return `${baseClass} bg-green-100`;
      case 'purple':
        return `${baseClass} bg-purple-100`;
      case 'orange':
        return `${baseClass} bg-orange-100`;
      default:
        return `${baseClass} bg-blue-100`;
    }
  }

  get iconClass(): string {
    switch (this.color) {
      case 'blue':
        return 'text-blue-600';
      case 'green':
        return 'text-green-600';
      case 'purple':
        return 'text-purple-600';
      case 'orange':
        return 'text-orange-600';
      default:
        return 'text-blue-600';
    }
  }
}
