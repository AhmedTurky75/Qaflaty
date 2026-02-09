import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ImageItem {
  id?: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent {
  @Input() images: ImageItem[] = [];
  @Output() imagesChange = new EventEmitter<ImageItem[]>();

  showUrlInput = signal(false);
  imageUrl = signal('');

  addImageUrl(): void {
    const url = this.imageUrl().trim();
    if (url) {
      const newImage: ImageItem = {
        url,
        sortOrder: this.images.length
      };
      this.images = [...this.images, newImage];
      this.imagesChange.emit(this.images);
      this.imageUrl.set('');
      this.showUrlInput.set(false);
    }
  }

  removeImage(index: number): void {
    this.images = this.images.filter((_, i) => i !== index);
    // Update sort order
    this.images = this.images.map((img, i) => ({ ...img, sortOrder: i }));
    this.imagesChange.emit(this.images);
  }

  moveUp(index: number): void {
    if (index > 0) {
      const newImages = [...this.images];
      [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
      // Update sort order
      this.images = newImages.map((img, i) => ({ ...img, sortOrder: i }));
      this.imagesChange.emit(this.images);
    }
  }

  moveDown(index: number): void {
    if (index < this.images.length - 1) {
      const newImages = [...this.images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      // Update sort order
      this.images = newImages.map((img, i) => ({ ...img, sortOrder: i }));
      this.imagesChange.emit(this.images);
    }
  }

  updateAltText(index: number, altText: string): void {
    this.images = this.images.map((img, i) =>
      i === index ? { ...img, altText } : img
    );
    this.imagesChange.emit(this.images);
  }

  toggleUrlInput(): void {
    this.showUrlInput.update(v => !v);
    if (!this.showUrlInput()) {
      this.imageUrl.set('');
    }
  }
}
