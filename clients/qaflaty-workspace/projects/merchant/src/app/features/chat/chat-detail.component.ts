import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MerchantChatService, ChatMessage } from './services/merchant-chat.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-chat-detail',
  standalone: true,
  imports: [FormsModule, RouterModule, DecimalPipe, IconComponent],
  templateUrl: './chat-detail.component.html',
  styleUrl: './chat-detail.component.scss',
})
export class ChatDetailComponent implements OnInit, OnDestroy {
  public chatService = inject(MerchantChatService);
  private storeContext = inject(StoreContextService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  public messageInput = '';
  public isLoading = signal(false);
  public isSending = signal(false);

  private typingTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const messages = this.chatService.messages();
      if (messages.length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  async ngOnInit() {
    const conversationId = this.route.snapshot.paramMap.get('id');
    const currentStore = this.storeContext.currentStore();

    if (!conversationId || !currentStore) {
      this.router.navigate(['/chat']);
      return;
    }

    this.isLoading.set(true);
    try {
      await this.chatService.openConversation(currentStore.id, conversationId);
      this.markUnreadMessagesAsRead();
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async ngOnDestroy() {
    await this.chatService.closeActiveConversation();
  }

  async sendMessage() {
    if (!this.messageInput.trim() || this.isSending()) return;

    const currentStore = this.storeContext.currentStore();
    if (!currentStore) return;

    this.isSending.set(true);

    try {
      await this.chatService.sendMessage(currentStore.id, this.messageInput);
      this.messageInput = '';
      this.scrollToBottom();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      this.isSending.set(false);
    }
  }

  onInputChange() {
    this.chatService.sendTypingIndicator(true);
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.typingTimeout = setTimeout(() => {
      if (this.messageInput.trim() === '') {
        this.chatService.sendTypingIndicator(false);
      }
    }, 1000);
  }

  async markUnreadMessagesAsRead() {
    const currentStore = this.storeContext.currentStore();
    if (!currentStore) return;

    const messages = this.chatService.messages();
    const unreadIds = messages
      .filter(m => !m.readAt && (m.senderType === 'Customer' || m.senderType === 'Bot'))
      .map(m => m.id);

    if (unreadIds.length > 0) {
      await this.chatService.markMessagesAsRead(currentStore.id, unreadIds);
    }
  }

  async closeConversation() {
    const currentStore = this.storeContext.currentStore();
    if (!currentStore) return;

    if (confirm('Are you sure you want to close this conversation?')) {
      try {
        await this.chatService.closeConversation(currentStore.id);
      } catch (err) {
        console.error('Failed to close conversation:', err);
      }
    }
  }

  async archiveConversation() {
    const currentStore = this.storeContext.currentStore();
    if (!currentStore) return;

    if (confirm('Archive this conversation? It will be moved to the archive and no new messages can be added.')) {
      try {
        await this.chatService.archiveConversation(currentStore.id);
      } catch (err) {
        console.error('Failed to archive conversation:', err);
      }
    }
  }

  goBack() {
    this.router.navigate(['/chat']);
  }

  getInitials(name?: string): string {
    if (!name) return 'G';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getSenderName(senderType: string): string {
    switch (senderType) {
      case 'Customer': return 'Customer';
      case 'Merchant': return 'You';
      case 'Bot': return 'AI Assistant';
      default: return 'Unknown';
    }
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /** Token-based status chip classes. */
  getOrderStatusClass(status: string): string {
    switch (status) {
      case 'Delivered': return 'bg-success/10 text-success';
      case 'Cancelled': return 'bg-danger/10 text-danger';
      case 'Confirmed':
      case 'Processing':
      case 'Shipped': return 'bg-primary-tint text-primary';
      default: return 'bg-warning/10 text-warning';
    }
  }

  private scrollToBottom() {
    const container = document.getElementById('messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
