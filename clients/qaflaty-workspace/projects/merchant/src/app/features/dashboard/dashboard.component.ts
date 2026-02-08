import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600">Welcome to your merchant dashboard!</p>
        <p class="text-sm text-gray-500 mt-2">
          This is a placeholder. The dashboard will be implemented in the next phase.
        </p>
      </div>
    </div>
  `
})
export class DashboardComponent {}
