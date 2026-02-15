import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { StoreService } from '../../services/store.service';
import { WhatsAppButtonComponent } from '../../components/shared/whatsapp-button.component';
import { WhatsAppService } from '../../services/whatsapp.service';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule, WhatsAppButtonComponent],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css']
})
export class OrderConfirmationComponent {
  private route = inject(ActivatedRoute);
  private storeService = inject(StoreService);
  whatsAppService = inject(WhatsAppService);

  store = this.storeService.currentStore;
  orderNumber = signal<string>('');

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderNumber.set(params['orderNumber'] || '');
    });
  }
}
