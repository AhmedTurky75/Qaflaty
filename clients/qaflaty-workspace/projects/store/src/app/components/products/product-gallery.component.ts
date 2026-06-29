import { Component, input, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductImage } from '../../models/product.model';

@Component({
  selector: 'app-product-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-gallery.component.html',
  styleUrls: ['./product-gallery.component.css']
})
export class ProductGalleryComponent {
  images = input<ProductImage[]>([]);
  productName = input<string>('');
  /** Optional discount % badge shown on the main image. */
  discountPercent = input<number | null>(null);

  currentIndex = signal(0);
  fullscreen = signal(false);
  zoomed = signal(false);
  origin = signal({ x: 50, y: 50 });

  private touchStartX = 0;

  current = computed(() => {
    const imgs = this.images();
    const i = this.currentIndex();
    return imgs.length > 0 ? imgs[Math.min(i, imgs.length - 1)] : null;
  });

  hasMultiple = computed(() => this.images().length > 1);

  select(i: number) {
    this.currentIndex.set(i);
    this.resetZoom();
  }

  next() {
    const len = this.images().length;
    if (len === 0) return;
    this.currentIndex.set((this.currentIndex() + 1) % len);
    this.resetZoom();
  }

  prev() {
    const len = this.images().length;
    if (len === 0) return;
    this.currentIndex.set((this.currentIndex() - 1 + len) % len);
    this.resetZoom();
  }

  openFullscreen() {
    if (this.current()) this.fullscreen.set(true);
  }

  closeFullscreen() {
    this.fullscreen.set(false);
    this.resetZoom();
  }

  toggleZoom() {
    this.zoomed.update(z => !z);
  }

  private resetZoom() {
    this.zoomed.set(false);
    this.origin.set({ x: 50, y: 50 });
  }

  onPointerMove(event: MouseEvent, el: HTMLElement) {
    if (!this.zoomed()) return;
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.origin.set({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0]?.clientX ?? 0;
  }

  onTouchEnd(event: TouchEvent) {
    const endX = event.changedTouches[0]?.clientX ?? 0;
    const delta = endX - this.touchStartX;
    if (Math.abs(delta) > 40) {
      if (delta < 0) this.next();
      else this.prev();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // Don't hijack keys while the user is typing in a form field.
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

    // Arrow navigation only matters in fullscreen (avoids surprises while scrolling the page).
    if (this.fullscreen()) {
      if (event.key === 'ArrowRight') this.next();
      else if (event.key === 'ArrowLeft') this.prev();
      else if (event.key === 'Escape') this.closeFullscreen();
    }
  }
}
