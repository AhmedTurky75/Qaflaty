import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MediaService } from '../../services/media.service';

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
  private mediaService = inject(MediaService);

  @Input() images: ImageItem[] = [];
  @Input() storeId = '';
  @Output() imagesChange = new EventEmitter<ImageItem[]>();

  readonly MAX_IMAGES = 10;
  readonly MAX_FILE_SIZE_MB = 5;
  readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  showUrlInput = signal(false);
  imageUrl = signal('');
  uploading = signal(false);
  uploadError = signal<string | null>(null);

  get canAddMore(): boolean {
    return this.images.length < this.MAX_IMAGES;
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);

    // Enforce 10-image cap
    const slotsAvailable = this.MAX_IMAGES - this.images.length;
    const filesToUpload = files.slice(0, slotsAvailable);

    for (const file of filesToUpload) {
      if (!this.ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        this.uploadError.set(`"${file.name}" is not a supported image type.`);
        input.value = '';
        return;
      }
      if (file.size > this.MAX_FILE_SIZE_MB * 1024 * 1024) {
        this.uploadError.set(`"${file.name}" exceeds the ${this.MAX_FILE_SIZE_MB} MB limit.`);
        input.value = '';
        return;
      }
    }

    this.uploadError.set(null);
    this.uploading.set(true);
    // Reset input so the same file can be re-selected if needed
    input.value = '';

    this.mediaService.uploadImages(this.storeId, filesToUpload).subscribe({
      next: (response) => {
        const newImages: ImageItem[] = response.urls.map((url, i) => ({
          url,
          sortOrder: this.images.length + i
        }));
        this.images = [...this.images, ...newImages];
        this.imagesChange.emit(this.images);
        this.uploading.set(false);
      },
      error: (err) => {
        this.uploadError.set(err.error?.message || 'Upload failed. Please try again.');
        this.uploading.set(false);
      }
    });
  }

  addImageUrl(): void {
    const url = this.imageUrl().trim();
    if (url && this.canAddMore) {
      const newImage: ImageItem = { url, sortOrder: this.images.length };
      this.images = [...this.images, newImage];
      this.imagesChange.emit(this.images);
      this.imageUrl.set('');
      this.showUrlInput.set(false);
    }
  }

  removeImage(index: number): void {
    this.images = this.images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, sortOrder: i }));
    this.imagesChange.emit(this.images);
  }

  moveUp(index: number): void {
    if (index > 0) {
      const arr = [...this.images];
      [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
      this.images = arr.map((img, i) => ({ ...img, sortOrder: i }));
      this.imagesChange.emit(this.images);
    }
  }

  moveDown(index: number): void {
    if (index < this.images.length - 1) {
      const arr = [...this.images];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      this.images = arr.map((img, i) => ({ ...img, sortOrder: i }));
      this.imagesChange.emit(this.images);
    }
  }

  updateAltText(index: number, altText: string): void {
    this.images = this.images.map((img, i) => i === index ? { ...img, altText } : img);
    this.imagesChange.emit(this.images);
  }

  toggleUrlInput(): void {
    this.showUrlInput.update(v => !v);
    if (!this.showUrlInput()) this.imageUrl.set('');
  }
}
