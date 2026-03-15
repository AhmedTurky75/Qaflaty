import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MerchantChatService, ChatMessage } from './services/merchant-chat.service';
import { StoreContextService } from '../../core/services/store-context.service';

@Component({
  selector: 'app-chat-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DecimalPipe],
  template: `
    <div class="flex h-[calc(100vh-4rem)]">

      <!-- Main chat column -->
      <div class="flex flex-col flex-1 min-w-0">
        <!-- Header -->
        @if (chatService.activeConversation(); as conversation) {
          <div class="bg-white border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <button
                  type="button"
                  (click)="goBack()"
                  class="mr-4 p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <svg class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div class="h-10 w-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
                  {{ getInitials(chatService.customerProfile()?.fullName || conversation.customerName || conversation.customerEmail) }}
                </div>

                <div class="ml-4">
                  <h2 class="text-lg font-semibold text-gray-900">
                    {{ chatService.customerProfile()?.fullName || conversation.customerName || conversation.customerEmail || 'Guest Customer' }}
                  </h2>
                  <div class="flex items-center gap-2 text-sm text-gray-500">
                    @if (chatService.isConnected()) {
                      <span class="flex items-center text-green-600">
                        <span class="w-2 h-2 bg-green-600 rounded-full mr-1.5"></span>
                        Online
                      </span>
                    } @else {
                      <span class="flex items-center text-gray-400">
                        <span class="w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
                        Offline
                      </span>
                    }
                    <span class="text-gray-300">•</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      [class.bg-green-100]="conversation.status === 'Active'"
                      [class.text-green-800]="conversation.status === 'Active'"
                      [class.bg-yellow-100]="conversation.status === 'Archived'"
                      [class.text-yellow-800]="conversation.status === 'Archived'"
                      [class.bg-gray-100]="conversation.status === 'Closed'"
                      [class.text-gray-800]="conversation.status === 'Closed'"
                    >
                      {{ conversation.status }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                @if (conversation.status === 'Active') {
                  <button
                    type="button"
                    (click)="closeConversation()"
                    class="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Close Conversation
                  </button>
                }
                @if (conversation.status === 'Closed') {
                  <button
                    type="button"
                    (click)="archiveConversation()"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Archive
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div class="flex-1 overflow-y-auto bg-gray-50 p-6" id="messages-container">
            @if (isLoading()) {
              <div class="flex items-center justify-center h-full">
                <div class="text-center">
                  <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p class="mt-2 text-sm text-gray-500">Loading conversation...</p>
                </div>
              </div>
            } @else if (chatService.error()) {
              <div class="flex items-center justify-center h-full">
                <div class="text-center">
                  <svg class="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="mt-2 text-sm text-red-600">{{ chatService.error() }}</p>
                </div>
              </div>
            } @else if (chatService.messages().length === 0) {
              <div class="flex items-center justify-center h-full">
                <div class="text-center text-gray-500">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p class="mt-2">No messages yet</p>
                </div>
              </div>
            } @else {
              <div class="space-y-4">
                @for (message of chatService.messages(); track message.id) {
                  <div class="flex"
                    [class.justify-end]="message.senderType === 'Merchant'"
                    [class.justify-start]="message.senderType !== 'Merchant'"
                  >
                    <div class="max-w-[70%]">
                      <div class="rounded-lg p-4"
                        [class.bg-primary-600]="message.senderType === 'Merchant'"
                        [class.text-white]="message.senderType === 'Merchant'"
                        [class.bg-white]="message.senderType !== 'Merchant'"
                        [class.text-gray-900]="message.senderType !== 'Merchant'"
                        [class.border]="message.senderType !== 'Merchant'"
                        [class.border-gray-200]="message.senderType !== 'Merchant'"
                      >
                        <div class="text-xs font-semibold mb-1 opacity-80">
                          {{ getSenderName(message.senderType) }}
                        </div>
                        <div class="text-sm leading-relaxed">{{ message.content }}</div>
                        <div class="mt-2 text-xs opacity-70 flex items-center gap-1">
                          {{ formatTime(message.sentAt) }}
                          @if (message.senderType === 'Merchant') {
                            @if (message.readAt) {
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" transform="translate(3, 0)" />
                              </svg>
                            } @else {
                              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                              </svg>
                            }
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                }

                @if (chatService.isCustomerTyping()) {
                  <div class="flex justify-start">
                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                      <div class="flex items-center gap-1">
                        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Input -->
          @if (conversation.status === 'Active') {
            <div class="bg-white border-t border-gray-200 p-4">
              <form (submit)="sendMessage(); $event.preventDefault()" class="flex gap-3">
                <input
                  type="text"
                  [(ngModel)]="messageInput"
                  (ngModelChange)="onInputChange()"
                  [disabled]="isSending()"
                  name="message"
                  placeholder="Type your message..."
                  class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  [disabled]="!messageInput.trim() || isSending()"
                  class="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  @if (isSending()) {
                    <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  } @else {
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Send</span>
                  }
                </button>
              </form>
            </div>
          } @else {
            <div class="bg-gray-100 border-t border-gray-200 p-4 text-center text-sm text-gray-600">
              @if (conversation.status === 'Archived') {
                This conversation has been archived
              } @else {
                This conversation has been closed
              }
            </div>
          }
        }
      </div>

      <!-- Customer profile sidebar -->
      @if (chatService.customerProfile(); as profile) {
        <div class="w-72 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
          <!-- Profile header -->
          <div class="p-5 border-b border-gray-100">
            <div class="flex items-center gap-3 mb-3">
              <div class="h-12 w-12 rounded-full bg-primary-600 text-white flex items-center justify-center text-lg font-semibold flex-shrink-0">
                {{ getInitials(profile.fullName) }}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <p class="font-semibold text-gray-900 truncate">{{ profile.fullName }}</p>
                  @if (profile.isVerified) {
                    <svg class="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  }
                </div>
                <p class="text-xs text-gray-500 truncate">{{ profile.email }}</p>
              </div>
            </div>
            @if (profile.phone) {
              <p class="text-xs text-gray-600 flex items-center gap-1.5 mt-1">
                <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                {{ profile.phone }}
              </p>
            }
            <p class="text-xs text-gray-400 mt-1.5">Member since {{ formatDate(profile.memberSince) }}</p>
          </div>

          <!-- Addresses -->
          @if (profile.addresses.length > 0) {
            <div class="p-4 border-b border-gray-100">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Addresses</h4>
              <div class="space-y-2">
                @for (addr of profile.addresses; track addr.label) {
                  <div class="text-xs rounded-md bg-gray-50 p-2.5">
                    <div class="flex items-center justify-between mb-0.5">
                      <span class="font-medium text-gray-700">{{ addr.label }}</span>
                      @if (addr.isDefault) {
                        <span class="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-medium">Default</span>
                      }
                    </div>
                    <p class="text-gray-500">{{ addr.street }}, {{ addr.city }}, {{ addr.country }}</p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Cart -->
          @if (profile.cartItems.length > 0) {
            <div class="p-4 border-b border-gray-100">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Current Cart
                <span class="ml-1 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                  {{ profile.cartItems.length }} item{{ profile.cartItems.length !== 1 ? 's' : '' }}
                </span>
              </h4>
              <div class="space-y-1.5">
                @for (item of profile.cartItems; track item.productId) {
                  <div class="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded p-2">
                    <span class="text-gray-500 truncate">Product {{ item.productId.substring(0,8) }}…</span>
                    <span class="font-medium text-gray-700 flex-shrink-0 ml-2">×{{ item.quantity }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Recent Orders -->
          @if (profile.recentOrders.length > 0) {
            <div class="p-4">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Orders</h4>
              <div class="space-y-2">
                @for (order of profile.recentOrders; track order.orderNumber) {
                  <div class="text-xs rounded-md border border-gray-100 p-2.5">
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-mono font-medium text-gray-700">#{{ order.orderNumber }}</span>
                      <span [class]="getOrderStatusClass(order.status) + ' text-[10px] px-1.5 py-0.5 rounded font-medium'">
                        {{ order.status }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between text-gray-500">
                      <span>{{ order.itemCount }} item{{ order.itemCount !== 1 ? 's' : '' }}</span>
                      <span class="font-medium text-gray-700">{{ order.total | number:'1.2-2' }} SAR</span>
                    </div>
                    <p class="text-gray-400 mt-0.5">{{ formatDate(order.createdAt) }}</p>
                  </div>
                }
              </div>
            </div>
          } @else if (profile.recentOrders.length === 0) {
            <div class="p-4">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Orders</h4>
              <p class="text-xs text-gray-400">No orders yet</p>
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
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
    // Auto-scroll to bottom when new messages arrive
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
    // Send typing indicator
    this.chatService.sendTypingIndicator(true);

    // Clear previous timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Stop typing indicator after 1 second of inactivity
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

    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getSenderName(senderType: string): string {
    switch (senderType) {
      case 'Customer':
        return 'Customer';
      case 'Merchant':
        return 'You';
      case 'Bot':
        return 'AI Assistant';
      default:
        return 'Unknown';
    }
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getOrderStatusClass(status: string): string {
    switch (status) {
      case 'Confirmed': return 'bg-blue-100 text-blue-700';
      case 'Processing': return 'bg-indigo-100 text-indigo-700';
      case 'Shipped': return 'bg-purple-100 text-purple-700';
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  }

  private scrollToBottom() {
    const container = document.getElementById('messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
