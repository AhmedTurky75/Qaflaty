import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DownsellService } from '../../services/downsell.service';
import { I18nService } from '../../services/i18n.service';
import { StorePricePipe } from '../../pipes/store-price.pipe';

@Component({
  selector: 'app-downsell-modal',
  standalone: true,
  imports: [CommonModule, RouterModule, StorePricePipe],
  template: `
    @if (downsell.activeOffer(); as offer) {
      <div class="ds-backdrop" (click)="downsell.dismiss()">
        <div class="ds-modal" (click)="$event.stopPropagation()">
          <button type="button" class="ds-close" (click)="downsell.dismiss()" aria-label="Close">×</button>

          <h2 class="ds-title">Wait — before you go!</h2>

          @if (offer.coupon) {
            <div class="ds-coupon">
              <p class="ds-coupon__lead">Here's a little something to help you decide:</p>
              <div class="ds-coupon__code" (click)="copyCoupon(offer.coupon.code)">
                {{ offer.coupon.code }}
                <span class="ds-coupon__copy">Tap to copy</span>
              </div>
              @if (offer.coupon.description) {
                <p class="ds-coupon__desc">{{ offer.coupon.description }}</p>
              }
            </div>
          }

          @if (offer.downsellProducts.length > 0) {
            <p class="ds-alt-lead">Or maybe one of these fits better:</p>
            <div class="ds-products">
              @for (p of offer.downsellProducts; track p.id) {
                <a class="ds-product" [routerLink]="['/products', p.slug]" (click)="downsell.accept()">
                  <div class="ds-product__img">
                    @if (p.images?.length) {
                      <img [src]="p.images[0].url" [alt]="i18n.nameFor(p.name, p.nameAr)" loading="lazy" />
                    } @else {
                      <div class="ds-product__ph">🛍️</div>
                    }
                  </div>
                  <div class="ds-product__name">{{ i18n.nameFor(p.name, p.nameAr) }}</div>
                  <div class="ds-product__price">{{ p.price | storePrice }}</div>
                </a>
              }
            </div>
          }

          <button type="button" class="ds-dismiss" (click)="downsell.dismiss()">No thanks, continue</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .ds-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 1000;
      display: flex; align-items: center; justify-content: center; padding: 1rem;
    }
    .ds-modal {
      background: #fff; border-radius: 16px; padding: 1.75rem; max-width: 420px; width: 100%;
      position: relative; max-height: 90vh; overflow-y: auto;
    }
    .ds-close {
      position: absolute; top: .75rem; right: .75rem; border: none; background: transparent;
      font-size: 1.5rem; line-height: 1; cursor: pointer; color: #6b7280; width: 32px; height: 32px;
    }
    .ds-title { font-size: 1.3rem; font-weight: 700; margin: 0 0 1rem; }
    .ds-coupon { background: #fef3c7; border: 1px dashed #d97706; border-radius: 12px; padding: 1rem; margin-bottom: 1.25rem; text-align: center; }
    .ds-coupon__lead { margin: 0 0 .5rem; font-size: .9rem; color: #78350f; }
    .ds-coupon__code {
      font-size: 1.4rem; font-weight: 800; letter-spacing: .1em; color: #92400e; cursor: pointer;
      display: flex; flex-direction: column; align-items: center; gap: .15rem;
    }
    .ds-coupon__copy { font-size: .65rem; font-weight: 500; color: #b45309; letter-spacing: 0; }
    .ds-coupon__desc { margin: .5rem 0 0; font-size: .8rem; color: #92400e; }
    .ds-alt-lead { font-size: .9rem; color: #374151; margin: 0 0 .75rem; }
    .ds-products { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: .65rem; margin-bottom: 1.25rem; }
    .ds-product { display: block; border: 1px solid #eee; border-radius: 10px; overflow: hidden; text-decoration: none; color: inherit; }
    .ds-product__img { aspect-ratio: 1; background: #f7f7f7; }
    .ds-product__img img { width: 100%; height: 100%; object-fit: contain; }
    .ds-product__ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; opacity: .4; }
    .ds-product__name { padding: .4rem .5rem 0; font-size: .78rem; font-weight: 500; line-height: 1.3;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .ds-product__price { padding: 0 .5rem .5rem; font-size: .78rem; font-weight: 700; }
    .ds-dismiss { width: 100%; border: none; background: transparent; color: #6b7280; padding: .5rem; cursor: pointer; font-size: .85rem; text-decoration: underline; }
  `]
})
export class DownsellModalComponent {
  downsell = inject(DownsellService);
  i18n = inject(I18nService);

  copyCoupon(code: string): void {
    navigator.clipboard?.writeText(code).catch(() => {});
  }
}
