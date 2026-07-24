import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../../core/services/store-context.service';
import { BuilderService } from '../services/builder.service';
import { PaymentMethodAdjustment, PaymentMethodOptionDto } from 'shared';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './payment-methods.component.html',
  styleUrl: './payment-methods.component.scss'
})
export class PaymentMethodsComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private builderService = inject(BuilderService);

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  loadErr = signal<string | null>(null);
  saveErr = signal<string | null>(null);
  adjustments = signal<PaymentMethodAdjustment[]>([]);

  ngOnInit(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) {
      this.loadErr.set('No store selected');
      this.loading.set(false);
      return;
    }

    forkJoin({
      options: this.builderService.getPaymentMethodOptions(),
      config: this.builderService.getConfiguration(storeId),
    }).subscribe({
      next: ({ options, config }) => {
        const stored = new Map(
          (config.paymentMethodAdjustments ?? []).map((a: PaymentMethodAdjustment) => [a.paymentMethod, a])
        );
        this.adjustments.set(
          options.map((opt: PaymentMethodOptionDto) => {
            const existing = stored.get(opt.key);
            return existing
              ? { ...existing }
              : {
                  id: crypto.randomUUID(),
                  paymentMethod: opt.key,
                  adjustmentType: 'Fixed',
                  value: 0,
                  isEnabled: false,
                  defaultLabel: opt.defaultLabel,
                  defaultDescription: opt.defaultDescription,
                };
          })
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.loadErr.set(err.message || 'Failed to load payment methods');
        this.loading.set(false);
      }
    });
  }

  save(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;
    this.saving.set(true);
    this.saved.set(false);
    this.saveErr.set(null);

    const adjustments = this.adjustments().map(a => ({
      paymentMethod: a.paymentMethod,
      adjustmentType: a.adjustmentType,
      value: a.value,
      displayLabel: a.displayLabel,
      isEnabled: a.isEnabled,
    }));

    this.builderService.setPaymentAdjustments(storeId, { adjustments }).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveErr.set(err.message || 'Failed to save payment methods');
      }
    });
  }
}
