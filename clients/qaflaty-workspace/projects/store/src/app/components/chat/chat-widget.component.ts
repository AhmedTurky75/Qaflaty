import { Component, signal, effect, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatService, ChatMessage, AiSuggestedProduct } from '../../services/chat.service';
import { CartService } from '../../services/cart.service';
import { FeatureService } from '../../services/feature.service';
import { I18nService, TRANSLATIONS } from '../../services/i18n.service';
import { Product } from '../../models/product.model';
import { CreateOrderRequest, OrderResponse } from '../../models/order.model';
import { StorePricePipe } from '../../pipes/store-price.pipe';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StorePricePipe],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.css']
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  public chatService = inject(ChatService);
  private cartService = inject(CartService);
  private featureService = inject(FeatureService);
  public i18n = inject(I18nService);

  // UI state
  public isExpanded = signal(false);
  public isMinimized = signal(false);
  public messageInput = signal('');
  public isSendingMessage = signal(false);
  public isLoadingConversation = signal(false);

  // Chat is shown when human live chat OR the AI assistant is enabled.
  public isChatEnabled = this.featureService.isChatEnabled;
  public isAiAssistantEnabled = this.featureService.isAiAssistantEnabled;
  public cartItemCount = this.cartService.itemCount;

  // Assistant order form state
  public showOrderForm = signal(false);
  public placingOrder = signal(false);
  public placedOrder = signal<OrderResponse | null>(null);
  public orderError = signal<string | null>(null);
  public orderName = signal('');
  public orderPhone = signal('');
  public orderEmail = signal('');
  public orderStreet = signal('');
  public orderCity = signal('');

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

      // If the conversation opened with a customer question, let the AI assistant respond.
      if (initialMessage && this.isAiAssistantEnabled()) {
        this.chatService.requestAiReply();
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      this.isLoadingConversation.set(false);
    }
  }

  /**
   * Dismiss the closed conversation and start a fresh one
   */
  async startNewConversation() {
    this.isLoadingConversation.set(true);
    try {
      await this.chatService.startNewConversation();
    } catch (err) {
      console.error('Failed to start new conversation:', err);
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

      // Let the AI assistant reply (the bot message arrives asynchronously).
      if (this.isAiAssistantEnabled()) {
        this.chatService.requestAiReply();
      }
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

  /**
   * AI-recommended products for a given Bot message
   */
  suggestionsFor(messageId: string): AiSuggestedProduct[] {
    return this.chatService.suggestedProducts()[messageId] ?? [];
  }

  /**
   * Add an AI-recommended product to the cart (explicit customer confirmation), then log it.
   */
  addSuggestion(product: AiSuggestedProduct): void {
    const cartProduct: Product = {
      id: product.productId,
      slug: product.slug,
      name: product.name,
      price: product.price,
      compareAtPrice: null,
      inStock: product.inStock,
      images: product.imageUrl
        ? [{ id: '', url: product.imageUrl, sortOrder: 0 }]
        : [],
      hasVariants: false,
    };

    this.cartService.addItem(cartProduct, 1);
    this.chatService.logAiCartAddition(product.productId);
  }

  /**
   * Translate a static UI key for the current language
   */
  t(key: string): string {
    return TRANSLATIONS[this.i18n.currentLanguage()]?.[key] ?? key;
  }

  openOrderForm(): void {
    this.orderError.set(null);
    this.showOrderForm.set(true);
  }

  closeOrderForm(): void {
    this.showOrderForm.set(false);
  }

  /**
   * Place the current cart as an order through the AI assistant (customer-confirmed).
   */
  async submitOrder(): Promise<void> {
    const name = this.orderName().trim();
    const phone = this.orderPhone().trim();
    const street = this.orderStreet().trim();
    const city = this.orderCity().trim();

    if (!name || !phone || !street || !city) {
      this.orderError.set(this.i18n.isRtl()
        ? 'يرجى إدخال الاسم والهاتف والعنوان والمدينة'
        : 'Please provide name, phone, address and city');
      return;
    }

    const items = this.cartService.cart().items.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      variantId: i.variantId,
    }));

    if (items.length === 0) {
      this.orderError.set(this.i18n.isRtl() ? 'سلتك فارغة' : 'Your cart is empty');
      return;
    }

    const request: CreateOrderRequest = {
      customerInfo: {
        fullName: name,
        phone,
        phoneCountryCode: 'SA',
        email: this.orderEmail().trim(),
      },
      deliveryAddress: { street, city },
      items,
      paymentMethod: 'COD',
    };

    this.placingOrder.set(true);
    this.orderError.set(null);
    try {
      const order = await this.chatService.placeOrder(request);
      this.placedOrder.set(order);
      this.showOrderForm.set(false);
      this.cartService.clear();
    } catch (err: any) {
      this.orderError.set(err?.error?.message || (this.i18n.isRtl() ? 'تعذر إنشاء الطلب' : 'Could not place the order'));
    } finally {
      this.placingOrder.set(false);
    }
  }
}
