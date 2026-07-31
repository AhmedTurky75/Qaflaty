import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaqManagerComponent } from '../faq-manager.component';

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [RouterLink, FaqManagerComponent],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqPageComponent {}
