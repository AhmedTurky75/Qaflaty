import {
  Component, ElementRef, EventEmitter, Input, OnChanges,
  AfterViewInit, OnDestroy, Output, ViewChild, SimpleChanges,
  NgZone, ViewEncapsulation, Inject
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

export interface PickedLocation {
  latitude: number;
  longitude: number;
}

const markerIcon = L.icon({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  shadowSize:  [41, 41]
});

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule],
  // ViewEncapsulation.None — required so our CSS can target Leaflet's
  // dynamically-created DOM (which has no Angular scoping attribute).
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .lp-container { display: block; }

    .lp-map {
      width: 100%;
      height: 260px;
      border-radius: 0.5rem;
      border: 1px solid #d1d5db;
      /* Contain the absolutely-positioned Leaflet panes */
      position: relative;
      /* Keep below sticky header / modals */
      z-index: 0;
    }

    /* Leaflet sets the map div to 100% of its container */
    .lp-map .leaflet-container {
      width: 100%;
      height: 100%;
      border-radius: 0.5rem;
    }

    /*
     * Tailwind preflight sets  img { display: block }
     * Leaflet relies on tiles being display:inline (or at least not block)
     * for its CSS-transform tile grid. Override it here.
     */
    .lp-map .leaflet-tile,
    .lp-map .leaflet-tile-container img {
      display: inline !important;
    }
  `],
  template: `
    <div class="lp-container">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700">الموقع على الخريطة</span>
        <button type="button" (click)="useMyLocation()" [disabled]="locating"
          class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md
                 bg-blue-50 text-blue-700 hover:bg-blue-100
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          @if (locating) {
            <svg class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            جاري التحديد...
          } @else {
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            استخدم موقعي الحالي
          }
        </button>
      </div>

      @if (locationError) {
        <p class="text-xs text-red-600 mb-2">{{ locationError }}</p>
      }

      <div #mapEl class="lp-map"></div>

      <p class="text-xs text-center mt-1" [class]="picked ? 'text-gray-500' : 'text-gray-400'">
        @if (picked) {
          {{ picked.latitude.toFixed(6) }}, {{ picked.longitude.toFixed(6) }}
          &mdash; انقر أو اسحب الدبوس لتغيير الموقع
        } @else {
          انقر على الخريطة لتحديد الموقع
        }
      </p>
    </div>
  `
})
export class LocationPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  @Input() latitude?: number | null;
  @Input() longitude?: number | null;
  @Output() locationPicked = new EventEmitter<PickedLocation | null>();

  picked: PickedLocation | null = null;
  locating = false;
  locationError: string | null = null;

  private map!: L.Map;
  private marker: L.Marker | null = null;
  private ready = false;

  constructor(
    private zone: NgZone,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  ngAfterViewInit(): void {
    this.ensureLeafletCss();
    // Defer one tick so Angular finishes painting and the browser has
    // computed the container's final pixel dimensions before Leaflet measures it.
    setTimeout(() => this.initMap(), 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready) return;
    if ((changes['latitude'] || changes['longitude']) && this.latitude && this.longitude) {
      this.placeMarker(this.latitude, this.longitude);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.locationError = 'المتصفح لا يدعم تحديد الموقع الجغرافي';
      return;
    }
    this.locating = true;
    this.locationError = null;

    navigator.geolocation.getCurrentPosition(
      pos => this.zone.run(() => {
        this.locating = false;
        this.placeMarker(pos.coords.latitude, pos.coords.longitude);
      }),
      err => this.zone.run(() => {
        this.locating = false;
        this.locationError = err.code === 1
          ? 'تم رفض الإذن. يرجى السماح للمتصفح بالوصول إلى موقعك.'
          : 'تعذّر تحديد موقعك. حاول مرة أخرى.';
      }),
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  private initMap(): void {
    this.map = L.map(this.mapEl.nativeElement, {
      center: [24.7136, 46.6753],
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: false   // don't steal page scroll
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);

    // Must be called after the container has its final rendered size.
    this.map.invalidateSize();

    this.map.on('click', (e: L.LeafletMouseEvent) =>
      this.zone.run(() => this.placeMarker(e.latlng.lat, e.latlng.lng))
    );

    this.ready = true;

    if (this.latitude && this.longitude) {
      this.placeMarker(this.latitude, this.longitude);
    }
  }

  private placeMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { icon: markerIcon, draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const { lat: la, lng: ln } = this.marker!.getLatLng();
        this.zone.run(() => this.emit(la, ln));
      });
    }
    this.map.setView([lat, lng], Math.max(this.map.getZoom(), 15));
    this.emit(lat, lng);
  }

  private emit(lat: number, lng: number): void {
    this.picked = { latitude: lat, longitude: lng };
    this.locationPicked.emit(this.picked);
  }

  /** Inject Leaflet CSS once into <head> — makes the component self-contained
   *  regardless of whether angular.json styles were picked up by the build. */
  private ensureLeafletCss(): void {
    const id = 'leaflet-css';
    if (this.doc.getElementById(id)) return;
    const link = this.doc.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    this.doc.head.appendChild(link);
  }
}
