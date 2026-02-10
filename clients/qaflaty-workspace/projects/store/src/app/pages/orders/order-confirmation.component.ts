import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css']
})
export class OrderConfirmationComponent {
  private route = inject(ActivatedRoute);
  private storeService = inject(StoreService);

  store = this.storeService.currentStore;
  orderNumber = signal<string>('');

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderNumber.set(params['orderNumber'] || '');
    });
  }
}
