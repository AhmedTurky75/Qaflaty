import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesChartData } from '../../services/dashboard.service';

interface ChartBar {
  x: number;
  y: number;
  height: number;
  width: number;
  value: number;
  label: string;
}

@Component({
  selector: 'app-sales-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Sales Overview</h3>
        <div class="flex space-x-2">
          <button
            (click)="onPeriodChange(7)"
            [class]="period === 7 ? 'px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md' : 'px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md'"
          >
            7 Days
          </button>
          <button
            (click)="onPeriodChange(30)"
            [class]="period === 30 ? 'px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md' : 'px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md'"
          >
            30 Days
          </button>
        </div>
      </div>

      @if (data && data.length > 0) {
        <div class="relative" style="height: 300px;">
          <svg class="w-full h-full">
            <!-- Y-axis grid lines -->
            @for (tick of yAxisTicks; track tick) {
              <line
                [attr.x1]="padding.left"
                [attr.y1]="getYPosition(tick)"
                [attr.x2]="chartWidth - padding.right"
                [attr.y2]="getYPosition(tick)"
                class="stroke-gray-200"
                stroke-width="1"
              />
              <text
                [attr.x]="padding.left - 10"
                [attr.y]="getYPosition(tick) + 4"
                class="text-xs fill-gray-500"
                text-anchor="end"
              >
                {{ formatCurrency(tick) }}
              </text>
            }

            <!-- Bars -->
            @for (bar of bars; track bar.label) {
              <g>
                <rect
                  [attr.x]="bar.x"
                  [attr.y]="bar.y"
                  [attr.width]="bar.width"
                  [attr.height]="bar.height"
                  class="fill-blue-500 hover:fill-blue-600 transition-colors cursor-pointer"
                  [attr.rx]="4"
                  (mouseenter)="hoveredBar = bar"
                  (mouseleave)="hoveredBar = null"
                />
                <!-- X-axis labels -->
                <text
                  [attr.x]="bar.x + bar.width / 2"
                  [attr.y]="chartHeight - padding.bottom + 20"
                  class="text-xs fill-gray-600"
                  text-anchor="middle"
                >
                  {{ bar.label }}
                </text>
              </g>
            }

            <!-- Hover tooltip -->
            @if (hoveredBar) {
              <g>
                <rect
                  [attr.x]="hoveredBar.x + hoveredBar.width / 2 - 40"
                  [attr.y]="hoveredBar.y - 35"
                  width="80"
                  height="30"
                  class="fill-gray-900"
                  rx="4"
                  opacity="0.9"
                />
                <text
                  [attr.x]="hoveredBar.x + hoveredBar.width / 2"
                  [attr.y]="hoveredBar.y - 15"
                  class="text-xs fill-white font-medium"
                  text-anchor="middle"
                >
                  {{ formatCurrency(hoveredBar.value) }}
                </text>
              </g>
            }
          </svg>
        </div>
      } @else {
        <div class="flex items-center justify-center h-64 text-gray-500">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p class="mt-2 text-sm">No sales data available</p>
          </div>
        </div>
      }
    </div>
  `
})
export class SalesChartComponent implements OnChanges {
  @Input() data: SalesChartData[] = [];
  @Input() period: 7 | 30 = 7;
  @Output() periodChange = new EventEmitter<7 | 30>();

  chartWidth = 800;
  chartHeight = 300;
  padding = { top: 20, right: 20, bottom: 40, left: 60 };
  bars: ChartBar[] = [];
  yAxisTicks: number[] = [];
  hoveredBar: ChartBar | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.updateChart();
    }
  }

  onPeriodChange(period: 7 | 30): void {
    this.period = period;
    this.periodChange.emit(period);
  }

  private updateChart(): void {
    if (!this.data || this.data.length === 0) {
      this.bars = [];
      this.yAxisTicks = [];
      return;
    }

    const maxRevenue = Math.max(...this.data.map(d => d.revenue));
    const chartHeight = this.chartHeight - this.padding.top - this.padding.bottom;
    const chartWidth = this.chartWidth - this.padding.left - this.padding.right;
    const barWidth = Math.min(40, chartWidth / this.data.length - 10);
    const spacing = (chartWidth - (barWidth * this.data.length)) / (this.data.length + 1);

    // Calculate Y-axis ticks
    const tickCount = 5;
    const tickStep = Math.ceil(maxRevenue / tickCount);
    this.yAxisTicks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickStep);

    // Create bars
    this.bars = this.data.map((item, index) => {
      const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * chartHeight : 0;
      const x = this.padding.left + spacing + (index * (barWidth + spacing));
      const y = this.padding.top + (chartHeight - height);

      return {
        x,
        y,
        height,
        width: barWidth,
        value: item.revenue,
        label: this.formatDate(item.date)
      };
    });
  }

  getYPosition(value: number): number {
    const maxRevenue = Math.max(...this.data.map(d => d.revenue));
    const chartHeight = this.chartHeight - this.padding.top - this.padding.bottom;
    if (maxRevenue === 0) return this.padding.top + chartHeight;
    const ratio = value / maxRevenue;
    return this.padding.top + (chartHeight - (ratio * chartHeight));
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatCurrency(amount: number): string {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(0);
  }
}
