import { Component, input, output, signal, effect, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

export interface ConfirmDialogConfig {
  /** Already-translated heading. */
  title: string;
  /** Already-translated body copy. */
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** `danger` paints the confirm button red — use for destructive or blocking actions. */
  variant?: 'danger' | 'primary';
  /** Glyph name for the leading badge; defaults to a warning triangle. */
  icon?: string;
  /** Renders a reason textarea. Set `required` to keep confirm disabled until it is filled. */
  reason?: {
    label: string;
    placeholder?: string;
    required?: boolean;
  };
  /** Renders an extra opt-in checkbox, e.g. "also unblock this number". */
  checkbox?: {
    label: string;
    initial?: boolean;
  };
}

export interface ConfirmDialogResult {
  reason: string | null;
  checked: boolean;
}

/**
 * The app's confirmation dialog. Replaces window.confirm/prompt so these flows are themeable,
 * translatable and RTL-aware, and so a single dialog can collect a reason and an extra option
 * instead of stacking two native prompts.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent {
  readonly config = input.required<ConfirmDialogConfig>();
  /** Disables both buttons while the caller's request is in flight. */
  readonly pending = input<boolean>(false);

  readonly confirmed = output<ConfirmDialogResult>();
  readonly cancelled = output<void>();

  reasonText = signal('');
  checkboxChecked = signal(false);

  constructor() {
    // Reset per-dialog state whenever the host swaps in a different config.
    effect(() => {
      const cfg = this.config();
      this.reasonText.set('');
      this.checkboxChecked.set(cfg.checkbox?.initial ?? false);
    });
  }

  get confirmDisabled(): boolean {
    if (this.pending()) return true;

    const reason = this.config().reason;
    return !!reason?.required && !this.reasonText().trim();
  }

  onConfirm(): void {
    if (this.confirmDisabled) return;

    this.confirmed.emit({
      reason: this.reasonText().trim() || null,
      checked: this.checkboxChecked()
    });
  }

  onCancel(): void {
    if (this.pending()) return;
    this.cancelled.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onCancel();
  }
}
