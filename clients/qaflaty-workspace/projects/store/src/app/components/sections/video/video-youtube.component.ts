import { Component, input, signal, computed, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SectionConfigurationDto } from 'shared';

/**
 * Video section. Content model:
 *   { source: 'youtube' | 'upload', videoId, videoUrl, autoplay, aspectRatio }
 *
 * - YouTube: uses a lightweight facade (thumbnail + play button) and only
 *   injects the iframe on click — unless autoplay is on, in which case it loads
 *   immediately and starts muted (browsers block un-muted autoplay).
 * - Upload: renders a self-hosted <video>; autoplay likewise starts muted+loop.
 */
@Component({
  selector: 'app-video-youtube',
  standalone: true,
  template: `
    @if (hasVideo()) {
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="relative w-full overflow-hidden rounded-xl bg-black" [style.aspect-ratio]="aspectRatio()">
          @if (isUpload()) {
            <video
              [src]="videoUrl()"
              class="absolute inset-0 w-full h-full object-contain bg-black"
              controls
              playsinline
              [autoplay]="autoplay()"
              [muted]="autoplay()"
              [loop]="autoplay()"
            ></video>
          } @else if (loaded() || autoplay()) {
            <iframe
              [src]="embedUrl()"
              class="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              title="Video"
            ></iframe>
          } @else {
            <button type="button" (click)="loaded.set(true)"
              class="absolute inset-0 w-full h-full group cursor-pointer"
              aria-label="Play video">
              <img [src]="thumbUrl()" alt="Video thumbnail" class="w-full h-full object-cover" loading="lazy" />
              <span class="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
                <span class="flex items-center justify-center w-16 h-16 rounded-full bg-red-600 shadow-lg group-hover:scale-105 transition-transform">
                  <svg class="w-7 h-7 text-white ms-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </span>
              </span>
            </button>
          }
        </div>
      </div>
    }
  `
})
export class VideoYoutubeComponent {
  config = input.required<SectionConfigurationDto>();
  loaded = signal(false);
  private sanitizer = inject(DomSanitizer);

  private content = computed<any>(() => {
    try { return this.config().contentJson ? JSON.parse(this.config().contentJson!) : {}; }
    catch { return {}; }
  });

  /** Uploaded self-hosted video vs YouTube embed. */
  isUpload = computed(() => this.content().source === 'upload' && !!this.videoUrl());
  videoUrl = computed(() => String(this.content().videoUrl || '').trim());

  /** Accepts a raw id or a full YouTube URL and extracts the 11-char id. */
  videoId = computed(() => {
    const raw = String(this.content().videoId || '').trim();
    if (!raw) return '';
    const match = raw.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    if (match) return match[1];
    return /^[A-Za-z0-9_-]{11}$/.test(raw) ? raw : '';
  });

  hasVideo = computed(() => this.isUpload() ? !!this.videoUrl() : !!this.videoId());

  autoplay = computed(() => this.content().autoplay === true);
  aspectRatio = computed(() => this.content().aspectRatio || '16 / 9');
  thumbUrl = computed(() => `https://i.ytimg.com/vi/${this.videoId()}/hqdefault.jpg`);

  embedUrl = computed<SafeResourceUrl>(() => {
    // Autoplay must be muted for browsers to allow it on load.
    const muted = this.autoplay() ? '&mute=1' : '';
    const url = `https://www.youtube-nocookie.com/embed/${this.videoId()}?rel=0&playsinline=1&autoplay=1${muted}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });
}
