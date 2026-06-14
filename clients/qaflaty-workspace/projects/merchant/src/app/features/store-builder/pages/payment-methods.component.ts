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
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <a [routerLink]="'/store-builder'" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </a>
          <h1 class="text-lg font-semibold text-gray-900">Payment Methods</h1>
        </div>
      </div>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (loading()) {
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
            <p class="text-gray-500">Loading payment methods...</p>
          </div>
        }

        @if (loadErr()) {
          <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p class="text-red-700">{{ loadErr() }}</p>
          </div>
        }

        @if (!loading() && !loadErr()) {
          <div class="space-y-6">
            <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <div class="mb-1">
                <h2 class="text-base font-semibold text-gray-900">Configure Payment Methods</h2>
                <p class="text-sm text-gray-500 mt-0.5">Enable methods and optionally add a fee or discount</p>
              </div>

              <div class="mt-4 space-y-3">
                @for (adj of adjustments(); track adj.paymentMethod) {
                  <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex items-center gap-3">
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" [(ngModel)]="adj.isEnabled" />
                        <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                        <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                      </label>
                      <span class="text-sm font-semibold text-gray-900 flex-1">{{ adj.defaultLabel }}</span>
                    </div>

                    @if (adj.isEnabled) {
                      <div class="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                        <div>
                          <label class="block text-xs text-gray-500 mb-1">Fee Type</label>
                          <select
                            [(ngModel)]="adj.adjustmentType"
                            class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                          >
                            <option value="Fixed">Fixed Amount</option>
                            <option value="Percentage">Percentage (%)</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-xs text-gray-500 mb-1">Value <span class="text-gray-400">(negative = discount)</span></label>
                          <input
                            type="number"
                            [(ngModel)]="adj.value"
                            step="0.01"
                            placeholder="0"
                            class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                          />
                        </div>
                        <div class="col-span-2">
                          <label class="block text-xs text-gray-500 mb-1">Display Label (optional)</label>
                          <input
                            type="text"
                            [(ngModel)]="adj.displayLabel"
                            placeholder="e.g. COD fee +20 SAR"
                            class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                          />
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            @if (saved()) {
              <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p class="text-green-700 text-sm font-medium">Payment methods saved successfully.</p>
              </div>
            }
            @if (saveErr()) {
              <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p class="text-red-700 text-sm">{{ saveErr() }}</p>
              </div>
            }

            <div class="flex justify-end">
              <button
                (click)="save()"
                [disabled]="saving()"
                class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {{ saving() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
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
