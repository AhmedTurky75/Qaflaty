import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { getCartItemKey } from '../../models/cart.model';
import { OrderService } from '../../services/order.service';
import { StoreService } from '../../services/store.service';
import { CustomerAuthService, CustomerAddress } from '../../services/customer-auth.service';
import { CreateOrderRequest, OrderCalculation, PaymentMethod } from '../../models/order.model';
import { LocationPickerComponent, PickedLocation } from '../../components/shared/location-picker.component';
import { COUNTRIES, CITIES, DISTRICTS, Country, City, District } from 'shared';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, LocationPickerComponent],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private storeService = inject(StoreService);
  private router = inject(Router);
  readonly authService = inject(CustomerAuthService);

  cart = this.cartService.cart;
  store = this.storeService.currentStore;
  submitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Order calculation (delivery fee + totals from server)
  orderCalculation = signal<OrderCalculation | null>(null);
  calculatingOrder = signal(false);

  // Saved addresses (authenticated users)
  addresses = signal<CustomerAddress[]>([]);
  addressesLoading = signal(false);
  selectedAddress = signal<CustomerAddress | null>(null);

  // Inline "add new address" form (authenticated)
  showAddAddressForm = signal(false);
  addAddressLoading = signal(false);
  addAddressError = signal<string | null>(null);
  pickedLocation = signal<PickedLocation | null>(null);

  // Geo-data (static)
  readonly countries: Country[] = COUNTRIES;

  // For authenticated inline-add form
  readonly authFormCountryCode = signal<number | null>(null);
  readonly authFormCityId = signal<number | null>(null);
  readonly authFormCities = computed<City[]>(() => {
    const code = this.authFormCountryCode();
    return code ? (CITIES[code] ?? []) : [];
  });
  readonly authFormDistricts = computed<District[]>(() => {
    const id = this.authFormCityId();
    return id ? (DISTRICTS[id] ?? []) : [];
  });

  // For guest form
  readonly guestCountryCode = signal<number | null>(null);
  readonly guestCityId = signal<number | null>(null);
  readonly guestCities = computed<City[]>(() => {
    const code = this.guestCountryCode();
    return code ? (CITIES[code] ?? []) : [];
  });
  readonly guestDistricts = computed<District[]>(() => {
    const id = this.guestCityId();
    return id ? (DISTRICTS[id] ?? []) : [];
  });

  checkoutForm!: FormGroup;
  addressForm!: FormGroup;

  ngOnInit(): void {
    this.addressForm = this.fb.group({
      label: ['', [Validators.required, Validators.maxLength(50)]],
      countryCode: ['', [Validators.required]],
      cityId: ['', [Validators.required]],
      districtId: [''],
      street: ['', [Validators.required, Validators.maxLength(200)]],
      postalCode: ['', [Validators.maxLength(20)]],
      isDefault: [false]
    });

    if (this.authService.isAuthenticated()) {
      this.checkoutForm = this.fb.group({
        additionalPhone: ['', [Validators.pattern(/^(\+966|966|05)[0-9]{8,9}$/)]],
        additionalInstructions: [''],
        paymentMethod: ['CashOnDelivery', [Validators.required]],
        notes: ['']
      });
      this.loadAddresses();
    } else {
      this.checkoutForm = this.fb.group({
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        phone: ['', [Validators.required, Validators.pattern(/^(\+966|966|05)[0-9]{8,9}$/)]],
        email: ['', [Validators.required, Validators.email]],
        countryCode: ['', [Validators.required]],
        cityId: ['', [Validators.required]],
        districtId: [''],
        street: ['', [Validators.required]],
        additionalInstructions: [''],
        paymentMethod: ['CashOnDelivery', [Validators.required]],
        notes: ['']
      });
    }
  }

  private loadAddresses(): void {
    this.addressesLoading.set(true);
    this.authService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        this.addressesLoading.set(false);
        const def = addresses.find(a => a.isDefault) ?? addresses[0] ?? null;
        this.selectedAddress.set(def);
        if (def) this.calculateOrder(def.countryCode, def.cityId, def.districtId);
      },
      error: () => this.addressesLoading.set(false)
    });
  }

  onAddressSelect(event: Event): void {
    const label = (event.target as HTMLSelectElement).value;
    const addr = this.addresses().find(a => a.label === label) ?? null;
    this.selectedAddress.set(addr);
    if (this.showAddAddressForm()) this.cancelAddAddress();
    if (addr) this.calculateOrder(addr.countryCode, addr.cityId, addr.districtId);
  }

  openAddAddressForm(): void {
    this.showAddAddressForm.set(true);
    this.addressForm.reset({ isDefault: false });
    this.authFormCountryCode.set(null);
    this.authFormCityId.set(null);
    this.pickedLocation.set(null);
    this.addAddressError.set(null);
    this.orderCalculation.set(null);
  }

  cancelAddAddress(): void {
    this.showAddAddressForm.set(false);
    this.addressForm.reset();
    this.authFormCountryCode.set(null);
    this.authFormCityId.set(null);
    this.pickedLocation.set(null);
    this.addAddressError.set(null);
  }

  onAuthFormCountryChange(): void {
    const val = this.addressForm.get('countryCode')?.value;
    this.authFormCountryCode.set(val ? Number(val) : null);
    this.authFormCityId.set(null);
    this.addressForm.patchValue({ cityId: '', districtId: '' });
    this.orderCalculation.set(null);
  }

  onAuthFormCityChange(): void {
    const val = this.addressForm.get('cityId')?.value;
    this.authFormCityId.set(val ? Number(val) : null);
    this.addressForm.patchValue({ districtId: '' });
    const countryCode = this.authFormCountryCode();
    if (countryCode && val) this.calculateOrder(countryCode, Number(val));
  }

  onAuthFormDistrictChange(): void {
    const countryCode = this.authFormCountryCode();
    const cityId = this.authFormCityId();
    const districtVal = this.addressForm.get('districtId')?.value;
    if (countryCode) this.calculateOrder(countryCode, cityId ?? undefined, districtVal ? Number(districtVal) : undefined);
  }

  onGuestCountryChange(): void {
    const val = this.checkoutForm.get('countryCode')?.value;
    this.guestCountryCode.set(val ? Number(val) : null);
    this.guestCityId.set(null);
    this.checkoutForm.patchValue({ cityId: '', districtId: '' });
    this.orderCalculation.set(null);
  }

  onGuestCityChange(): void {
    const val = this.checkoutForm.get('cityId')?.value;
    this.guestCityId.set(val ? Number(val) : null);
    this.checkoutForm.patchValue({ districtId: '' });
    const countryCode = this.guestCountryCode();
    if (countryCode && val) this.calculateOrder(countryCode, Number(val));
  }

  onGuestDistrictChange(): void {
    const countryCode = this.guestCountryCode();
    const cityId = this.guestCityId();
    const districtVal = this.checkoutForm.get('districtId')?.value;
    if (countryCode) this.calculateOrder(countryCode, cityId ?? undefined, districtVal ? Number(districtVal) : undefined);
  }

  private calculateOrder(countryCode: number, cityId?: number, districtId?: number): void {
    if (!countryCode) return;
    this.calculatingOrder.set(true);
    const items = this.cartService.cart().items.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      variantId: i.variantId
    }));
    this.orderService.calculateOrder({ items, countryCode, cityId, districtId }).subscribe({
      next: (calc) => {
        this.orderCalculation.set(calc);
        this.calculatingOrder.set(false);
      },
      error: () => {
        this.orderCalculation.set(null);
        this.calculatingOrder.set(false);
      }
    });
  }

  onLocationPicked(loc: PickedLocation | null): void {
    this.pickedLocation.set(loc);
  }

  saveAndUseAddress(): void {
    if (this.addressForm.invalid || !this.pickedLocation()) return;
    this.addAddressLoading.set(true);
    this.addAddressError.set(null);

    const v = this.addressForm.value;
    const countryCode = Number(v.countryCode);
    const cityId = v.cityId ? Number(v.cityId) : undefined;
    const districtId = v.districtId ? Number(v.districtId) : undefined;
    const country = this.countries.find(c => c.isoNumeric === countryCode);
    const city = cityId ? this.authFormCities().find(c => c.id === cityId) : undefined;
    const loc = this.pickedLocation()!;

    const newAddress: CustomerAddress = {
      label: v.label,
      street: v.street,
      city: city?.name ?? '',
      state: '',
      postalCode: v.postalCode || '',
      country: country?.name ?? '',
      isDefault: v.isDefault,
      latitude: loc.latitude,
      longitude: loc.longitude,
      countryCode,
      cityId,
      districtId
    };

    this.authService.addAddress(newAddress).subscribe({
      next: () => {
        this.addAddressLoading.set(false);
        this.showAddAddressForm.set(false);
        this.addressForm.reset();
        this.authFormCountryCode.set(null);
        this.authFormCityId.set(null);
        this.pickedLocation.set(null);
        this.authService.getAddresses().subscribe(addresses => {
          this.addresses.set(addresses);
          const saved = addresses.find(a => a.label === newAddress.label) ?? null;
          this.selectedAddress.set(saved);
          if (saved) this.calculateOrder(saved.countryCode, saved.cityId, saved.districtId);
        });
      },
      error: (err) => {
        this.addAddressLoading.set(false);
        this.addAddressError.set(err.error?.message || 'Failed to save address');
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getItemKey(item: { productId: string; variantId?: string }): string {
    return getCartItemKey(item.productId, item.variantId);
  }

  formatVariantAttributes(attributes?: Record<string, string>): string {
    if (!attributes) return '';
    return Object.entries(attributes).map(([k, v]) => `${k}: ${v}`).join(', ');
  }

  getDisplayDeliveryFee(): string {
    const calc = this.orderCalculation();
    if (this.calculatingOrder()) return '...';
    if (!calc) return '—';
    if (!calc.isDeliveryAvailable) return 'غير متاح';
    return calc.deliveryFee.amount === 0 ? 'FREE' : `${calc.deliveryFee.amount.toFixed(2)} ${calc.deliveryFee.currency}`;
  }

  getDisplayTotal(): string {
    const calc = this.orderCalculation();
    if (this.calculatingOrder()) return '...';
    if (!calc) return `${this.cart().subtotal.amount.toFixed(2)} ${this.cart().subtotal.currency}`;
    return `${calc.total.amount.toFixed(2)} ${calc.total.currency}`;
  }

  submitOrder(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const isAuth = this.authService.isAuthenticated();
    const selectedAddr = this.selectedAddress();

    if (isAuth && !selectedAddr) {
      this.errorMessage.set('الرجاء اختيار عنوان التوصيل');
      return;
    }

    const calc = this.orderCalculation();
    if (calc && !calc.isDeliveryAvailable) {
      this.errorMessage.set('عذراً، التوصيل غير متاح للمنطقة المحددة');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const formValue = this.checkoutForm.value;
    const customer = this.authService.customer();

    let request: CreateOrderRequest;

    if (isAuth && customer && selectedAddr) {
      request = {
        customerInfo: {
          fullName: customer.fullName,
          phone: formValue.additionalPhone || customer.phone || '',
          email: customer.email
        },
        deliveryAddress: {
          street: selectedAddr.street,
          city: selectedAddr.city,
          district: undefined,
          additionalInstructions: formValue.additionalInstructions || undefined,
          countryCode: selectedAddr.countryCode,
          cityId: selectedAddr.cityId,
          districtId: selectedAddr.districtId
        },
        items: this.cart().items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId,
          variantAttributes: item.variantAttributes
        })),
        paymentMethod: formValue.paymentMethod as PaymentMethod,
        notes: formValue.notes || undefined
      };
    } else {
      const countryCode = Number(formValue.countryCode);
      const cityId = formValue.cityId ? Number(formValue.cityId) : undefined;
      const districtId = formValue.districtId ? Number(formValue.districtId) : undefined;
      const city = cityId ? this.guestCities().find(c => c.id === cityId) : undefined;

      request = {
        customerInfo: {
          fullName: formValue.fullName,
          phone: formValue.phone,
          email: formValue.email
        },
        deliveryAddress: {
          street: formValue.street,
          city: city?.name ?? '',
          district: undefined,
          additionalInstructions: formValue.additionalInstructions || undefined,
          countryCode,
          cityId,
          districtId
        },
        items: this.cart().items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId,
          variantAttributes: item.variantAttributes
        })),
        paymentMethod: formValue.paymentMethod as PaymentMethod,
        notes: formValue.notes || undefined
      };
    }

    this.orderService.placeOrder(request).subscribe({
      next: (response) => {
        this.cartService.clear();
        const emailForVerify = isAuth ? customer!.email : formValue.email;
        this.router.navigate(['/order-verify', response.orderNumber], {
          queryParams: { email: emailForVerify }
        });
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to place order. Please try again.');
        this.submitting.set(false);
      }
    });
  }
}
