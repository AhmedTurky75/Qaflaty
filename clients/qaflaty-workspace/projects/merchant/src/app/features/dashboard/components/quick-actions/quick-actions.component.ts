import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div class="space-y-3">
        <a
          [routerLink]="['/products', 'new']"
          [queryParams]="{ storeId: storeId }"
          class="flex items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
        >
          <div class="flex items-center space-x-3">
            <div class="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100 group-hover:bg-blue-500 transition-colors">
              <svg class="h-5 w-5 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 group-hover:text-blue-700">Create New Product</p>
              <p class="text-xs text-gray-500">Add a new product to your store</p>
            </div>
          </div>
          <svg class="h-5 w-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        <a
          routerLink="/orders"
          class="flex items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
        >
          <div class="flex items-center space-x-3">
            <div class="flex items-center justify-center h-10 w-10 rounded-lg bg-green-100 group-hover:bg-green-500 transition-colors">
              <svg class="h-5 w-5 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 group-hover:text-green-700">View All Orders</p>
              <p class="text-xs text-gray-500">Manage customer orders</p>
            </div>
          </div>
          <svg class="h-5 w-5 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        <a
          [routerLink]="['/stores', storeId]"
          class="flex items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
        >
          <div class="flex items-center space-x-3">
            <div class="flex items-center justify-center h-10 w-10 rounded-lg bg-purple-100 group-hover:bg-purple-500 transition-colors">
              <svg class="h-5 w-5 text-purple-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 group-hover:text-purple-700">Manage Store</p>
              <p class="text-xs text-gray-500">Update store settings</p>
            </div>
          </div>
          <svg class="h-5 w-5 text-gray-400 group-hover:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  `
})
export class QuickActionsComponent {
  @Input() storeId?: string;
}
