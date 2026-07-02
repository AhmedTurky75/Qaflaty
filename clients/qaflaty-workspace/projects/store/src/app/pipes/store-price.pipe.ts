import { Pipe, PipeTransform, inject } from '@angular/core';
import { formatCurrency, getCurrencySymbol } from '@angular/common';
import { ConfigService } from '../services/config.service';

/**
 * Formats a numeric amount using the store's single configured currency
 * (code + symbol come from the storefront config). Replaces the previously
 * hardcoded `| currency:'EGP'` / `'SAR'` usages so every price, delivery fee,
 * and total across the storefront follows the one currency the merchant picked.
 *
 * Usage: `{{ product.price | storePrice }}` → "ج.م 199.00"
 *        `{{ total | storePrice:'code' }}`  → "EGP 199.00"
 *
 * Impure so it re-renders once the config signal resolves after app start.
 */
@Pipe({ name: 'storePrice', standalone: true, pure: false })
export class StorePricePipe implements PipeTransform {
  private config = inject(ConfigService);

  transform(
    value: number | null | undefined,
    display: 'symbol' | 'code' = 'symbol',
    digitsInfo: string = '1.2-2'
  ): string {
    if (value === null || value === undefined || isNaN(value)) return '';

    const cfg = this.config.config();
    const code = cfg?.currency ?? 'EGP';
    const symbol =
      display === 'code'
        ? `${code} `
        : cfg?.currencySymbol || getCurrencySymbol(code, 'narrow', 'en');

    return formatCurrency(value, 'en', symbol, code, digitsInfo);
  }
}
