import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StoreContextService } from '../../../core/services/store-context.service';
import { MerchantChatService } from '../../../features/chat/services/merchant-chat.service';
import { RailComponent } from '../rail/rail.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { NavDrawerComponent } from '../nav-drawer/nav-drawer.component';

/**
 * Application shell (Direction C): coloured rail + topbar on desktop, bottom
 * nav + slide-in drawer on mobile. Owns the drawer open state and keeps the
 * existing chat-unread polling — the data flow is unchanged from before.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RailComponent, TopbarComponent, BottomNavComponent, NavDrawerComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent implements OnInit {
  private storeContext = inject(StoreContextService);
  private chatService = inject(MerchantChatService);

  drawerOpen = signal(false);

  // Chat unread count
  public chatUnreadCount = this.chatService.totalUnreadCount;

  constructor() {
    // Poll for unread count every 30 seconds when a store is selected
    effect((onCleanup) => {
      const currentStore = this.storeContext.currentStore();
      if (currentStore) {
        this.loadUnreadCount();
        const interval = setInterval(() => this.loadUnreadCount(), 30000);
        onCleanup(() => clearInterval(interval));
      }
    });
  }

  ngOnInit(): void {
    this.storeContext.initialize();
  }

  private async loadUnreadCount() {
    const currentStore = this.storeContext.currentStore();
    if (currentStore) {
      try {
        await this.chatService.loadConversations(currentStore.id);
      } catch (err) {
        // Silently fail
      }
    }
  }
}
