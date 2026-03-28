import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CountryPhoneInfo } from '../models/phone.models';

@Injectable({ providedIn: 'root' })
export class PhoneService {
  private readonly http = inject(HttpClient);
  private readonly _countries = signal<CountryPhoneInfo[]>([]);
  readonly countries = this._countries.asReadonly();
  private _loaded = false;

  load(): void {
    if (this._loaded) return;
    this._loaded = true;
    this.http.get<CountryPhoneInfo[]>('/api/phone/countries').subscribe({
      next: data => this._countries.set(data),
      error: () => { /* silently fall back — no validation if API unavailable */ }
    });
  }

  getByRegion(regionCode: string): CountryPhoneInfo | undefined {
    return this._countries().find(c => c.regionCode === regionCode);
  }
}
