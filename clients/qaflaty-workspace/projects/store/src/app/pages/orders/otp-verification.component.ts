import { Component, inject, signal, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { OtpDigitsInputComponent } from 'shared';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, RouterModule, OtpDigitsInputComponent],
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.css']
})
export class OtpVerificationComponent implements OnDestroy {
  @ViewChild(OtpDigitsInputComponent) otpInput!: OtpDigitsInputComponent;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  orderNumber = signal<string>('');
  email = signal<string>('');
  currentCode = signal<string>('');

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
    this.startCooldown(60);
  }

  ngOnDestroy() {
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
  }

  get isComplete(): boolean {
    return this.currentCode().length === 6;
  }

  verify() {
    if (!this.isComplete || this.verifying()) return;

    this.verifying.set(true);
    this.errorMessage.set('');

    this.orderService.verifyOrderOtp(this.orderNumber(), this.currentCode()).subscribe({
      next: (response) => {
        this.router.navigate(['/order-confirmation', this.orderNumber()], {
          queryParams: {
            orderId: response.id,
            value: response.pricing.total.amount,
            currency: response.pricing.total.currency
          }
        });
      },
      error: (err) => {
        const msg = err.error?.message || 'Invalid verification code. Please try again.';
        this.errorMessage.set(msg);
        this.verifying.set(false);
        this.otpInput.reset();
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
        this.otpInput.reset();
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to resend code. Please try again.';
        this.errorMessage.set(msg);
        this.resending.set(false);
      }
    });
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
