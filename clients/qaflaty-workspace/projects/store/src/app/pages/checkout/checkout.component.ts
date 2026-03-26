import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { getCartItemKey } from '../../models/cart.model';
import { OrderService } from '../../services/order.service';
import { StoreService } from '../../services/store.service';
import { CustomerAuthService, CustomerAddress } from '../../services/customer-auth.service';
import { CreateOrderRequest, PaymentMethod } from '../../models/order.model';
import { LocationPickerComponent, PickedLocation } from '../../components/shared/location-picker.component';

interface LocationItem { id: number; name: string; }

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

  private readonly locations = this.authService.getLocations();

  cart = this.cartService.cart;
  store = this.storeService.currentStore;
  submitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Saved addresses (authenticated users)
  addresses = signal<CustomerAddress[]>([]);
  addressesLoading = signal(false);
  selectedAddress = signal<CustomerAddress | null>(null);

  // Inline "add new address" form
  showAddAddressForm = signal(false);
  addAddressLoading = signal(false);
  addAddressError = signal<string | null>(null);
  pickedLocation = signal<PickedLocation | null>(null);
  countries = signal<LocationItem[]>([]);
  cities = signal<LocationItem[]>([]);
  countriesLoading = signal(false);
  citiesLoading = signal(false);

  checkoutForm!: FormGroup;
  addressForm!: FormGroup;

  ngOnInit(): void {
    this.addressForm = this.fb.group({
      label: ['', [Validators.required, Validators.maxLength(50)]],
      countryId: ['', [Validators.required]],
      city: ['', [Validators.required]],
      street: ['', [Validators.required, Validators.maxLength(200)]],
      state: ['', [Validators.maxLength(100)]],
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
      this.loadCountries();
    } else {
      this.checkoutForm = this.fb.group({
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        phone: ['', [Validators.required, Validators.pattern(/^(\+966|966|05)[0-9]{8,9}$/)]],
        email: ['', [Validators.required, Validators.email]],
        street: ['', [Validators.required]],
        city: ['', [Validators.required]],
        district: [''],
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
      },
      error: () => this.addressesLoading.set(false)
    });
  }

  private loadCountries(): void {
    this.countriesLoading.set(true);
    this.locations.countries().subscribe({
      next: (data) => { this.countries.set(data); this.countriesLoading.set(false); },
      error: () => this.countriesLoading.set(false)
    });
  }

  onAddressSelect(event: Event): void {
    const label = (event.target as HTMLSelectElement).value;
    this.selectedAddress.set(this.addresses().find(a => a.label === label) ?? null);
    if (this.showAddAddressForm()) this.cancelAddAddress();
  }

  openAddAddressForm(): void {
    this.showAddAddressForm.set(true);
    this.addressForm.reset({ isDefault: false });
    this.cities.set([]);
    this.pickedLocation.set(null);
    this.addAddressError.set(null);
  }

  cancelAddAddress(): void {
    this.showAddAddressForm.set(false);
    this.addressForm.reset();
    this.pickedLocation.set(null);
    this.addAddressError.set(null);
  }

  onAddressCountryChange(): void {
    const countryId = this.addressForm.get('countryId')?.value;
    this.addressForm.patchValue({ city: '' });
    this.cities.set([]);
    if (!countryId) return;
    this.citiesLoading.set(true);
    this.locations.cities(Number(countryId)).subscribe({
      next: (data) => { this.cities.set(data); this.citiesLoading.set(false); },
      error: () => this.citiesLoading.set(false)
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
    const country = this.countries().find(c => c.id === Number(v.countryId));
    const loc = this.pickedLocation()!;

    const newAddress: CustomerAddress = {
      label: v.label,
      street: v.street,
      city: v.city,
      state: v.state || '',
      postalCode: v.postalCode || '',
      country: country?.name || '',
      isDefault: v.isDefault,
      latitude: loc.latitude,
      longitude: loc.longitude
    };

    this.authService.addAddress(newAddress).subscribe({
      next: () => {
        this.addAddressLoading.set(false);
        this.showAddAddressForm.set(false);
        this.addressForm.reset();
        this.pickedLocation.set(null);
        this.authService.getAddresses().subscribe(addresses => {
          this.addresses.set(addresses);
          this.selectedAddress.set(addresses.find(a => a.label === newAddress.label) ?? null);
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

  submitOrder(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const isAuth = this.authService.isAuthenticated();
    const selectedAddr = this.selectedAddress();

    if (isAuth && !selectedAddr) {
      this.errorMessage.set('Please select a delivery address');
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
          district: selectedAddr.state || undefined,
          additionalInstructions: formValue.additionalInstructions || undefined
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
      request = {
        customerInfo: {
          fullName: formValue.fullName,
          phone: formValue.phone,
          email: formValue.email
        },
        deliveryAddress: {
          street: formValue.street,
          city: formValue.city,
          district: formValue.district || undefined,
          additionalInstructions: formValue.additionalInstructions || undefined
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
