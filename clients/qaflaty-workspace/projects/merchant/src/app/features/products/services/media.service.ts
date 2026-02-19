import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private http = inject(HttpClient);
  private readonly BASE_URL = environment.apiUrl;

  uploadImages(storeId: string, files: File[]): Observable<{ urls: string[] }> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post<{ urls: string[] }>(
      `${this.BASE_URL}/stores/${storeId}/media/upload`,
      formData
    );
  }
}
