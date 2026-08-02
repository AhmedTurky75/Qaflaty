import { Component, computed, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SectionConfigurationDto } from 'shared';
import { PreviewCategory, PreviewProduct, SectionPreviewDataService } from './section-preview-data.service';

/**
 * Renders a section the way a shopper sees it, using the store's real products
 * and categories. Slots with no data source (hero art, testimonial quotes,
 * promo headlines) fall back to placeholder copy and flat placeholder artwork,
 * which the seller overwrites in the section's settings.
 *
 * Always rendered inside `app-section-preview-frame`, which scales it down and
 * disables pointer events — this component itself is never interactive.
 */
@Component({
  selector: 'app-section-miniature',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="qf-mini" [style.--qf-primary]="primary()">
      @switch (variantId()) {

        <!-- ── Hero ─────────────────────────────────────────────────────── -->
        @case ('hero-full-image') {
          <div class="relative h-[420px] flex items-center justify-center qf-art">
            <div class="absolute inset-0 bg-gradient-to-b from-black/45 to-black/70"></div>
            <div class="relative text-center px-8 max-w-2xl">
              <h1 class="text-5xl font-bold text-white mb-4">{{ title('Welcome to our store') }}</h1>
              <p class="text-lg text-white/85 mb-7">{{ subtitle('Quality products, delivered fast') }}</p>
              <span class="inline-block rounded-lg px-7 py-3 text-base font-semibold text-white qf-btn">{{ button('Shop now') }}</span>
            </div>
          </div>
        }
        @case ('hero-split') {
          <div class="grid grid-cols-2 items-center gap-10 bg-gray-50 px-12 py-16">
            <div>
              <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ title('Welcome to our store') }}</h1>
              <p class="text-lg text-gray-600 mb-7">{{ subtitle('Quality products, delivered fast') }}</p>
              <span class="inline-block rounded-lg px-6 py-3 text-base font-semibold text-white qf-btn">{{ button('Shop now') }}</span>
            </div>
            <div class="h-[280px] rounded-2xl qf-art"></div>
          </div>
        }
        @case ('hero-slider') {
          <div class="relative h-[400px] flex items-center justify-center qf-art">
            <div class="absolute inset-0 bg-black/50"></div>
            <div class="relative text-center px-8">
              <h1 class="text-4xl font-bold text-white mb-3">{{ title('New season is here') }}</h1>
              <p class="text-white/85 text-lg">{{ subtitle('Swipe through the highlights') }}</p>
            </div>
            <div class="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
              <span class="h-2 w-8 rounded-full bg-white"></span>
              <span class="h-2 w-2 rounded-full bg-white/50"></span>
              <span class="h-2 w-2 rounded-full bg-white/50"></span>
            </div>
          </div>
        }
        @case ('hero-minimal') {
          <div class="bg-white px-12 py-20 text-center">
            <h1 class="text-4xl font-bold text-gray-900 mb-3">{{ title('Welcome to our store') }}</h1>
            <p class="text-lg text-gray-600 mb-6">{{ subtitle('Quality products, delivered fast') }}</p>
            <span class="inline-block rounded-lg px-6 py-3 text-base font-semibold text-white qf-btn">{{ button('Shop now') }}</span>
          </div>
        }

        <!-- ── Product grids ────────────────────────────────────────────── -->
        @case ('grid-standard') {
          <div class="bg-white px-12 py-12">
            <h2 class="mb-8 text-center text-3xl font-bold text-gray-900">{{ title('Featured products') }}</h2>
            <div class="grid grid-cols-4 gap-6">
              @for (p of products(4); track p.id) {
                <div>
                  <div class="mb-3 aspect-square overflow-hidden rounded-lg bg-gray-100">
                    @if (p.imageUrl) { <img [src]="p.imageUrl" alt="" class="h-full w-full object-cover" /> }
                    @else { <div class="h-full w-full qf-art"></div> }
                  </div>
                  <p class="truncate text-base font-medium text-gray-900">{{ p.name }}</p>
                  <p class="mt-1 text-base font-semibold" style="color: var(--qf-primary)">
                    {{ price(p.price) }}
                    @if (p.compareAtPrice) { <span class="ms-2 text-sm font-normal text-gray-400 line-through">{{ price(p.compareAtPrice) }}</span> }
                  </p>
                </div>
              }
            </div>
          </div>
        }
        @case ('grid-large') {
          <div class="bg-white px-12 py-12">
            <h2 class="mb-8 text-center text-3xl font-bold text-gray-900">{{ title('Featured products') }}</h2>
            <div class="grid grid-cols-3 gap-8">
              @for (p of products(3); track p.id) {
                <div>
                  <div class="mb-4 h-[240px] overflow-hidden rounded-xl bg-gray-100">
                    @if (p.imageUrl) { <img [src]="p.imageUrl" alt="" class="h-full w-full object-cover" /> }
                    @else { <div class="h-full w-full qf-art"></div> }
                  </div>
                  <p class="truncate text-lg font-medium text-gray-900">{{ p.name }}</p>
                  <p class="mt-1 text-lg font-semibold" style="color: var(--qf-primary)">{{ price(p.price) }}</p>
                </div>
              }
            </div>
          </div>
        }
        @case ('grid-list') {
          <div class="bg-white px-12 py-12">
            <h2 class="mb-6 text-3xl font-bold text-gray-900">{{ title('Featured products') }}</h2>
            <div class="space-y-4">
              @for (p of products(3); track p.id) {
                <div class="flex items-center gap-5 rounded-xl border border-gray-200 p-4">
                  <div class="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    @if (p.imageUrl) { <img [src]="p.imageUrl" alt="" class="h-full w-full object-cover" /> }
                    @else { <div class="h-full w-full qf-art"></div> }
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-lg font-medium text-gray-900">{{ p.name }}</p>
                    <p class="mt-1 text-base font-semibold" style="color: var(--qf-primary)">{{ price(p.price) }}</p>
                  </div>
                  <span class="rounded-lg px-5 py-2.5 text-sm font-semibold text-white qf-btn">{{ button('Add to cart') }}</span>
                </div>
              }
            </div>
          </div>
        }
        @case ('grid-compact') {
          <div class="bg-white px-12 py-10">
            <h2 class="mb-6 text-2xl font-bold text-gray-900">{{ title('Featured products') }}</h2>
            <div class="grid grid-cols-6 gap-4">
              @for (p of products(6); track p.id) {
                <div>
                  <div class="mb-2 aspect-square overflow-hidden rounded-md bg-gray-100">
                    @if (p.imageUrl) { <img [src]="p.imageUrl" alt="" class="h-full w-full object-cover" /> }
                    @else { <div class="h-full w-full qf-art"></div> }
                  </div>
                  <p class="truncate text-sm text-gray-900">{{ p.name }}</p>
                  <p class="text-sm font-semibold" style="color: var(--qf-primary)">{{ price(p.price) }}</p>
                </div>
              }
            </div>
          </div>
        }
        @case ('carousel-standard') {
          <div class="bg-white px-12 py-12">
            <div class="mb-6 flex items-center justify-between">
              <h2 class="text-3xl font-bold text-gray-900">{{ title('You may also like') }}</h2>
              <div class="flex gap-2">
                <span class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-400">‹</span>
                <span class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-400">›</span>
              </div>
            </div>
            <div class="flex gap-6 overflow-hidden">
              @for (p of products(5); track p.id) {
                <div class="w-[220px] shrink-0">
                  <div class="mb-3 h-[200px] overflow-hidden rounded-lg bg-gray-100">
                    @if (p.imageUrl) { <img [src]="p.imageUrl" alt="" class="h-full w-full object-cover" /> }
                    @else { <div class="h-full w-full qf-art"></div> }
                  </div>
                  <p class="truncate text-base text-gray-900">{{ p.name }}</p>
                  <p class="text-base font-semibold" style="color: var(--qf-primary)">{{ price(p.price) }}</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- ── Categories ───────────────────────────────────────────────── -->
        @case ('cats-grid') {
          <div class="bg-gray-50 px-12 py-12">
            <h2 class="mb-8 text-center text-3xl font-bold text-gray-900">{{ title('Shop by category') }}</h2>
            <div class="grid grid-cols-4 gap-5">
              @for (c of categories(4); track c.id) {
                <div class="rounded-xl bg-white p-6 text-center shadow-sm">
                  <div class="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full bg-gray-100">
                    @if (c.imageUrl) { <img [src]="c.imageUrl" alt="" class="h-full w-full object-cover" /> }
                    @else { <div class="h-full w-full qf-art"></div> }
                  </div>
                  <p class="truncate text-base font-medium text-gray-900">{{ c.name }}</p>
                </div>
              }
            </div>
          </div>
        }
        @case ('cats-slider') {
          <div class="bg-white px-12 py-12">
            <h2 class="mb-6 text-3xl font-bold text-gray-900">{{ title('Shop by category') }}</h2>
            <div class="flex gap-5 overflow-hidden">
              @for (c of categories(5); track c.id) {
                <div class="w-[200px] shrink-0">
                  <div class="mb-3 h-[130px] overflow-hidden rounded-xl bg-gray-100">
                    @if (c.imageUrl) { <img [src]="c.imageUrl" alt="" class="h-full w-full object-cover" /> }
                    @else { <div class="h-full w-full qf-art"></div> }
                  </div>
                  <p class="truncate text-base font-medium text-gray-900">{{ c.name }}</p>
                </div>
              }
            </div>
          </div>
        }
        @case ('cats-icons') {
          <div class="bg-white px-12 py-10">
            <h2 class="mb-6 text-center text-2xl font-bold text-gray-900">{{ title('Shop by category') }}</h2>
            <div class="flex flex-wrap justify-center gap-8">
              @for (c of categories(6); track c.id) {
                <div class="w-[130px] text-center">
                  <div class="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full" style="background: color-mix(in srgb, var(--qf-primary) 12%, white)">
                    <span class="h-6 w-6 rounded" style="background: var(--qf-primary)"></span>
                  </div>
                  <p class="truncate text-sm font-medium text-gray-900">{{ c.name }}</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- ── Banners & announcements ──────────────────────────────────── -->
        @case ('banner-strip') {
          <div class="flex items-center justify-between px-12 py-10 qf-art">
            <div class="relative">
              <h2 class="text-3xl font-bold text-white">{{ title('Season sale — up to 40% off') }}</h2>
              <p class="mt-2 text-lg text-white/85">{{ subtitle('Limited stock, while it lasts') }}</p>
            </div>
            <span class="relative rounded-lg bg-white px-6 py-3 text-base font-semibold text-gray-900">{{ button('See offers') }}</span>
          </div>
        }
        @case ('banner-card') {
          <div class="bg-white px-12 py-10">
            <div class="flex items-center justify-between rounded-2xl px-10 py-12 qf-art">
              <div class="relative">
                <h2 class="text-3xl font-bold text-white">{{ title('Season sale — up to 40% off') }}</h2>
                <p class="mt-2 text-lg text-white/85">{{ subtitle('Limited stock, while it lasts') }}</p>
              </div>
              <span class="relative rounded-lg bg-white px-6 py-3 text-base font-semibold text-gray-900">{{ button('See offers') }}</span>
            </div>
          </div>
        }
        @case ('announcement-bar') {
          <div class="flex items-center justify-center gap-3 bg-gray-900 px-6 py-4 text-center">
            <p class="text-base font-medium text-white">{{ text('text', 'Free shipping on orders over 500') }}</p>
            <span class="text-white/50">✕</span>
          </div>
        }
        @case ('marquee-standard') {
          <div class="flex items-center gap-12 overflow-hidden px-8 py-5" style="background: var(--qf-primary)">
            @for (m of marqueeMessages(); track $index) {
              <span class="whitespace-nowrap text-base font-medium text-white">★ {{ m }}</span>
            }
          </div>
        }

        <!-- ── Media & content ──────────────────────────────────────────── -->
        @case ('slider-standard') {
          <div class="relative h-[380px] qf-art">
            <div class="absolute inset-0 bg-black/40"></div>
            <div class="relative flex h-full flex-col items-center justify-center px-8 text-center">
              <h2 class="text-4xl font-bold text-white">{{ slideTitle('New arrivals') }}</h2>
              <p class="mt-3 text-lg text-white/85">{{ slideSubtitle('Fresh picks this week') }}</p>
            </div>
            <div class="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
              <span class="h-2 w-8 rounded-full bg-white"></span>
              <span class="h-2 w-2 rounded-full bg-white/50"></span>
            </div>
          </div>
        }
        @case ('image-standard') {
          <div class="bg-white">
            <div class="h-[320px] w-full qf-art">
              @if (imageUrl()) { <img [src]="imageUrl()" alt="" class="h-full w-full object-cover" /> }
            </div>
          </div>
        }
        @case ('video-youtube') {
          <div class="bg-white px-12 py-12">
            <h2 class="mb-6 text-center text-3xl font-bold text-gray-900">{{ title('See it in action') }}</h2>
            <div class="relative mx-auto flex h-[300px] max-w-3xl items-center justify-center rounded-xl bg-gray-900">
              <span class="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-2xl text-gray-900">▶</span>
            </div>
          </div>
        }
        @case ('media-text-standard') {
          <div class="bg-white px-12 py-14">
            <div class="grid grid-cols-2 items-center gap-12">
              <div class="h-[260px] rounded-xl qf-art">
                @if (itemImage()) { <img [src]="itemImage()" alt="" class="h-full w-full rounded-xl object-cover" /> }
              </div>
              <div>
                <h2 class="mb-4 text-3xl font-bold text-gray-900">{{ itemTitle('Made to last') }}</h2>
                <p class="text-lg leading-relaxed text-gray-600">{{ itemText('Every piece is checked by hand before it ships to you.') }}</p>
              </div>
            </div>
          </div>
        }
        @case ('rich-text') {
          <div class="bg-white px-12 py-14">
            <div class="mx-auto max-w-3xl">
              <h2 class="mb-4 text-3xl font-bold text-gray-900">{{ title('About this collection') }}</h2>
              <p class="mb-3 text-lg leading-relaxed text-gray-600">Tell shoppers what makes it worth buying — materials, sizing, care, delivery.</p>
              <p class="text-lg leading-relaxed text-gray-600">Add as many paragraphs, headings and links as you need.</p>
            </div>
          </div>
        }
        @case ('custom-html') {
          <div class="bg-white px-12 py-14">
            <div class="mx-auto max-w-2xl rounded-xl border-2 border-dashed border-gray-300 px-8 py-12 text-center">
              <p class="mb-2 font-mono text-base text-gray-500">&lt;/&gt;</p>
              <p class="text-lg font-medium text-gray-700">Your own HTML goes here</p>
              <p class="mt-1 text-base text-gray-500">Embeds, widgets, or anything you paste in</p>
            </div>
          </div>
        }

        <!-- ── Features, benefits, trust ────────────────────────────────── -->
        @case ('feat-icons') { <ng-container *ngTemplateOutlet="iconRow" /> }
        @case ('benefits-standard') { <ng-container *ngTemplateOutlet="iconRow" /> }
        @case ('feat-cards') {
          <div class="bg-gray-50 px-12 py-12">
            <h2 class="mb-8 text-center text-3xl font-bold text-gray-900">{{ title('Why shop with us') }}</h2>
            <div class="grid grid-cols-3 gap-6">
              @for (item of iconItems(3); track $index) {
                <div class="rounded-xl bg-white p-7 shadow-sm">
                  <div class="mb-3 text-3xl">{{ item.icon }}</div>
                  <p class="mb-2 text-lg font-semibold text-gray-900">{{ item.title }}</p>
                  <p class="text-base text-gray-600">{{ item.text }}</p>
                </div>
              }
            </div>
          </div>
        }
        @case ('benefits-strip') {
          <div class="flex items-center justify-around border-y border-gray-200 bg-white px-12 py-8">
            @for (item of iconItems(3); track $index) {
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ item.icon }}</span>
                <div>
                  <p class="text-base font-semibold text-gray-900">{{ item.title }}</p>
                  <p class="text-sm text-gray-500">{{ item.text }}</p>
                </div>
              </div>
            }
          </div>
        }
        @case ('guarantee-standard') {
          <div class="bg-gray-50 px-12 py-12">
            <div class="mx-auto flex max-w-3xl items-center gap-6 rounded-2xl bg-white p-8 shadow-sm">
              <span class="text-5xl">{{ icon('🛡️') }}</span>
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ title('Satisfaction guaranteed') }}</p>
                <p class="mt-1 text-lg text-gray-600">{{ text('text', 'Or your money back, within 14 days.') }}</p>
              </div>
            </div>
          </div>
        }
        @case ('stats-standard') {
          <div class="grid grid-cols-3 gap-6 bg-white px-12 py-12 text-center">
            @for (s of statItems(); track $index) {
              <div>
                <p class="text-4xl font-bold" style="color: var(--qf-primary)">{{ s.value }}</p>
                <p class="mt-2 text-base text-gray-600">{{ s.label }}</p>
              </div>
            }
          </div>
        }
        @case ('test-cards') {
          <div class="bg-gray-50 px-12 py-12">
            <h2 class="mb-8 text-center text-3xl font-bold text-gray-900">{{ title('What our customers say') }}</h2>
            <div class="grid grid-cols-3 gap-6">
              @for (r of reviewItems(3); track $index) {
                <div class="rounded-xl bg-white p-6 shadow-sm">
                  <p class="mb-3 text-lg" style="color: #f59e0b">{{ stars(r.rating) }}</p>
                  <p class="mb-4 text-base leading-relaxed text-gray-700">“{{ r.text }}”</p>
                  <p class="text-sm font-medium text-gray-900">{{ r.name }}</p>
                </div>
              }
            </div>
          </div>
        }
        @case ('test-slider') {
          <div class="bg-white px-12 py-14 text-center">
            <h2 class="mb-6 text-3xl font-bold text-gray-900">{{ title('What our customers say') }}</h2>
            @for (r of reviewItems(1); track $index) {
              <div class="mx-auto max-w-2xl">
                <p class="mb-3 text-xl" style="color: #f59e0b">{{ stars(r.rating) }}</p>
                <p class="mb-4 text-xl leading-relaxed text-gray-700">“{{ r.text }}”</p>
                <p class="text-base font-medium text-gray-900">{{ r.name }}</p>
              </div>
            }
            <div class="mt-6 flex justify-center gap-2">
              <span class="h-2 w-8 rounded-full" style="background: var(--qf-primary)"></span>
              <span class="h-2 w-2 rounded-full bg-gray-300"></span>
              <span class="h-2 w-2 rounded-full bg-gray-300"></span>
            </div>
          </div>
        }
        @case ('reviews-standard') {
          <div class="bg-white px-12 py-12">
            <div class="mb-6 flex items-center gap-4">
              <h2 class="text-3xl font-bold text-gray-900">{{ title('Customer reviews') }}</h2>
              <span class="text-lg" style="color: #f59e0b">★★★★★</span>
              <span class="text-base text-gray-500">4.8 out of 5</span>
            </div>
            <div class="space-y-4">
              @for (r of reviewItems(2); track $index) {
                <div class="rounded-xl border border-gray-200 p-5">
                  <div class="mb-2 flex items-center gap-3">
                    <span class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-600">{{ initial(r.name) }}</span>
                    <span class="text-base font-medium text-gray-900">{{ r.name }}</span>
                    <span style="color: #f59e0b">{{ stars(r.rating) }}</span>
                  </div>
                  <p class="text-base text-gray-700">{{ r.text }}</p>
                </div>
              }
            </div>
          </div>
        }
        @case ('comparison-standard') {
          <div class="bg-white px-12 py-12">
            <h2 class="mb-6 text-center text-3xl font-bold text-gray-900">{{ title('Why we are different') }}</h2>
            <div class="mx-auto max-w-3xl overflow-hidden rounded-xl border border-gray-200">
              <div class="grid grid-cols-3 bg-gray-50 px-6 py-3 text-base font-semibold text-gray-700">
                <span></span><span class="text-center">{{ text('usLabel', 'Us') }}</span><span class="text-center">{{ text('themLabel', 'Others') }}</span>
              </div>
              @for (row of comparisonRows(); track $index) {
                <div class="grid grid-cols-3 border-t border-gray-200 px-6 py-3 text-base text-gray-700">
                  <span>{{ row.label }}</span>
                  <span class="text-center text-green-600">{{ row.us ? '✓' : '—' }}</span>
                  <span class="text-center text-gray-400">{{ row.them ? '✓' : '—' }}</span>
                </div>
              }
            </div>
          </div>
        }
        @case ('before-after-standard') {
          <div class="bg-white px-12 py-12">
            <h2 class="mb-6 text-center text-3xl font-bold text-gray-900">{{ title('See the difference') }}</h2>
            <div class="relative mx-auto h-[280px] max-w-3xl overflow-hidden rounded-xl qf-art">
              <div class="absolute inset-y-0 left-0 w-1/2 bg-gray-800/70"></div>
              <div class="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-white"></div>
              <span class="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-700">↔</span>
              <span class="absolute bottom-4 left-4 rounded bg-black/60 px-3 py-1 text-sm text-white">{{ text('beforeLabel', 'Before') }}</span>
              <span class="absolute bottom-4 right-4 rounded bg-black/60 px-3 py-1 text-sm text-white">{{ text('afterLabel', 'After') }}</span>
            </div>
          </div>
        }
        @case ('faq-accordion') {
          <div class="bg-white px-12 py-12">
            <h2 class="mb-6 text-center text-3xl font-bold text-gray-900">{{ title('Frequently asked questions') }}</h2>
            <div class="mx-auto max-w-3xl space-y-3">
              @for (q of faqItems(3); track $index) {
                <div class="rounded-xl border border-gray-200 px-6 py-4">
                  <div class="flex items-center justify-between">
                    <p class="text-lg font-medium text-gray-900">{{ q.question }}</p>
                    <span class="text-xl text-gray-400">+</span>
                  </div>
                  @if ($first && q.answer) {
                    <p class="mt-2 text-base text-gray-600">{{ q.answer }}</p>
                  }
                </div>
              }
            </div>
          </div>
        }
        @case ('specs-standard') {
          <div class="bg-white px-12 py-12">
            <h2 class="mb-6 text-3xl font-bold text-gray-900">{{ title('Specifications') }}</h2>
            <div class="mx-auto max-w-3xl overflow-hidden rounded-xl border border-gray-200">
              @for (g of specGroups(); track $index) {
                <div class="bg-gray-50 px-6 py-3 text-base font-semibold text-gray-800">{{ g.name }}</div>
                @for (row of g.rows; track $index) {
                  <div class="grid grid-cols-2 border-t border-gray-200 px-6 py-3 text-base">
                    <span class="text-gray-500">{{ row.label }}</span>
                    <span class="text-gray-900">{{ row.value }}</span>
                  </div>
                }
              }
            </div>
          </div>
        }

        <!-- ── Offers & checkout ────────────────────────────────────────── -->
        @case ('cta-band') {
          <div class="px-12 py-16 text-center" style="background: var(--qf-primary)">
            <h2 class="mb-3 text-4xl font-bold text-white">{{ title('Ready to get yours?') }}</h2>
            <p class="mb-7 text-lg text-white/85">{{ subtitle('Order now while stock lasts') }}</p>
            <span class="inline-block rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-gray-900">{{ button('Shop now') }}</span>
          </div>
        }
        @case ('cta-button') {
          <div class="bg-white px-12 py-10 text-center">
            <span class="inline-flex items-center gap-3 rounded-xl px-8 py-4 text-lg font-semibold text-white"
              [style.background]="isWhatsApp() ? '#25D366' : 'var(--qf-primary)'">
              @if (isWhatsApp()) { <span>💬</span> }
              {{ text('text', 'Order on WhatsApp') }}
            </span>
          </div>
        }
        @case ('countdown-standard') {
          <div class="bg-gray-900 px-12 py-12 text-center">
            <p class="mb-5 text-2xl font-semibold text-white">{{ title('Hurry — offer ends in') }}</p>
            <div class="flex justify-center gap-4">
              @for (unit of countdownUnits; track unit.label) {
                <div class="w-24 rounded-xl bg-white/10 py-4">
                  <p class="text-3xl font-bold text-white">{{ unit.value }}</p>
                  <p class="mt-1 text-sm text-white/60">{{ unit.label }}</p>
                </div>
              }
            </div>
          </div>
        }
        @case ('news-inline') {
          <div class="px-12 py-12 text-center" style="background: color-mix(in srgb, var(--qf-primary) 8%, white)">
            <h2 class="mb-2 text-3xl font-bold text-gray-900">{{ title('Stay in the loop') }}</h2>
            <p class="mb-6 text-lg text-gray-600">{{ subtitle('Offers and new arrivals, no spam.') }}</p>
            <div class="mx-auto flex max-w-xl gap-3">
              <span class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-start text-base text-gray-400">your&#64;email.com</span>
              <span class="rounded-lg px-6 py-3 text-base font-semibold text-white qf-btn">{{ button('Subscribe') }}</span>
            </div>
          </div>
        }
        @case ('news-card') {
          <div class="bg-white px-12 py-12">
            <div class="mx-auto max-w-2xl rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
              <h2 class="mb-2 text-2xl font-bold text-gray-900">{{ title('Stay in the loop') }}</h2>
              <p class="mb-6 text-base text-gray-600">{{ subtitle('Offers and new arrivals, no spam.') }}</p>
              <div class="flex gap-3">
                <span class="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-start text-base text-gray-400">your&#64;email.com</span>
                <span class="rounded-lg px-6 py-3 text-base font-semibold text-white qf-btn">{{ button('Subscribe') }}</span>
              </div>
            </div>
          </div>
        }
        @case ('order-form') {
          <div class="bg-gray-50 px-12 py-12">
            <div class="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
              <h2 class="mb-5 text-2xl font-bold text-gray-900">{{ title('Complete your order') }}</h2>
              @if (firstProduct(); as p) {
                <div class="mb-5 flex items-center gap-4 rounded-xl border border-gray-200 p-4">
                  <div class="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                    @if (p.imageUrl) { <img [src]="p.imageUrl" alt="" class="h-full w-full object-cover" /> }
                    @else { <div class="h-full w-full qf-art"></div> }
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-base font-medium text-gray-900">{{ p.name }}</p>
                    <p class="text-base font-semibold" style="color: var(--qf-primary)">{{ price(p.price) }}</p>
                  </div>
                </div>
              }
              <div class="mb-3 grid grid-cols-2 gap-3">
                <span class="rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-400">Full name</span>
                <span class="rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-400">Phone number</span>
              </div>
              <span class="mb-4 block rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-400">Delivery address</span>
              <span class="block rounded-lg py-3.5 text-center text-lg font-semibold text-white qf-btn">{{ button('Order now') }}</span>
            </div>
          </div>
        }
        @case ('bundle-tiers') {
          <div class="bg-white px-12 py-12">
            <h2 class="mb-6 text-center text-3xl font-bold text-gray-900">{{ title('Choose your offer') }}</h2>
            <div class="mx-auto grid max-w-3xl grid-cols-3 gap-4">
              @for (tier of bundleTiers(); track $index) {
                <div class="rounded-xl border-2 p-6 text-center"
                  [style.border-color]="tier.highlight ? 'var(--qf-primary)' : '#e5e7eb'">
                  @if (tier.badge) {
                    <span class="mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white" style="background: var(--qf-primary)">{{ tier.badge }}</span>
                  }
                  <p class="text-2xl font-bold text-gray-900">{{ tier.qty }}×</p>
                  <p class="mt-1 text-base text-gray-600">{{ tier.label }}</p>
                  <p class="mt-2 text-lg font-semibold" style="color: var(--qf-primary)">{{ tierPrice(tier.qty) }}</p>
                </div>
              }
            </div>
          </div>
        }
        @case ('sticky-bar') {
          <div class="bg-gray-100 px-12 pb-6 pt-12">
            <div class="flex items-center gap-4 rounded-xl bg-white px-6 py-4 shadow-lg">
              @if (firstProduct(); as p) {
                <div class="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                  @if (p.imageUrl) { <img [src]="p.imageUrl" alt="" class="h-full w-full object-cover" /> }
                  @else { <div class="h-full w-full qf-art"></div> }
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-base font-medium text-gray-900">{{ p.name }}</p>
                  <p class="text-base font-semibold" style="color: var(--qf-primary)">{{ price(p.price) }}</p>
                </div>
              }
              <span class="rounded-lg px-8 py-3 text-base font-semibold text-white qf-btn">{{ button('Add to cart') }}</span>
            </div>
          </div>
        }

        @default {
          <div class="flex h-[200px] items-center justify-center bg-gray-50">
            <p class="text-lg text-gray-400">{{ fallbackLabel() }}</p>
          </div>
        }
      }
    </div>

    <!-- Shared by "Feature highlights" and "Benefits", which render the same row. -->
    <ng-template #iconRow>
      <div class="bg-white px-12 py-12">
        @if (title('')) {
          <h2 class="mb-8 text-center text-3xl font-bold text-gray-900">{{ title('') }}</h2>
        }
        <div class="grid grid-cols-3 gap-8 text-center">
          @for (item of iconItems(3); track $index) {
            <div>
              <div class="mb-3 text-4xl">{{ item.icon }}</div>
              <p class="mb-1 text-lg font-semibold text-gray-900">{{ item.title }}</p>
              <p class="text-base text-gray-600">{{ item.text }}</p>
            </div>
          }
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; }
    .qf-mini { width: 1200px; font-family: inherit; }
    /* Placeholder artwork for slots with no data source of their own. */
    .qf-art {
      position: relative;
      background:
        linear-gradient(135deg, color-mix(in srgb, var(--qf-primary) 55%, #1f2937), color-mix(in srgb, var(--qf-primary) 15%, #111827));
      overflow: hidden;
    }
    .qf-btn { background: var(--qf-primary); }
  `]
})
export class SectionMiniatureComponent {
  /** Which visual variant to draw. */
  variantId = input.required<string>();
  /** Seller-facing type name, shown by the fallback rendering. */
  typeLabel = input<string>('Section');
  /**
   * The real section when previewing something already on the canvas; omitted
   * for library cards, which draw the type's defaults instead.
   */
  section = input<SectionConfigurationDto | null>(null);

  private data = inject(SectionPreviewDataService);

  readonly countdownUnits = [
    { value: '01', label: 'Days' },
    { value: '08', label: 'Hours' },
    { value: '24', label: 'Mins' },
    { value: '36', label: 'Secs' }
  ];

  primary = computed(() => this.data.primaryColor());

  private content = computed<Record<string, unknown>>(() => {
    const raw = this.section()?.contentJson;
    if (!raw) return {};
    try {
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  });

  /** Reads a bilingual (`{en,ar}` / `{english,arabic}`) or plain string value. */
  private read(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      const o = value as Record<string, unknown>;
      const candidates = [o['en'], o['english'], o['ar'], o['arabic']];
      for (const c of candidates) {
        if (typeof c === 'string' && c.trim()) return c;
      }
    }
    return '';
  }

  text(field: string, fallback = ''): string {
    return this.read(this.content()[field]) || fallback;
  }

  title(fallback = ''): string { return this.text('title', fallback); }
  subtitle(fallback = ''): string { return this.text('subtitle', fallback); }
  button(fallback = ''): string { return this.text('buttonText', fallback); }
  icon(fallback = ''): string { return this.text('icon', fallback); }

  imageUrl(): string {
    return this.text('imageUrl') || this.text('url') || '';
  }

  isWhatsApp(): boolean {
    return this.text('style') === 'whatsapp';
  }

  fallbackLabel(): string {
    return `${this.typeLabel()} preview`;
  }

  private array(field: string): Record<string, unknown>[] {
    const value = this.content()[field];
    return Array.isArray(value) ? value as Record<string, unknown>[] : [];
  }

  products(count: number): PreviewProduct[] {
    return this.data.products().slice(0, count);
  }

  firstProduct(): PreviewProduct | null {
    return this.data.products()[0] ?? null;
  }

  categories(count: number): PreviewCategory[] {
    return this.data.categories().slice(0, count);
  }

  price(amount: number): string {
    const symbol = this.data.currencySymbol();
    const value = Number.isFinite(amount) ? amount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';
    return symbol ? `${value} ${symbol}` : value;
  }

  tierPrice(qty: unknown): string {
    const unit = this.firstProduct()?.price ?? 0;
    const n = typeof qty === 'number' ? qty : 1;
    return this.price(unit * n);
  }

  // ── Repeating content, each with a placeholder fallback ──

  iconItems(count: number): { icon: string; title: string; text: string }[] {
    const items = this.array('items');
    const mapped = items.slice(0, count).map(item => ({
      icon: typeof item['icon'] === 'string' ? item['icon'] : '✓',
      title: this.read(item['title']),
      text: this.read(item['text'])
    })).filter(i => i.title || i.text);

    if (mapped.length) return mapped;
    return [
      { icon: '🚚', title: 'Fast delivery', text: 'Days, not weeks' },
      { icon: '💳', title: 'Secure payment', text: 'Your data stays safe' },
      { icon: '↩️', title: 'Easy returns', text: 'No questions asked' }
    ].slice(0, count);
  }

  reviewItems(count: number): { name: string; rating: number; text: string }[] {
    const items = this.array('items');
    const mapped = items.slice(0, count).map(item => ({
      name: typeof item['name'] === 'string' && item['name'] ? item['name'] : 'Customer',
      rating: typeof item['rating'] === 'number' ? item['rating'] : 5,
      text: this.read(item['text'])
    })).filter(i => i.text);

    if (mapped.length) return mapped;
    return [
      { name: 'Sara M.', rating: 5, text: 'Arrived quickly and exactly as described.' },
      { name: 'Omar K.', rating: 5, text: 'Great quality for the price. Will order again.' },
      { name: 'Nour A.', rating: 4, text: 'Friendly support, easy checkout.' }
    ].slice(0, count);
  }

  faqItems(count: number): { question: string; answer: string }[] {
    const items = this.array('items');
    const mapped = items.slice(0, count).map(item => ({
      question: this.read(item['question']),
      answer: this.read(item['answer'])
    })).filter(i => i.question);

    if (mapped.length) return mapped;
    return [
      { question: 'How long does delivery take?', answer: 'Typically 2–5 business days.' },
      { question: 'Can I return an item?', answer: '' },
      { question: 'Which payment methods do you accept?', answer: '' }
    ].slice(0, count);
  }

  statItems(): { value: string; label: string }[] {
    const items = this.array('items');
    const mapped = items.slice(0, 3).map(item => ({
      value: typeof item['value'] === 'string' ? item['value'] : String(item['value'] ?? ''),
      label: this.read(item['label'])
    })).filter(i => i.value);

    if (mapped.length) return mapped;
    return [
      { value: '12k+', label: 'Orders delivered' },
      { value: '4.8', label: 'Average rating' },
      { value: '24h', label: 'Support response' }
    ];
  }

  comparisonRows(): { label: string; us: boolean; them: boolean }[] {
    const rows = this.array('rows');
    const mapped = rows.slice(0, 4).map(row => ({
      label: this.read(row['label']),
      us: row['us'] === true,
      them: row['them'] === true
    })).filter(r => r.label);

    if (mapped.length) return mapped;
    return [
      { label: 'Free delivery', us: true, them: false },
      { label: '14-day returns', us: true, them: false },
      { label: 'Local support', us: true, them: true }
    ];
  }

  specGroups(): { name: string; rows: { label: string; value: string }[] }[] {
    const groups = this.array('groups');
    const mapped = groups.slice(0, 2).map(group => ({
      name: this.read(group['name']) || 'Details',
      rows: (Array.isArray(group['rows']) ? group['rows'] as Record<string, unknown>[] : [])
        .slice(0, 3)
        .map(row => ({ label: this.read(row['label']), value: this.read(row['value']) }))
        .filter(r => r.label)
    })).filter(g => g.rows.length);

    if (mapped.length) return mapped;
    return [{
      name: 'General',
      rows: [
        { label: 'Material', value: 'Premium cotton' },
        { label: 'Warranty', value: '12 months' },
        { label: 'In the box', value: 'Product + care guide' }
      ]
    }];
  }

  bundleTiers(): { qty: number; label: string; badge: string; highlight: boolean }[] {
    const tiers = this.array('tiers');
    const mapped = tiers.slice(0, 3).map(tier => ({
      qty: typeof tier['qty'] === 'number' ? tier['qty'] : 1,
      label: this.read(tier['label']),
      badge: this.read(tier['badge']),
      highlight: tier['highlight'] === true
    }));

    if (mapped.length) return mapped;
    return [
      { qty: 1, label: 'Single', badge: '', highlight: false },
      { qty: 2, label: 'Two pieces', badge: 'Most popular', highlight: true },
      { qty: 3, label: 'Three pieces', badge: 'Best value', highlight: false }
    ];
  }

  marqueeMessages(): string[] {
    const messages = this.array('messages')
      .map(m => this.read(m['text']))
      .filter(Boolean);

    if (messages.length) return messages.slice(0, 4);
    return ['Free returns within 14 days', 'Cash on delivery available', 'Ships in 24 hours', 'Rated 4.8 by shoppers'];
  }

  // ── First-item shortcuts for single-row sections ──

  private firstItem(field: string): Record<string, unknown> {
    return this.array(field)[0] ?? {};
  }

  itemTitle(fallback: string): string {
    return this.read(this.firstItem('items')['title']) || fallback;
  }

  itemText(fallback: string): string {
    return this.read(this.firstItem('items')['text']) || fallback;
  }

  itemImage(): string {
    const url = this.firstItem('items')['imageUrl'];
    return typeof url === 'string' ? url : '';
  }

  slideTitle(fallback: string): string {
    return this.read(this.firstItem('slides')['title']) || fallback;
  }

  slideSubtitle(fallback: string): string {
    return this.read(this.firstItem('slides')['subtitle']) || fallback;
  }

  stars(rating: number): string {
    const filled = Math.max(0, Math.min(5, Math.round(rating)));
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  }

  initial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }
}
