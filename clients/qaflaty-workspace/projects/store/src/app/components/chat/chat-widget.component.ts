import { Component, signal, effect, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { FeatureService } from '../../services/feature.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.css']
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  public chatService = inject(ChatService);
  private featureService = inject(FeatureService);
  public i18n = inject(I18nService);

  // UI state
  public isExpanded = signal(false);
  public isMinimized = signal(false);
  public messageInput = signal('');
  public isSendingMessage = signal(false);
  public isLoadingConversation = signal(false);

  // Check if chat is enabled
  public isChatEnabled = this.featureService.isLiveChatEnabled;

  constructor() {
    // Auto-scroll to bottom when new messages arrive
    effect(() => {
      const messages = this.chatService.messages();
      if (messages.length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  async ngOnInit() {
    // Try to restore active conversation on init
    if (this.isChatEnabled()) {
      await this.chatService.getActiveConversation();
    }
  }

  ngOnDestroy() {
    this.chatService.closeConversation();
  }

  /**
   * Toggle chat window expanded state
   */
  toggleChat() {
    if (this.isMinimized()) {
      this.isMinimized.set(false);
    }
    this.isExpanded.update(v => !v);

    // Start conversation if opening for first time
    if (this.isExpanded() && !this.chatService.hasActiveConversation()) {
      this.startConversation();
    }

    // Mark messages as read when opening
    if (this.isExpanded()) {
      this.markUnreadMessagesAsRead();
    }
  }

  /**
   * Minimize chat window (keep it open but collapsed)
   */
  minimizeChat() {
    this.isMinimized.set(true);
    this.isExpanded.set(false);
  }

  /**
   * Start a new conversation
   */
  async startConversation(initialMessage?: string) {
    this.isLoadingConversation.set(true);
    try {
      await this.chatService.startConversation(initialMessage);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      this.isLoadingConversation.set(false);
    }
  }

  /**
   * Send a message
   */
  async sendMessage() {
    const content = this.messageInput().trim();
    if (!content || this.isSendingMessage()) return;

    // If no active conversation, start one with this message
    if (!this.chatService.hasActiveConversation()) {
      await this.startConversation(content);
      this.messageInput.set('');
      return;
    }

    this.isSendingMessage.set(true);

    try {
      await this.chatService.sendMessage(content);
      this.messageInput.set('');
      this.scrollToBottom();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      this.isSendingMessage.set(false);
    }
  }

  /**
   * Handle typing indicator
   */
  onInputChange() {
    // Debounce typing indicator
    if (this.chatService.hasActiveConversation()) {
      this.chatService.sendTypingIndicator(true);
      setTimeout(() => {
        if (this.messageInput().trim() === '') {
          this.chatService.sendTypingIndicator(false);
        }
      }, 1000);
    }
  }

  /**
   * Mark unread messages as read
   */
  async markUnreadMessagesAsRead() {
    const messages = this.chatService.messages();
    const unreadIds = messages
      .filter(m => !m.readAt && (m.senderType === 'Merchant' || m.senderType === 'Bot'))
      .map(m => m.id);

    if (unreadIds.length > 0) {
      await this.chatService.markMessagesAsRead(unreadIds);
    }
  }

  /**
   * Scroll to bottom of messages
   */
  private scrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  /**
   * Format timestamp for display
   */
  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Check if message is from customer
   */
  isCustomerMessage(message: ChatMessage): boolean {
    return message.senderType === 'Customer';
  }

  /**
   * Get sender display name
   */
  getSenderName(message: ChatMessage): string {
    const isRtl = this.i18n.isRtl();

    switch (message.senderType) {
      case 'Customer':
        return isRtl ? 'أنت' : 'You';
      case 'Merchant':
        return isRtl ? 'فريق الدعم' : 'Support Team';
      case 'Bot':
        return isRtl ? 'مساعد آلي' : 'AI Assistant';
      default:
        return '';
    }
  }
}
