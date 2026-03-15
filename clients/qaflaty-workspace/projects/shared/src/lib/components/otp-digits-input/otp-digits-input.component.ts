import {
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  input,
  output,
  signal,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-otp-digits-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './otp-digits-input.component.html',
  styleUrl: './otp-digits-input.component.css'
})
export class OtpDigitsInputComponent implements AfterViewInit {
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  hasError = input<boolean>(false);
  disabled = input<boolean>(false);

  codeChange = output<string>();
  completed = output<string>();

  digits = signal<string[]>(['', '', '', '', '', '']);

  ngAfterViewInit() {
    setTimeout(() => this.focusAt(0), 0);
  }

  onInput(index: number, event: Event) {
    const el = event.target as HTMLInputElement;
    const value = el.value.replace(/\D/g, '').slice(-1);

    const updated = [...this.digits()];
    updated[index] = value;
    this.digits.set(updated);

    const code = updated.join('');
    this.codeChange.emit(code);

    if (value && index < 5) this.focusAt(index + 1);
    if (updated.every(d => d !== '')) this.completed.emit(code);
  }

  onKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const updated = [...this.digits()];
      if (updated[index]) {
        updated[index] = '';
        this.digits.set(updated);
        this.codeChange.emit(updated.join(''));
      } else if (index > 0) {
        updated[index - 1] = '';
        this.digits.set(updated);
        this.codeChange.emit(updated.join(''));
        this.focusAt(index - 1);
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) this.focusAt(index - 1);
    if (event.key === 'ArrowRight' && index < 5) this.focusAt(index + 1);
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const chars = pasted.replace(/\D/g, '').slice(0, 6).split('');

    const updated: string[] = ['', '', '', '', '', ''];
    chars.forEach((d, i) => (updated[i] = d));
    this.digits.set(updated);

    const code = updated.join('');
    this.codeChange.emit(code);
    this.focusAt(chars.length < 6 ? chars.length : 5);
    if (chars.length === 6) this.completed.emit(code);
  }

  reset(focusFirst = true) {
    this.digits.set(['', '', '', '', '', '']);
    this.codeChange.emit('');
    if (focusFirst) setTimeout(() => this.focusAt(0), 0);
  }

  private focusAt(index: number) {
    const el = this.digitInputs?.toArray()[index]?.nativeElement;
    if (el) { el.focus(); el.select(); }
  }
}
