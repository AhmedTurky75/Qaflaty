import { Component, inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-store-offline',
  standalone: true,
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div class="max-w-md w-full text-center">
        <!-- Offline Icon -->
        <div class="mb-8 flex justify-center">
          <div class="relative">
            <svg class="w-32 h-32 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <svg class="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Store Name -->
        @if (store.currentStore()?.name) {
          <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ store.currentStore()!.name }}</h1>
        }

        <!-- Offline Message -->
        <div class="bg-white rounded-lg shadow-sm p-8 mb-6">
          @if (i18n.currentLanguage() === 'ar') {
            <h2 class="text-xl font-semibold text-gray-800 mb-3">المتجر غير متاح حالياً</h2>
            <p class="text-gray-600 mb-4">نعتذر، هذا المتجر غير متاح في الوقت الحالي.</p>
            <p class="text-sm text-gray-500">يرجى المحاولة مرة أخرى لاحقاً أو الاتصال بالمتجر للحصول على مزيد من المعلومات.</p>
          } @else {
            <h2 class="text-xl font-semibold text-gray-800 mb-3">Store Currently Offline</h2>
            <p class="text-gray-600 mb-4">Sorry, this store is currently unavailable.</p>
            <p class="text-sm text-gray-500">Please try again later or contact the store for more information.</p>
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
  store = inject(StoreService);
  i18n = inject(I18nService);
}
