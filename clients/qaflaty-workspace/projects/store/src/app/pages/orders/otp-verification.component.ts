import {
  Component,
  inject,
  signal,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.css']
})
export class OtpVerificationComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  orderNumber = signal<string>('');
  email = signal<string>('');
  digits = signal<string[]>(['', '', '', '', '', '']);

  verifying = signal<boolean>(false);
  resending = signal<boolean>(false);
  errorMessage = signal<string>('');
  resendCooldown = signal<number>(0);

  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderNumber.set(params['orderNumber'] || '');
    });
    this.route.queryParams.subscribe(params => {
      this.email.set(params['email'] || '');
    });

    // Start initial cooldown so user can't immediately resend (OTP was just sent)
    this.startCooldown(60);
  }

  ngAfterViewInit() {
    // Focus first input after view is ready
    setTimeout(() => this.focusInput(0), 0);
  }

  ngOnDestroy() {
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
  }

  get otpCode(): string {
    return this.digits().join('');
  }

  get isComplete(): boolean {
    return this.digits().every(d => d !== '');
  }

  onInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);

    const updated = [...this.digits()];
    updated[index] = value;
    this.digits.set(updated);
    this.errorMessage.set('');

    if (value && index < 5) {
      this.focusInput(index + 1);
    }
  }

  onKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace') {
      const updated = [...this.digits()];
      if (updated[index]) {
        updated[index] = '';
        this.digits.set(updated);
      } else if (index > 0) {
        updated[index - 1] = '';
        this.digits.set(updated);
        this.focusInput(index - 1);
      }
      event.preventDefault();
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      this.focusInput(index - 1);
    }

    if (event.key === 'ArrowRight' && index < 5) {
      this.focusInput(index + 1);
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');

    const updated = ['', '', '', '', '', ''];
    digits.forEach((d, i) => (updated[i] = d));
    this.digits.set(updated);
    this.errorMessage.set('');

    const nextEmpty = digits.length < 6 ? digits.length : 5;
    this.focusInput(nextEmpty);
  }

  verify() {
    if (!this.isComplete || this.verifying()) return;

    this.verifying.set(true);
    this.errorMessage.set('');

    this.orderService.verifyOrderOtp(this.orderNumber(), this.otpCode).subscribe({
      next: () => {
        this.router.navigate(['/order-confirmation', this.orderNumber()]);
      },
      error: (err) => {
        const msg = err.error?.message || 'Invalid verification code. Please try again.';
        this.errorMessage.set(msg);
        this.verifying.set(false);
        this.digits.set(['', '', '', '', '', '']);
        this.focusInput(0);
      }
    });
  }

  resend() {
    if (this.resendCooldown() > 0 || this.resending()) return;

    this.resending.set(true);
    this.errorMessage.set('');

    this.orderService.resendOrderOtp(this.orderNumber()).subscribe({
      next: () => {
        this.resending.set(false);
        this.startCooldown(60);
        this.digits.set(['', '', '', '', '', '']);
        this.focusInput(0);
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to resend code. Please try again.';
        this.errorMessage.set(msg);
        this.resending.set(false);
      }
    });
  }

  private focusInput(index: number) {
    const inputs = this.digitInputs?.toArray();
    if (inputs && inputs[index]) {
      inputs[index].nativeElement.focus();
      inputs[index].nativeElement.select();
    }
  }

  private startCooldown(seconds: number) {
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.resendCooldown.set(seconds);

    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        clearInterval(this.cooldownInterval!);
        this.cooldownInterval = null;
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }
}
