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
    const content = this.config().contentJson;
    return content ? this.sanitizer.bypassSecurityTrustHtml(content) : '';
  });
}
