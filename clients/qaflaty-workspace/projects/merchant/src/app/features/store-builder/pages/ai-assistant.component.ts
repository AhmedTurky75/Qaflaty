import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreContextService } from '../../../core/services/store-context.service';
import { BuilderService } from '../services/builder.service';
import {
  StoreConfigurationDto,
  UpdateStoreConfigurationRequest,
  AiAssistantStatusDto,
  AiKnowledgeRefreshResultDto,
  AiAnalyticsDto,
} from 'shared';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <a [routerLink]="'/store-builder'" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </a>
          <h1 class="text-lg font-semibold text-gray-900">AI Assistant</h1>
        </div>
      </div>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (loading()) {
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
            <p class="text-gray-500">Loading configuration...</p>
          </div>
        }

        @if (loadErr()) {
          <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p class="text-red-700">{{ loadErr() }}</p>
          </div>
        }

        @if (!loading() && localConfig) {
          <div class="space-y-6">
            <!-- Knowledge / status card -->
            <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-base font-semibold text-gray-900">AI Knowledge</h2>
                @if (status() && !status()!.serviceConfigured) {
                  <span class="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Service not configured</span>
                }
              </div>

              @if (status()) {
                <div class="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div class="bg-gray-50 rounded-lg p-3">
                    <p class="text-xl font-semibold text-gray-900">{{ status()!.productsEmbedded }}</p>
                    <p class="text-xs text-gray-500">Products</p>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3">
                    <p class="text-xl font-semibold text-gray-900">{{ status()!.faqItemsEmbedded }}</p>
                    <p class="text-xs text-gray-500">FAQ items</p>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3">
                    <p class="text-xl font-semibold text-gray-900">{{ status()!.storePagesEmbedded }}</p>
                    <p class="text-xs text-gray-500">Store pages</p>
                  </div>
                </div>
                <p class="text-xs text-gray-500 mb-4">
                  @if (status()!.lastRefreshedAtUtc) {
                    Last refreshed: {{ status()!.lastRefreshedAtUtc | date:'medium' }}
                  } @else {
                    Knowledge has not been built yet.
                  }
                </p>
              }

              <button
                (click)="refreshKnowledge()"
                [disabled]="refreshing() || (status() ? !status()!.serviceConfigured : false)"
                class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {{ refreshing() ? 'Refreshing…' : 'Refresh AI Knowledge' }}
              </button>

              @if (refreshResult()) {
                <div class="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                  <p class="font-medium mb-1">Completed successfully</p>
                  <p>Products Embedded: {{ refreshResult()!.productsEmbedded }}</p>
                  <p>FAQ Items Embedded: {{ refreshResult()!.faqItemsEmbedded }}</p>
                  <p>Store Pages Embedded: {{ refreshResult()!.storePagesEmbedded }}</p>
                </div>
              }

              @if (refreshErr()) {
                <p class="mt-4 text-sm text-red-600">{{ refreshErr() }}</p>
              }
            </div>

            <!-- Analytics card -->
            @if (analytics(); as a) {
              <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <h2 class="text-base font-semibold text-gray-900 mb-1">AI Analytics</h2>
                <p class="text-xs text-gray-500 mb-4">Last 30 days</p>

                <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                  <div class="bg-gray-50 rounded-lg p-3 text-center">
                    <p class="text-xl font-semibold text-gray-900">{{ a.conversationsToday }}</p>
                    <p class="text-xs text-gray-500">Conversations today</p>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3 text-center">
                    <p class="text-xl font-semibold text-gray-900">{{ a.cartAdditions }}</p>
                    <p class="text-xs text-gray-500">Cart additions</p>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3 text-center">
                    <p class="text-xl font-semibold text-gray-900">{{ a.ordersPlaced }}</p>
                    <p class="text-xs text-gray-500">Orders placed</p>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3 text-center">
                    <p class="text-xl font-semibold text-gray-900">{{ a.productsRecommended }}</p>
                    <p class="text-xs text-gray-500">Products recommended</p>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3 text-center">
                    <p class="text-xl font-semibold text-gray-900">{{ (a.conversionRate * 100) | number:'1.0-1' }}%</p>
                    <p class="text-xs text-gray-500">Cart conversion</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 class="text-sm font-semibold text-gray-900 mb-2">Top questions</h3>
                    @if (a.topQuestions.length) {
                      <ul class="space-y-1">
                        @for (q of a.topQuestions; track q.question) {
                          <li class="flex items-center justify-between text-sm text-gray-700">
                            <span class="truncate pr-2">{{ q.question }}</span>
                            <span class="text-gray-400">{{ q.count }}</span>
                          </li>
                        }
                      </ul>
                    } @else {
                      <p class="text-sm text-gray-400">No data yet.</p>
                    }
                  </div>

                  <div>
                    <h3 class="text-sm font-semibold text-gray-900 mb-2">Product interest</h3>
                    @if (a.productInterest.length) {
                      <ul class="space-y-1">
                        @for (p of a.productInterest; track p.productId) {
                          <li class="flex items-center justify-between text-sm text-gray-700">
                            <span class="truncate pr-2">{{ p.name }}</span>
                            <span class="text-gray-400">{{ p.count }}</span>
                          </li>
                        }
                      </ul>
                    } @else {
                      <p class="text-sm text-gray-400">No data yet.</p>
                    }
                  </div>
                </div>

                <div class="mt-6">
                  <h3 class="text-sm font-semibold text-gray-900 mb-2">
                    Knowledge gaps
                    <span class="text-gray-400 font-normal">({{ a.knowledgeGaps }})</span>
                  </h3>
                  @if (a.knowledgeGapQuestions.length) {
                    <ul class="space-y-1">
                      @for (g of a.knowledgeGapQuestions; track g) {
                        <li class="text-sm text-amber-700 truncate">• {{ g }}</li>
                      }
                    </ul>
                    <p class="text-xs text-gray-500 mt-2">Questions the assistant couldn't answer — improve your catalog or FAQ to cover these.</p>
                  } @else {
                    <p class="text-sm text-gray-400">No knowledge gaps detected.</p>
                  }
                </div>
              </div>
            }

            <!-- Settings card -->
            <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 class="text-base font-semibold text-gray-900 mb-4">Assistant Settings</h2>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-700">Enable AI Assistant</label>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" [(ngModel)]="localConfig!.aiAssistantSettings.enabled" />
                    <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                  </label>
                </div>

                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-700">Disable human chat while AI is on</label>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" [(ngModel)]="localConfig!.aiAssistantSettings.disableHumanChat" />
                    <div class="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                    <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow"></div>
                  </label>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Assistant Name</label>
                  <input
                    type="text"
                    maxlength="50"
                    [(ngModel)]="localConfig!.aiAssistantSettings.assistantName"
                    placeholder="e.g. Sara"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
                  <textarea
                    rows="2"
                    maxlength="500"
                    [(ngModel)]="localConfig!.aiAssistantSettings.welcomeMessage"
                    placeholder="Hi! How can I help you find the right product today?"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  ></textarea>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Personality</label>
                    <select
                      [(ngModel)]="localConfig!.aiAssistantSettings.personality"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="Friendly">Friendly</option>
                      <option value="Professional">Professional</option>
                      <option value="SalesFocused">Sales Focused</option>
                      <option value="Technical">Technical</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select
                      [(ngModel)]="localConfig!.aiAssistantSettings.language"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="AutoDetect">Auto Detect</option>
                      <option value="Arabic">Arabic</option>
                      <option value="English">English</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Active from (hour, UTC)</label>
                    <input
                      type="number" min="0" max="23"
                      [(ngModel)]="localConfig!.aiAssistantSettings.enabledHoursStart"
                      placeholder="optional"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Active to (hour, UTC)</label>
                    <input
                      type="number" min="0" max="23"
                      [(ngModel)]="localConfig!.aiAssistantSettings.enabledHoursEnd"
                      placeholder="optional"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Max conversation length</label>
                    <input
                      type="number" min="1" max="500"
                      [(ngModel)]="localConfig!.aiAssistantSettings.maxConversationLength"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            @if (saved()) {
              <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p class="text-green-700 text-sm font-medium">Changes saved successfully.</p>
              </div>
            }

            @if (saveErr()) {
              <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p class="text-red-700 text-sm font-medium">{{ saveErr() }}</p>
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
export class AiAssistantComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private builderService = inject(BuilderService);

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  refreshing = signal(false);
  loadErr = signal<string | null>(null);
  saveErr = signal<string | null>(null);
  refreshErr = signal<string | null>(null);
  status = signal<AiAssistantStatusDto | null>(null);
  refreshResult = signal<AiKnowledgeRefreshResultDto | null>(null);
  analytics = signal<AiAnalyticsDto | null>(null);

  localConfig: StoreConfigurationDto | null = null;

  ngOnInit(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) {
      this.loadErr.set('No store selected');
      this.loading.set(false);
      return;
    }

    this.builderService.getConfiguration(storeId).subscribe({
      next: (config) => {
        this.localConfig = JSON.parse(JSON.stringify(config));
        this.loading.set(false);
      },
      error: (err) => {
        this.loadErr.set(err.message || 'Failed to load configuration');
        this.loading.set(false);
      }
    });

    this.loadStatus(storeId);
    this.loadAnalytics(storeId);
  }

  private loadStatus(storeId: string): void {
    this.builderService.getAiAssistantStatus(storeId).subscribe({
      next: (status) => this.status.set(status),
      error: () => { /* status is best-effort */ }
    });
  }

  private loadAnalytics(storeId: string): void {
    this.builderService.getAiAnalytics(storeId).subscribe({
      next: (analytics) => this.analytics.set(analytics),
      error: () => { /* analytics is best-effort */ }
    });
  }

  refreshKnowledge(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId) return;

    this.refreshing.set(true);
    this.refreshErr.set(null);
    this.refreshResult.set(null);

    this.builderService.refreshAiKnowledge(storeId).subscribe({
      next: (result) => {
        this.refreshResult.set(result);
        this.refreshing.set(false);
        this.loadStatus(storeId);
      },
      error: (err) => {
        this.refreshing.set(false);
        this.refreshErr.set(err.error?.message || err.message || 'Failed to refresh AI knowledge');
      }
    });
  }

  save(): void {
    const storeId = this.storeContext.currentStoreId();
    if (!storeId || !this.localConfig) return;

    this.saving.set(true);
    this.saved.set(false);
    this.saveErr.set(null);

    const req: UpdateStoreConfigurationRequest = {
      pageToggles: this.localConfig.pageToggles,
      featureToggles: this.localConfig.featureToggles,
      customerAuthSettings: this.localConfig.customerAuthSettings,
      communicationSettings: this.localConfig.communicationSettings,
      aiAssistantSettings: this.localConfig.aiAssistantSettings,
      localizationSettings: this.localConfig.localizationSettings,
      socialLinks: this.localConfig.socialLinks,
      headerVariant: this.localConfig.headerVariant,
      footerVariant: this.localConfig.footerVariant,
      productCardVariant: this.localConfig.productCardVariant,
      productGridVariant: this.localConfig.productGridVariant,
    };

    this.builderService.updateConfiguration(storeId, req).subscribe({
      next: (config) => {
        this.localConfig = JSON.parse(JSON.stringify(config));
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveErr.set(err.error?.message || err.message || 'Failed to save AI assistant settings');
      }
    });
  }
}
