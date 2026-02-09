import { Injectable, effect, inject } from '@angular/core';
import { StoreService } from './store.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private storeService = inject(StoreService);

  constructor() {
    // Apply theme when store changes
    effect(() => {
      const store = this.storeService.currentStore();
      if (store) {
        this.applyTheme(store.branding.primaryColor);
        this.updateFavicon(store.branding.logoUrl);
        this.updateTitle(store.name);
      }
    });
  }

  /**
   * Apply dynamic theme color using CSS custom properties
   */
  applyTheme(primaryColor: string): void {
    const root = document.documentElement;

    // Set the primary color
    root.style.setProperty('--primary-color', primaryColor);

    // Generate variations
    const rgb = this.hexToRgb(primaryColor);
    if (rgb) {
      // Lighter variations
      root.style.setProperty('--primary-50', this.rgbToString({...rgb, a: 0.05}));
      root.style.setProperty('--primary-100', this.rgbToString({...rgb, a: 0.1}));
      root.style.setProperty('--primary-200', this.rgbToString({...rgb, a: 0.2}));
      root.style.setProperty('--primary-light', this.lightenColor(rgb, 20));

      // Darker variations
      root.style.setProperty('--primary-dark', this.darkenColor(rgb, 20));

      // Hover state
      root.style.setProperty('--primary-hover', this.darkenColor(rgb, 10));
    }
  }

  /**
   * Update page title
   */
  updateTitle(storeName: string): void {
    document.title = storeName;
  }

  /**
   * Update favicon
   */
  updateFavicon(logoUrl?: string): void {
    if (!logoUrl) return;

    const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = logoUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Convert RGB to string
   */
  private rgbToString(rgb: { r: number; g: number; b: number; a?: number }): string {
    if (rgb.a !== undefined) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`;
    }
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  /**
   * Lighten color
   */
  private lightenColor(rgb: { r: number; g: number; b: number }, percent: number): string {
    const factor = 1 + (percent / 100);
    return this.rgbToString({
      r: Math.min(255, Math.round(rgb.r * factor)),
      g: Math.min(255, Math.round(rgb.g * factor)),
      b: Math.min(255, Math.round(rgb.b * factor))
    });
  }

  /**
   * Darken color
   */
  private darkenColor(rgb: { r: number; g: number; b: number }, percent: number): string {
    const factor = 1 - (percent / 100);
    return this.rgbToString({
      r: Math.max(0, Math.round(rgb.r * factor)),
      g: Math.max(0, Math.round(rgb.g * factor)),
      b: Math.max(0, Math.round(rgb.b * factor))
    });
  }
}
