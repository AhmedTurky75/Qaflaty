import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductPropertiesPanelComponent } from '../product-properties-panel.component';

@Component({
  selector: 'app-product-properties-page',
  standalone: true,
  imports: [RouterLink, ProductPropertiesPanelComponent],
  templateUrl: './product-properties.component.html',
  styleUrl: './product-properties.component.scss'
})
export class ProductPropertiesPageComponent {}
