import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomerAuthService } from '../../services/customer-auth.service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="max-w-md w-full text-center">
        <div class="mb-6">
          <svg class="mx-auto h-16 w-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h1 class="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p class="text-gray-500 mb-8">
          You don't have permission to access this resource.
        </p>

        @if (reported()) {
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p class="text-green-700 text-sm">Your report has been sent to the administrator.</p>
          </div>
        } @else if (reportError()) {
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p class="text-red-700 text-sm">Failed to send report. Please try again.</p>
          </div>
        }

        <div class="flex flex-col gap-3">
          @if (!reported()) {
            <button
              (click)="reportToAdmin()"
              [disabled]="reporting()"
              class="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
              {{ reporting() ? 'Sending Report...' : 'Report to Admin' }}
            </button>
          }
          <button
            (click)="goBack()"
            class="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    </div>
  `
})
export class AccessDeniedComponent {
  private authService = inject(CustomerAuthService);
  private route = inject(ActivatedRoute);

  reporting = signal(false);
  reported = signal(false);
  reportError = signal(false);

  private endpoint = this.route.snapshot.queryParamMap.get('endpoint') ?? window.location.href;

  reportToAdmin(): void {
    this.reporting.set(true);
    this.reportError.set(false);
    this.authService.reportAccessDenied(this.endpoint).subscribe({
      next: () => {
        this.reported.set(true);
        this.reporting.set(false);
      },
      error: () => {
        this.reportError.set(true);
        this.reporting.set(false);
      }
    });
  }

  goBack(): void {
    history.back();
  }
}
