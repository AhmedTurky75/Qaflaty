import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { SalesChartData } from '../../services/dashboard.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

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
  imports: [TranslocoPipe, IconComponent],
  templateUrl: './sales-chart.component.html',
  styleUrl: './sales-chart.component.scss',
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

  /** Revenue value at the top of the Y axis. Never 0, so the axis always has a usable scale. */
  private axisMax = 1;

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

    // Calculate Y-axis ticks. A period with no revenue yet is a real, common state (a new store, or
    // orders that have not reached Delivered), and it still gets a labelled axis: without a floor
    // the step would be 0 and every tick would collapse onto the same value.
    const tickCount = 5;
    const tickStep = Math.max(1, Math.ceil(maxRevenue / tickCount));
    this.axisMax = tickStep * tickCount;
    this.yAxisTicks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickStep);

    // Create bars
    this.bars = this.data.map((item, index) => {
      const height = (item.revenue / this.axisMax) * chartHeight;
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
    const chartHeight = this.chartHeight - this.padding.top - this.padding.bottom;
    const ratio = value / this.axisMax;
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
