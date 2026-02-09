import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-preferences.component.html'
})
export class NotificationPreferencesComponent {
  // Placeholder state - not functional yet
  emailNotifications = signal(true);
  smsNotifications = signal(false);

  toggleEmailNotifications(): void {
    // Placeholder - will be implemented in future
    console.log('Email notifications toggle (not functional yet)');
  }

  toggleSmsNotifications(): void {
    // Placeholder - will be implemented in future
    console.log('SMS notifications toggle (not functional yet)');
  }
}
