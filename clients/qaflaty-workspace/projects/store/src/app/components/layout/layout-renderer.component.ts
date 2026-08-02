import { Component, computed, inject } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { FeatureService } from '../../services/feature.service';
import { ConfigService } from '../../services/config.service';
import { SectionRendererComponent } from '../sections/section-renderer.component';
import { HeaderMinimalComponent } from '../headers/header-minimal.component';
import { HeaderFullComponent } from '../headers/header-full.component';
import { HeaderCenteredComponent } from '../headers/header-centered.component';
import { HeaderSidebarComponent } from '../headers/header-sidebar.component';
import { FooterStandardComponent } from '../footers/footer-standard.component';
import { FooterMinimalComponent } from '../footers/footer-minimal.component';
import { FooterCenteredComponent } from '../footers/footer-centered.component';

/**
 * Draws the header and footer around every page.
 *
 * A store that has arranged its own header or footer sections gets those; one
 * that has not keeps the header/footer variant it already had, so nothing
 * changes for a store until its merchant builds one.
 */
@Component({
  selector: 'app-layout-renderer',
  standalone: true,
  imports: [
    SectionRendererComponent,
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
      @if (headerSections().length) {
        <app-section-renderer [sections]="headerSections()" />
      } @else {
        @switch (features.headerVariant()) {
          @case ('header-full') { <app-header-full /> }
          @case ('header-centered') { <app-header-centered /> }
          @case ('header-sidebar') { <app-header-sidebar /> }
          @default { <app-header-minimal /> }
        }
      }

      <!-- Main Content -->
      <main class="flex-1">
        <ng-content />
      </main>

      <!-- Footer -->
      @if (footerSections().length) {
        <app-section-renderer [sections]="footerSections()" />
      } @else {
        @switch (features.footerVariant()) {
          @case ('footer-minimal') { <app-footer-minimal /> }
          @case ('footer-centered') { <app-footer-centered /> }
          @default { <app-footer-standard /> }
        }
      }
    </div>
  `
})
export class LayoutRendererComponent {
  features = inject(FeatureService);
  private configService = inject(ConfigService);

  headerSections = computed(() => this.layoutSections('Header'));
  footerSections = computed(() => this.layoutSections('Footer'));

  /** Enabled sections of the store's header or footer group, in order. */
  private layoutSections(pageType: string): SectionConfigurationDto[] {
    const group = this.configService.pages().find(page => page.pageType === pageType);
    if (!group || !group.isEnabled) return [];

    return (group.sections ?? [])
      .filter(section => section.isEnabled)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
