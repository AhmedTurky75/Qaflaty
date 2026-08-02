import { Component, computed, inject, input, output, signal } from '@angular/core';
import { MediaService } from '../../products/services/media.service';
import { RichTextEditorComponent } from '../rich-text-editor.component';
import { SectionField } from './section-schema';

const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

/**
 * Renders one schema field and emits the whole new value for its key.
 *
 * Everything the settings modal shows goes through here, so a field kind is
 * implemented once no matter which section type uses it.
 */
@Component({
  selector: 'app-section-field-control',
  standalone: true,
  imports: [RichTextEditorComponent],
  template: `
    @switch (field().kind) {

      @case ('bilingual') {
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-text" [attr.for]="id('en')">
              {{ field().label }} (EN)
              @if (field().seo) { <span class="ms-1 rounded bg-success/10 px-1 py-0.5 text-[10px] font-medium text-success" title="Search engines read this">SEO</span> }
            </label>
            <input [id]="id('en')" #en type="text" [value]="bilingual('en')" (input)="emitBilingual('en', en.value)"
              [placeholder]="field().placeholder || ''" class="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-text" [attr.for]="id('ar')">{{ field().label }} (AR)</label>
            <input [id]="id('ar')" #ar type="text" dir="rtl" [value]="bilingual('ar')" (input)="emitBilingual('ar', ar.value)"
              [placeholder]="field().placeholderAr || ''" class="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
          </div>
        </div>
      }

      @case ('bilingualArea') {
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-text" [attr.for]="id('en')">{{ field().label }} (EN)</label>
            <textarea [id]="id('en')" #enArea rows="3" (input)="emitBilingual('en', enArea.value)"
              [placeholder]="field().placeholder || ''"
              class="w-full resize-none rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40">{{ bilingual('en') }}</textarea>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-text" [attr.for]="id('ar')">{{ field().label }} (AR)</label>
            <textarea [id]="id('ar')" #arArea rows="3" dir="rtl" (input)="emitBilingual('ar', arArea.value)"
              [placeholder]="field().placeholderAr || ''"
              class="w-full resize-none rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40">{{ bilingual('ar') }}</textarea>
          </div>
        </div>
      }

      @case ('richText') {
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-text">{{ field().label }} (EN)</label>
            <app-rich-text-editor [value]="bilingual('en')" (valueChange)="emitBilingual('en', $event)" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-text">{{ field().label }} (AR)</label>
            <app-rich-text-editor [value]="bilingual('ar')" dir="rtl" (valueChange)="emitBilingual('ar', $event)" />
          </div>
        </div>
      }

      @case ('textarea') {
        <label class="mb-1 block text-xs font-medium text-text" [attr.for]="id()">{{ field().label }}</label>
        <textarea [id]="id()" #area rows="6" (input)="valueChange.emit(area.value)"
          [placeholder]="field().placeholder || ''"
          class="w-full rounded-md border border-border px-2 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary/40">{{ asText() }}</textarea>
      }

      @case ('select') {
        <label class="mb-1 block text-xs font-medium text-text" [attr.for]="id()">{{ field().label }}</label>
        <select [id]="id()" #sel [value]="asText()" (change)="valueChange.emit(sel.value)"
          class="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40">
          @for (option of field().options || []; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      }

      @case ('toggle') {
        <label class="flex cursor-pointer items-center gap-2 py-1.5">
          <input type="checkbox" [checked]="asBool()" (change)="valueChange.emit(!asBool())"
            class="h-4 w-4 rounded text-primary focus:ring-2 focus:ring-primary/40" />
          <span class="text-xs font-medium text-text">{{ field().label }}</span>
        </label>
      }

      @case ('number') {
        <label class="mb-1 block text-xs font-medium text-text" [attr.for]="id()">{{ field().label }}</label>
        <input [id]="id()" #num type="number" [value]="asText()" (input)="valueChange.emit(+num.value)"
          [attr.min]="field().min ?? null" [attr.max]="field().max ?? null" [attr.step]="field().step ?? null"
          class="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
      }

      @case ('color') {
        <label class="mb-1 block text-xs font-medium text-text" [attr.for]="id()">{{ field().label }}</label>
        <div class="flex items-center gap-2">
          <input [id]="id()" #colour type="color" [value]="asText() || '#111827'" (input)="valueChange.emit(colour.value)"
            class="h-8 w-12 cursor-pointer rounded border border-border p-0" />
          <input #colourText type="text" [value]="asText()" (input)="valueChange.emit(colourText.value)"
            placeholder="#111827" class="flex-1 rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
          @if (asText()) {
            <button type="button" (click)="valueChange.emit('')" class="text-xs text-text-muted hover:text-danger" aria-label="Clear colour">✕</button>
          }
        </div>
      }

      @case ('product') {
        <label class="mb-1 block text-xs font-medium text-text" [attr.for]="id()">{{ field().label }}</label>
        <select [id]="id()" #prod [value]="asText()" (change)="valueChange.emit(prod.value)"
          class="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40">
          <option value="">Use the page's own product</option>
          @for (option of productOptions(); track option.slug) {
            <option [value]="option.slug">{{ option.name }}</option>
          }
        </select>
      }

      @case ('datetime') {
        <label class="mb-1 block text-xs font-medium text-text" [attr.for]="id()">{{ field().label }}</label>
        <input [id]="id()" #when type="datetime-local" [value]="asText()" (input)="valueChange.emit(when.value)"
          class="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
      }

      @case ('image') {
        <label class="mb-1 block text-xs font-medium text-text" [attr.for]="id()">
          {{ field().label }}
          @if (field().seo) { <span class="ms-1 rounded bg-success/10 px-1 py-0.5 text-[10px] font-medium text-success">SEO</span> }
        </label>
        <div class="flex items-center gap-2">
          <input [id]="id()" #img type="text" [value]="asText()" (input)="valueChange.emit(img.value)"
            placeholder="Paste an image link, or upload →"
            class="flex-1 rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
          <label class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-surface-elevated px-3 py-1.5 text-xs text-text hover:bg-border/40">
            {{ uploading() ? 'Uploading…' : 'Upload' }}
            <input type="file" accept="image/*" class="hidden" (change)="uploadImage($event)" />
          </label>
        </div>
        @if (asText()) {
          <img [src]="asText()" alt="" class="mt-2 h-20 rounded border border-border object-cover" />
        }
      }

      @case ('video') {
        <label class="mb-1 block text-xs font-medium text-text">{{ field().label }}</label>
        <div class="flex items-center gap-2">
          <label class="flex cursor-pointer items-center gap-1.5 rounded-md bg-surface-elevated px-3 py-1.5 text-xs text-text hover:bg-border/40">
            {{ uploading() ? 'Uploading…' : 'Choose a video' }}
            <input type="file" accept="video/mp4,video/webm" class="hidden" (change)="uploadVideo($event)" />
          </label>
          @if (asText()) {
            <span class="truncate text-xs text-text-muted">{{ asText() }}</span>
            <button type="button" (click)="valueChange.emit('')" class="text-xs text-text-muted hover:text-danger" aria-label="Remove the video">✕</button>
          }
        </div>
        @if (uploadError()) {
          <p class="mt-1 text-xs text-danger">{{ uploadError() }}</p>
        }
      }

      @default {
        <label class="mb-1 block text-xs font-medium text-text" [attr.for]="id()">
          {{ field().label }}
          @if (field().seo) { <span class="ms-1 rounded bg-success/10 px-1 py-0.5 text-[10px] font-medium text-success" title="Search engines read this">SEO</span> }
        </label>
        <input [id]="id()" #plain type="text" [value]="asText()" (input)="valueChange.emit(plain.value)"
          [placeholder]="field().placeholder || ''"
          class="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
      }
    }

    @if (field().help) {
      <p class="mt-1 text-[11px] text-text-muted">{{ field().help }}</p>
    }
  `
})
export class SectionFieldControlComponent {
  field = input.required<SectionField>();
  /** Current value for this field's key — shape depends on the kind. */
  value = input<unknown>(undefined);
  /** Needed to upload media against the right store. */
  storeId = input<string | null>(null);
  productOptions = input<{ slug: string; name: string }[]>([]);
  /** Makes control ids unique when the same field repeats inside a list. */
  idPrefix = input<string>('field');

