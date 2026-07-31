import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [TranslocoPipe, IconComponent],
  templateUrl: './access-denied.component.html',
  styleUrl: './access-denied.component.scss',
})
export class AccessDeniedComponent {
  private authService = inject(AuthService);
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
