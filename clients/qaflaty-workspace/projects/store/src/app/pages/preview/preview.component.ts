import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { SectionRendererComponent } from '../../components/sections/section-renderer.component';

/** Message pushed from the merchant builder into this preview frame. */
interface PreviewMessage {
  type: 'qaflaty-preview';
  sections: SectionConfigurationDto[];
}

/**
 * Live WYSIWYG preview surface. Instead of fetching a page from the API it
 * renders the section list streamed in via `postMessage` from the merchant
 * store-builder, reusing the real storefront `SectionRendererComponent` (and the
 * `SectionWrapperComponent` it wraps each section in), so what merchants see
 * here is exactly what shoppers get — including per-section style settings.
 *
 * Only messages from an allowed merchant origin are honored.
 */
@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [SectionRendererComponent],
  template: `
    @if (ready()) {
      <app-section-renderer [sections]="sections()" />
    } @else {
      <div class="flex items-center justify-center min-h-screen text-gray-400 text-sm">
        Waiting for preview data…
      </div>
    }
  `
})
export class PreviewComponent implements OnInit, OnDestroy {
  private readonly listener = (event: MessageEvent) => this.onMessage(event);

  sections = signal<SectionConfigurationDto[]>([]);
  ready = signal(false);

  ngOnInit(): void {
    window.addEventListener('message', this.listener);
    // Tell whoever opened us (an iframe's parent, or the window that popped us
    // out via window.open) that we're mounted and ready to receive data. A
    // popup's `parent` is itself (only `opener` points back to the merchant
    // tab), so both are checked.
    const target = window.opener || (window.parent !== window ? window.parent : null);
    if (target) {
      target.postMessage({ type: 'qaflaty-preview-ready' }, '*');
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.listener);
  }

  private onMessage(event: MessageEvent): void {
    if (!this.isAllowedOrigin(event.origin)) return;
    const data = event.data as PreviewMessage | undefined;
    if (!data || data.type !== 'qaflaty-preview' || !Array.isArray(data.sections)) return;

    this.sections.set(data.sections.filter(s => s.isEnabled));
    this.ready.set(true);
  }

  private isAllowedOrigin(origin: string): boolean {
    try {
      const host = new URL(origin).hostname;
      // Local dev merchant app, or any Qaflaty-owned host in production.
      return host === 'localhost'
        || host === '127.0.0.1'
        || host === 'qaflaty.com'
        || host.endsWith('.qaflaty.com');
    } catch {
      return false;
    }
  }
}
