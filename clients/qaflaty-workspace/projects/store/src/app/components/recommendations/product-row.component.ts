import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../models/product.model';
import { I18nService } from '../../services/i18n.service';
import { StorePricePipe } from '../../pipes/store-price.pipe';

@Component({
  selector: 'app-product-row',
  standalone: true,
  imports: [CommonModule, RouterModule, StorePricePipe],
  template: `
    @if (products().length > 0) {
      <section class="rec-row">
        <h2 class="rec-row__title">{{ title() }}</h2>
        <div class="rec-row__track">
          @for (p of products(); track p.id) {
            <a class="rec-card" [routerLink]="['/products', p.slug]">
              <div class="rec-card__img">
                @if (p.images?.length) {
                  <img [src]="p.images[0].url" [alt]="p.images[0].altText || i18n.nameFor(p.name, p.nameAr)" loading="lazy" />
                } @else {
                  <div class="rec-card__placeholder">🛍️</div>
                }
                @if (p.compareAtPrice && p.compareAtPrice > p.price) {
                  <span class="rec-card__badge">-{{ discount(p) }}%</span>
                }
              </div>
              <div class="rec-card__name">{{ i18n.nameFor(p.name, p.nameAr) }}</div>
              <div class="rec-card__price">
                <span class="now">{{ p.price | storePrice }}</span>
                @if (p.compareAtPrice && p.compareAtPrice > p.price) {
                  <span class="was">{{ p.compareAtPrice | storePrice }}</span>
                }
              </div>
            </a>
          }
        </div>
      </section>
    }
  `,
  styles: [`
    .rec-row { margin-top: 2.5rem; }
    .rec-row__title { font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: #1a1a1a; }
    .rec-row__track {
      display: grid; grid-auto-flow: column; grid-auto-columns: minmax(160px, 1fr);
      gap: 1rem; overflow-x: auto; padding-bottom: .5rem; scroll-snap-type: x mandatory;
    }
    @media (min-width: 768px) { .rec-row__track { grid-auto-columns: minmax(190px, 1fr); } }
    .rec-card {
      display: block; background: #fff; border: 1px solid #eee; border-radius: 12px;
      overflow: hidden; text-decoration: none; color: inherit; scroll-snap-align: start;
      transition: box-shadow .2s, transform .2s;
    }
    .rec-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.08); transform: translateY(-2px); }
    .rec-card__img { position: relative; aspect-ratio: 1; background: #f7f7f7; }
    .rec-card__img img { width: 100%; height: 100%; object-fit: contain; }
    .rec-card__placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2rem; opacity: .4; }
    .rec-card__badge { position: absolute; top: 8px; right: 8px; background: #e3342f; color: #fff; font-size: .7rem; font-weight: 700; padding: .15rem .5rem; border-radius: 99px; }
    .rec-card__name { padding: .65rem .75rem .25rem; font-size: .9rem; font-weight: 500; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .rec-card__price { padding: 0 .75rem .75rem; display: flex; gap: .5rem; align-items: baseline; }
    .rec-card__price .now { font-weight: 700; color: #1a1a1a; }
    .rec-card__price .was { font-size: .8rem; color: #999; text-decoration: line-through; }
  `]
})
export class ProductRowComponent {
  i18n = inject(I18nService);
  title = input<string>('');
  products = input<Product[]>([]);

  discount(p: Product): number {
    if (!p.compareAtPrice || p.compareAtPrice <= p.price) return 0;
    return Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100);
  }
}
