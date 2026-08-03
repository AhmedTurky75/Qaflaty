import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

const MERCHANT = { id: 'm-1', fullName: 'Ahmed Turky', email: 'ahmed@example.com' };

function inject(): AuthService {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  return TestBed.inject(AuthService);
}

describe('AuthService session restore', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('restores the stored merchant, so a reload does not bounce to login', () => {
    localStorage.setItem('qaflaty_merchant', JSON.stringify(MERCHANT));

    const auth = inject();

    expect(auth.currentMerchant()?.id).toBe('m-1');
    expect(auth.isAuthenticated()).toBeTrue();
  });

  it('never reads the session from a stringified-undefined key', () => {
    // Regression: `MERCHANT_KEY` used to be a class field declared *after* the
    // signals that read it, so the restore ran as getItem(undefined).
    localStorage.setItem('undefined', JSON.stringify(MERCHANT));

    const auth = inject();

    expect(auth.currentMerchant()).toBeNull();
    expect(auth.isAuthenticated()).toBeFalse();
  });

  it('stays signed out when nothing is stored', () => {
    const auth = inject();

    expect(auth.currentMerchant()).toBeNull();
    expect(auth.isAuthenticated()).toBeFalse();
  });

  it('survives a corrupt stored payload', () => {
    localStorage.setItem('qaflaty_merchant', '{not json');

    const auth = inject();

    expect(auth.currentMerchant()).toBeNull();
    expect(auth.isAuthenticated()).toBeFalse();
  });
});
