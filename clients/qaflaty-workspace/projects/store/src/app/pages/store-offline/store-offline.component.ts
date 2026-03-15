import { Component, Input, inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-store-offline',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center px-4"
         [class]="maintenance ? 'bg-gradient-to-br from-amber-50 to-orange-50' : 'bg-gradient-to-br from-gray-50 to-gray-100'">
      <div class="max-w-md w-full text-center">

        <!-- Icon -->
        <div class="mb-8 flex justify-center">
          @if (maintenance) {
            <!-- Maintenance illustration -->
            <div class="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center">
              <svg class="w-16 h-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          } @else {
            <div class="relative">
              <svg class="w-32 h-32 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          }
        </div>

        <!-- Store Name -->
        @if (store.currentStore()?.name) {
          <h1 class="text-2xl font-bold mb-2" [class]="maintenance ? 'text-amber-900' : 'text-gray-900'">
            {{ store.currentStore()!.name }}
          </h1>
        }

        <!-- Message card -->
        <div class="bg-white rounded-xl shadow-sm p-8 mb-6">
          @if (maintenance) {
            @if (i18n.currentLanguage() === 'ar') {
              <div class="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                <span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                قيد الصيانة
              </div>
              <h2 class="text-xl font-semibold text-gray-800 mb-3">المتجر تحت الصيانة</h2>
              <p class="text-gray-600 mb-4">نعمل حالياً على تحسين تجربتك. سنعود قريباً!</p>
              <p class="text-sm text-gray-500">شكراً لصبرك وتفهمك.</p>
            } @else {
              <div class="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                <span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                Under Maintenance
              </div>
              <h2 class="text-xl font-semibold text-gray-800 mb-3">Store Under Maintenance</h2>
              <p class="text-gray-600 mb-4">We're working hard to improve your experience. We'll be back soon!</p>
              <p class="text-sm text-gray-500">Thank you for your patience.</p>
            }
          } @else {
            @if (i18n.currentLanguage() === 'ar') {
              <h2 class="text-xl font-semibold text-gray-800 mb-3">المتجر غير متاح حالياً</h2>
              <p class="text-gray-600 mb-4">نعتذر، هذا المتجر غير متاح في الوقت الحالي.</p>
              <p class="text-sm text-gray-500">يرجى المحاولة مرة أخرى لاحقاً أو الاتصال بالمتجر للحصول على مزيد من المعلومات.</p>
            } @else {
              <h2 class="text-xl font-semibold text-gray-800 mb-3">Store Currently Offline</h2>
              <p class="text-gray-600 mb-4">Sorry, this store is currently unavailable.</p>
              <p class="text-sm text-gray-500">Please try again later or contact the store for more information.</p>
            }
          }
        </div>

        <!-- Powered by Qaflaty -->
        <div class="mt-12 text-sm text-gray-400">
          @if (i18n.currentLanguage() === 'ar') {
            <p>مدعوم من <span class="font-semibold">قافلاتي</span></p>
          } @else {
            <p>Powered by <span class="font-semibold">Qaflaty</span></p>
          }
        </div>
      </div>
    </div>
  `
})
export class StoreOfflineComponent {
  @Input() maintenance = false;

  store = inject(StoreService);
  i18n = inject(I18nService);
}
