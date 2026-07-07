import { Component, input, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { I18nService } from '../../../services/i18n.service';
import { SectionConfigurationDto } from 'shared';

/**
 * Countdown timer. Content model:
 *   { endsAt (ISO), title:{en,ar}, labels:{days,hours,minutes,seconds}, expiredBehavior:'hide'|'message', expiredText:{en,ar} }
 * Ticks client-side once per second; an urgency driver for landing pages.
 */
@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="py-8 px-4 text-center">
        @if (title()) {
          <h3 class="text-lg md:text-xl font-semibold text-gray-900 mb-4">{{ title() }}</h3>
        }
        @if (expired()) {
          <p class="text-gray-600">{{ expiredText() }}</p>
        } @else {
          <div class="flex items-center justify-center gap-3 md:gap-4">
            @for (unit of units(); track unit.key) {
              <div class="flex flex-col items-center">
                <div class="min-w-[3.5rem] md:min-w-[4.5rem] px-2 py-3 rounded-xl bg-[var(--primary-color)] text-white text-2xl md:text-4xl font-bold tabular-nums">
                  {{ unit.value }}
                </div>
                <span class="mt-2 text-xs md:text-sm text-gray-500">{{ unit.label }}</span>
              </div>
            }
          </div>
        }
      </div>
    }
  `
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  config = input.required<SectionConfigurationDto>();
  private i18n = inject(I18nService);

  private now = signal(Date.now());
  private timerId: ReturnType<typeof setInterval> | null = null;

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  private endsAtMs = computed(() => {
    const raw = this.content().endsAt;
    const t = raw ? Date.parse(raw) : NaN;
    return isNaN(t) ? 0 : t;
  });

  private remaining = computed(() => Math.max(0, this.endsAtMs() - this.now()));
  expired = computed(() => this.endsAtMs() > 0 && this.remaining() === 0);

  title = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.title?.ar : c.title?.en) || '';
  });

  expiredText = computed(() => {
    const c = this.content();
    return (this.i18n.currentLanguage() === 'ar' ? c.expiredText?.ar : c.expiredText?.en) || 'Offer ended';
  });

  /** Hide the whole section when expired and behavior is 'hide'. */
  visible = computed(() => {
    if (!this.endsAtMs()) return false;
    if (this.expired() && this.content().expiredBehavior === 'hide') return false;
    return true;
  });

  units = computed(() => {
    const ms = this.remaining();
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const labels = this.content().labels || {};
    const ar = this.i18n.currentLanguage() === 'ar';
    const pad = (n: number) => String(n).padStart(2, '0');
    return [
      { key: 'days', value: pad(days), label: labels.days || (ar ? 'يوم' : 'Days') },
      { key: 'hours', value: pad(hours), label: labels.hours || (ar ? 'ساعة' : 'Hours') },
      { key: 'minutes', value: pad(minutes), label: labels.minutes || (ar ? 'دقيقة' : 'Min') },
      { key: 'seconds', value: pad(seconds), label: labels.seconds || (ar ? 'ثانية' : 'Sec') }
    ];
  });

  ngOnInit(): void {
    this.timerId = setInterval(() => this.now.set(Date.now()), 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }
}
