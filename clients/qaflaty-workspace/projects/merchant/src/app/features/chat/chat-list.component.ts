import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MerchantChatService, ConversationSummary } from './services/merchant-chat.service';
import { StoreContextService } from '../../core/services/store-context.service';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Live Chat</h1>
        <p class="mt-1 text-sm text-gray-500">
          Manage customer conversations and support requests
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Total Conversations</dt>
                <dd class="text-2xl font-semibold text-gray-900">{{ chatService.conversations().length }}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 bg-green-100 rounded-md p-3">
              <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Active</dt>
                <dd class="text-2xl font-semibold text-gray-900">{{ activeCount() }}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0 bg-red-100 rounded-md p-3">
              <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Unread</dt>
                <dd class="text-2xl font-semibold text-gray-900">{{ chatService.totalUnreadCount() }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Conversations List -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Conversations</h2>
        </div>

        @if (isLoading()) {
          <div class="p-12 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p class="mt-2 text-sm text-gray-500">Loading conversations...</p>
          </div>
        } @else if (chatService.error()) {
          <div class="p-12 text-center">
            <svg class="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="mt-2 text-sm text-red-600">{{ chatService.error() }}</p>
          </div>
        } @else if (chatService.conversations().length === 0) {
          <div class="p-12 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No conversations yet</h3>
            <p class="mt-1 text-sm text-gray-500">
              Customer conversations will appear here when they start chatting with you
            </p>
          </div>
        } @else {
          <ul class="divide-y divide-gray-200">
            @for (conversation of chatService.conversations(); track conversation.id) {
              <li>
                <button
                  type="button"
                  (click)="openConversation(conversation.id)"
                  class="w-full hover:bg-gray-50 transition-colors text-left"
                >
                  <div class="px-6 py-4">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center flex-1 min-w-0">
                        <!-- Avatar -->
                        <div class="flex-shrink-0">
                          <div class="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                            {{ getInitials(conversation) }}
                          </div>
                        </div>

                        <!-- Content -->
                        <div class="ml-4 flex-1 min-w-0">
                          <div class="flex items-center justify-between">
                            <p class="text-sm font-medium text-gray-900 truncate">
                              {{ conversation.customerName || conversation.customerEmail || 'Guest' }}
                            </p>
                            <p class="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {{ formatTime(conversation.lastMessageAt || conversation.startedAt) }}
                            </p>
                          </div>

                          @if (conversation.lastMessageContent) {
                            <p class="mt-1 text-sm text-gray-500 truncate">
                              @if (conversation.lastMessageSenderType === 'Merchant') {
                                <span class="font-medium">You:</span>
                              }
                              {{ conversation.lastMessageContent }}
                            </p>
                          }

                          <div class="mt-1 flex items-center gap-2">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                              [class.bg-green-100]="conversation.status === 'Active'"
                              [class.text-green-800]="conversation.status === 'Active'"
                              [class.bg-gray-100]="conversation.status === 'Closed'"
                              [class.text-gray-800]="conversation.status === 'Closed'"
                            >
                              {{ conversation.status }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <!-- Unread badge -->
                      @if (conversation.unreadMerchantMessages > 0) {
                        <div class="ml-4 flex-shrink-0">
                          <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                            {{ conversation.unreadMerchantMessages }}
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                </button>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ChatListComponent implements OnInit {
  public chatService = inject(MerchantChatService);
  private storeContext = inject(StoreContextService);
  private router = inject(Router);

  public isLoading = signal(false);

  public activeCount = signal(0);

  constructor() {
    // Update active count when conversations change
    effect(() => {
      const count = this.chatService.conversations().filter(c => c.status === 'Active').length;
      this.activeCount.set(count);
    });
  }

  async ngOnInit() {
    await this.loadConversations();

    // Poll for new conversations every 30 seconds
    setInterval(() => this.loadConversations(), 30000);
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
