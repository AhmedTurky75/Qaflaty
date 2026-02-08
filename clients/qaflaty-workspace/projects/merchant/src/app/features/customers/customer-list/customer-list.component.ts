import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Customers</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600">Customer management will be implemented next.</p>
      </div>
    </div>
  `
})
export class CustomerListComponent {}
