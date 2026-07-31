import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PageExperimentDto, PageVariantDto, SectionConfigurationDto } from 'shared';
import { environment } from '../../environments/environment';

/**
 * Resolves A/B experiments for storefront pages. Picks a sticky variant per
 * visitor from the server-provided weights, remembers the assignment in
 * localStorage, and fires placeholder impression/conversion events.
 *
 * `resolve()` returns the variant's section list to render, or null to render
 * the control (the page's own sections).
 */
@Injectable({ providedIn: 'root' })
export class ExperimentService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  private readonly ASSIGN_KEY = 'qaflaty-ab-assignments';

  resolve(slug: string): Observable<SectionConfigurationDto[] | null> {
    return this.http.get<PageExperimentDto>(`${this.api}/storefront/pages/${slug}/experiment`).pipe(
      map(exp => this.pick(exp)),
      catchError(() => of(null))
    );
  }

  /**
   * Attribute a conversion to whichever variant this visitor was assigned on
   * each page. `dedupeKey` (e.g. an order number) prevents double counting on
   * refresh of the confirmation page.
   */
  trackConversion(dedupeKey: string): void {
    const guard = `qaflaty-ab-cvr:${dedupeKey}`;
    try {
      if (sessionStorage.getItem(guard) === '1') return;
      sessionStorage.setItem(guard, '1');
    } catch { /* ignore */ }

    const assignments = this.readAssignments();
    for (const [pageId, variantId] of Object.entries(assignments)) {
      if (variantId && variantId !== 'control') {
        this.postEvent(pageId, variantId, 'conversion');
      }
    }
  }

  private pick(exp: PageExperimentDto): SectionConfigurationDto[] | null {
    const active = (exp.variants || []).filter(v => v.isActive && v.weight > 0);

    const assignments = this.readAssignments();
    let chosen = assignments[exp.pageId];
    const stillValid = chosen === 'control' || active.some(v => v.id === chosen);
    if (!stillValid) {
      chosen = this.weightedPick(exp.controlWeight, active);
      assignments[exp.pageId] = chosen;
      this.writeAssignments(assignments);
    }

    if (chosen === 'control') return null;

    this.trackImpressionOnce(exp.pageId, chosen);
    const variant = active.find(v => v.id === chosen);
    if (variant?.sectionsJson) {
      try { return JSON.parse(variant.sectionsJson) as SectionConfigurationDto[]; }
      catch { return null; }
    }
    return null;
  }

  private weightedPick(controlWeight: number, variants: PageVariantDto[]): string {
    const total = Math.max(0, controlWeight) + variants.reduce((s, v) => s + v.weight, 0);
    if (total <= 0) return 'control';
    let r = Math.random() * total;
    if ((r -= Math.max(0, controlWeight)) < 0) return 'control';
    for (const v of variants) {
      if ((r -= v.weight) < 0) return v.id;
    }
    return 'control';
  }

  private trackImpressionOnce(pageId: string, variantId: string): void {
    const key = `qaflaty-ab-imp:${pageId}:${variantId}`;
    try {
      if (sessionStorage.getItem(key) === '1') return;
      sessionStorage.setItem(key, '1');
    } catch { /* ignore */ }
    this.postEvent(pageId, variantId, 'impression');
  }

  private postEvent(pageId: string, variantId: string, eventType: 'impression' | 'conversion'): void {
    this.http.post(`${this.api}/storefront/variant-event`, { pageId, variantId, eventType })
      .subscribe({ next: () => {}, error: () => {} });
  }

  private readAssignments(): Record<string, string> {
    try {
      const raw = localStorage.getItem(this.ASSIGN_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  private writeAssignments(assignments: Record<string, string>): void {
    try { localStorage.setItem(this.ASSIGN_KEY, JSON.stringify(assignments)); }
    catch { /* ignore */ }
  }
}