  /** The complete new value for this field's key. */
  valueChange = output<unknown>();

  private media = inject(MediaService);

  protected uploading = signal(false);
  protected uploadError = signal<string | null>(null);

  private objectValue = computed<Record<string, unknown>>(() => {
    const value = this.value();
    return value && typeof value === 'object' ? value as Record<string, unknown> : {};
  });

  protected id(suffix = ''): string {
    return `${this.idPrefix()}-${this.field().key}${suffix ? '-' + suffix : ''}`;
  }

  protected asText(): string {
    const value = this.value();
    if (value === null || value === undefined) return '';
    return typeof value === 'object' ? '' : String(value);
  }

  /** Toggles marked `defaultOn` read as on until explicitly switched off. */
  protected asBool(): boolean {
    const value = this.value();
    return this.field().defaultOn ? value !== false : value === true;
  }

  protected bilingual(lang: 'en' | 'ar'): string {
    const value = this.objectValue()[lang];
    return typeof value === 'string' ? value : '';
  }

  protected emitBilingual(lang: 'en' | 'ar', text: string): void {
    this.valueChange.emit({ ...this.objectValue(), [lang]: text });
  }

  protected uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const storeId = this.storeId();
    if (!file || !storeId) return;

    this.uploading.set(true);
    this.media.uploadImages(storeId, [file]).subscribe({
      next: result => {
        if (result.urls?.[0]) this.valueChange.emit(result.urls[0]);
        this.uploading.set(false);
        input.value = '';
      },
      error: () => {
        this.uploading.set(false);
        input.value = '';
      }
    });
  }

  protected uploadVideo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const storeId = this.storeId();
    if (!file || !storeId) return;

    this.uploadError.set(null);
    if (file.size > MAX_VIDEO_BYTES) {
      this.uploadError.set('That video is over the 20 MB limit.');
      input.value = '';
      return;
    }

    this.uploading.set(true);
    this.media.uploadVideo(storeId, file).subscribe({
      next: result => {
        if (result.url) this.valueChange.emit(result.url);
        this.uploading.set(false);
        input.value = '';
      },
      error: (err: { error?: { message?: string } }) => {
        this.uploading.set(false);
        this.uploadError.set(err?.error?.message || 'The video could not be uploaded.');
        input.value = '';
      }
    });
  }
}
