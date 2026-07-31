import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DeliveryZonesPanelComponent } from '../delivery-zones-panel.component';

@Component({
  selector: 'app-delivery-zones-page',
  standalone: true,
  imports: [RouterLink, DeliveryZonesPanelComponent],
  templateUrl: './delivery-zones.component.html',
  styleUrl: './delivery-zones.component.scss'
})
export class DeliveryZonesPageComponent {}
