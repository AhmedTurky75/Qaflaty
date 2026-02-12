import { Component, inject } from '@angular/core';
import { FeatureService } from '../../services/feature.service';
import { HeaderMinimalComponent } from '../headers/header-minimal.component';
import { HeaderFullComponent } from '../headers/header-full.component';
import { HeaderCenteredComponent } from '../headers/header-centered.component';
import { HeaderSidebarComponent } from '../headers/header-sidebar.component';
import { FooterStandardComponent } from '../footers/footer-standard.component';
import { FooterMinimalComponent } from '../footers/footer-minimal.component';
import { FooterCenteredComponent } from '../footers/footer-centered.component';

@Component({
  selector: 'app-layout-renderer',
  standalone: true,
  imports: [
    HeaderMinimalComponent,
    HeaderFullComponent,
    HeaderCenteredComponent,
    HeaderSidebarComponent,
    FooterStandardComponent,
    FooterMinimalComponent,
    FooterCenteredComponent
  ],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Header -->
      @switch (features.headerVariant()) {
        @case ('header-full') {
          <app-header-full />
        }
        @case ('header-centered') {
          <app-header-centered />
        }
        @case ('header-sidebar') {
          <app-header-sidebar />
        }
        @default {
          <app-header-minimal />
        }
      }

      <!-- Main Content -->
      <main class="flex-1">
        <ng-content />
      </main>

      <!-- Footer -->
      @switch (features.footerVariant()) {
        @case ('footer-minimal') {
          <app-footer-minimal />
        }
        @case ('footer-centered') {
          <app-footer-centered />
        }
        @default {
          <app-footer-standard />
        }
      }
    </div>
  `
})
export class LayoutRendererComponent {
  features = inject(FeatureService);
}
