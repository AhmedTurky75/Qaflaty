import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MerchantChatService, ConversationSummary } from './services/merchant-chat.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [RouterModule, IconComponent],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent implements OnInit {
  public chatService = inject(MerchantChatService);
  private storeContext = inject(StoreContextService);
  private router = inject(Router);

  public isLoading = signal(false);
  public activeCount = signal(0);

  constructor() {
    effect(() => {
      const count = this.chatService.conversations().filter(c => c.status === 'Active').length;
      this.activeCount.set(count);
    });
  }

  async ngOnInit() {
    await this.loadConversations();
  }

  async loadConversations() {
    const currentStore = this.storeContext.currentStore();
    if (!currentStore) return;

    this.isLoading.set(true);
    try {
      await this.chatService.loadConversations(currentStore.id);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  openConversation(conversationId: string) {
    this.router.navigate(['/chat', conversationId]);
  }

  getInitials(conversation: ConversationSummary): string {
    if (conversation.customerName) {
      return conversation.customerName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    if (conversation.customerEmail) {
      return conversation.customerEmail.substring(0, 2).toUpperCase();
    }
    return 'G';
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
}
