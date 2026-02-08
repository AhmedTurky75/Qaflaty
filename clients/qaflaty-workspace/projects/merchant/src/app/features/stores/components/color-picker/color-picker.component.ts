import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent {
  @Input() set initialColor(value: string) {
    if (value) {
      this.colorControl.setValue(value);
      this.selectedColor.set(value);
    }
  }
  @Input() label = 'Primary Color';
  @Output() colorChange = new EventEmitter<string>();

  colorControl = new FormControl('#3B82F6', [
    Validators.required,
    Validators.pattern(/^#[0-9A-Fa-f]{6}$/)
  ]);

  selectedColor = signal('#3B82F6');

  predefinedColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Green', value: '#10B981' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Slate', value: '#64748B' },
    { name: 'Black', value: '#1F2937' }
  ];

  onColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const color = input.value;
    this.selectedColor.set(color);
    this.colorChange.emit(color);
  }

  selectPredefinedColor(color: string): void {
    this.colorControl.setValue(color);
    this.selectedColor.set(color);
    this.colorChange.emit(color);
  }
}
