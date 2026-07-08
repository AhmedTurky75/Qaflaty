import { Component, input, computed } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { inject } from '@angular/core';
import { SectionConfigurationDto } from 'shared';

@Component({
  selector: 'app-custom-html',
  standalone: true,
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8" [innerHTML]="safeContent()"></div>
  `
})
export class CustomHtmlComponent {
  config = input.required<SectionConfigurationDto>();
  private sanitizer = inject(DomSanitizer);

  safeContent = computed(() => {
    // contentJson is a JSON object like { "html": "<div>…</div>" }; render the
    // `html` field, not the raw JSON string.
    const raw = this.config().contentJson;
    if (!raw) return '';
    let html = '';
    try {
      const parsed = JSON.parse(raw);
      html = typeof parsed?.html === 'string' ? parsed.html : '';
    } catch {
      // Legacy rows may have stored the HTML string directly.
      html = raw;
    }
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : '';
  });
}
