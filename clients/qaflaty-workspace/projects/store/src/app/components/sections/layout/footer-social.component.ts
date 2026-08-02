import { Component, computed, inject, input } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { ConfigService } from '../../../services/config.service';
import { I18nService } from '../../../services/i18n.service';
import { contentOf } from '../section-config';

interface SocialLink {
  name: string;
  url: string;
  label: string;
}

/** Uses the social accounts already set up in the store's settings. */
@Component({
  selector: 'app-footer-social',
  standalone: true,
  template: `
    @if (links().length) {
      <div class="bg-gray-900 text-white py-6">
        <div class="max-w-7xl mx-auto px-4 text-center">
          @if (title()) {
            <p class="text-sm text-gray-400 mb-3">{{ title() }}</p>
          }
          <div class="flex items-center justify-center gap-4">
            @for (link of links(); track link.name) {
              <a [href]="link.url" target="_blank" rel="noopener noreferrer"
                class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-sm font-semibold"
                [attr.aria-label]="link.label">
                {{ link.label.charAt(0) }}
              </a>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class FooterSocialComponent {
  config = input.required<SectionConfigurationDto>();

  private configService = inject(ConfigService);
  private i18n = inject(I18nService);

  title = computed(() => this.i18n.getText(contentOf(this.config())['title']));

  links = computed<SocialLink[]>(() => {
    const social = this.configService.config()?.socialLinks;
    if (!social) return [];

    const candidates: SocialLink[] = [
      { name: 'facebook', url: social.facebook ?? '', label: 'Facebook' },
      { name: 'instagram', url: social.instagram ?? '', label: 'Instagram' },
      { name: 'twitter', url: social.twitter ?? '', label: 'Twitter' },
      { name: 'tiktok', url: social.tikTok ?? '', label: 'TikTok' },
      { name: 'snapchat', url: social.snapchat ?? '', label: 'Snapchat' },
      { name: 'youtube', url: social.youTube ?? '', label: 'YouTube' }
    ];

    return candidates.filter(link => link.url.trim().length > 0);
  });
}
