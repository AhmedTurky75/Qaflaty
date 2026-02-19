import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { CustomerAuthService } from './customer-auth.service';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'Customer' | 'Merchant' | 'Bot';
  senderId?: string;
  content: string;
  sentAt: string;
  readAt?: string;
}

export interface ChatConversation {
  id: string;
  storeId: string;
  customerId?: string;
  guestSessionId?: string;
  status: 'Active' | 'Closed' | 'Archived';
  startedAt: string;
  closedAt?: string;
  lastMessageAt?: string;
  messages: ChatMessage[];
  unreadCustomerMessages: number;
  unreadMerchantMessages: number;
}

interface StartConversationRequest {
  guestSessionId?: string;
  initialMessage?: string;
}

interface SendMessageRequest {
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private authService = inject(CustomerAuthService);
  private apiUrl = environment.apiUrl;

  // SignalR connection
  private hubConnection?: signalR.HubConnection;

  // State
  public conversation = signal<ChatConversation | null>(null);
  public messages = signal<ChatMessage[]>([]);
  public isConnected = signal(false);
  public isConnecting = signal(false);
  public isMerchantTyping = signal(false);
  public error = signal<string | null>(null);

  // Computed
  public hasActiveConversation = computed(() => this.conversation() !== null);
  public unreadCount = computed(() => this.conversation()?.unreadCustomerMessages ?? 0);

  // Guest session ID for unauthenticated users
  private guestSessionId: string;

  constructor() {
    // Generate or retrieve guest session ID
    const stored = localStorage.getItem('chat_guest_session');
    if (stored) {
      this.guestSessionId = stored;
    } else {
      this.guestSessionId = this.generateGuestSessionId();
      localStorage.setItem('chat_guest_session', this.guestSessionId);
    }
  }

  private generateGuestSessionId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Start a new conversation or get existing active conversation
   */
  async startConversation(initialMessage?: string): Promise<void> {
    try {
      this.error.set(null);

      const request: StartConversationRequest = {
        guestSessionId: this.authService.isAuthenticated() ? undefined : this.guestSessionId,
        initialMessage
      };

      const conversation = await firstValueFrom(
        this.http.post<ChatConversation>(
          `${this.apiUrl}/storefront/chat/conversations/start`,
          request
        )
      );

      if (conversation) {
        this.conversation.set(conversation);
        this.messages.set(conversation.messages);
        await this.connectToHub();
      }
    } catch (err: any) {
      this.error.set(err?.error?.error || 'Failed to start conversation');
      throw err;
    }
  }

  /**
   * Get active conversation for current customer/guest
   */
  async getActiveConversation(): Promise<void> {
    try {
      this.error.set(null);

      const params: Record<string, string> = {};
      if (!this.authService.isAuthenticated()) {
        params['guestSessionId'] = this.guestSessionId;
      }

      const conversation = await firstValueFrom(
        this.http.get<ChatConversation>(
          `${this.apiUrl}/storefront/chat/conversations/active`,
          Object.keys(params).length > 0 ? { params } : {}
        )
      );

      if (conversation) {
        this.conversation.set(conversation);
        this.messages.set(conversation.messages);
        await this.connectToHub();
      }
    } catch (err: any) {
      // 404 is expected when no active conversation exists
      if (err?.status !== 404) {
        this.error.set(err?.error?.error || 'Failed to get conversation');
      }
    }
  }

  /**
   * Send a message in the current conversation
   */
  async sendMessage(content: string): Promise<void> {
    const conv = this.conversation();
    if (!conv) {
      throw new Error('No active conversation');
    }

    try {
      this.error.set(null);

      // If SignalR is connected, use it for real-time messaging
      if (this.isConnected() && this.hubConnection) {
        await this.hubConnection.invoke(
          'SendMessage',
          conv.id,
          content,
          'Customer',
          this.authService.customer()?.id
        );
      } else {
        // Fallback to HTTP
        const request: SendMessageRequest = { content };
        const message = await firstValueFrom(
          this.http.post<ChatMessage>(
            `${this.apiUrl}/storefront/chat/conversations/${conv.id}/messages`,
            request
          )
        );

        if (message) {
          this.messages.update(msgs => [...msgs, message]);
        }
      }
    } catch (err: any) {
      this.error.set(err?.error?.error || 'Failed to send message');
      throw err;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    const conv = this.conversation();
    if (!conv || messageIds.length === 0) return;

    try {
      // Use SignalR if connected
      if (this.isConnected() && this.hubConnection) {
        await this.hubConnection.invoke(
          'MarkMessagesAsRead',
          conv.id,
          messageIds,
          'Customer'
        );
      } else {
        // Fallback to HTTP
        await firstValueFrom(
          this.http.post(
            `${this.apiUrl}/storefront/chat/conversations/${conv.id}/messages/read`,
            { messageIds }
          )
        );
      }

      // Update local state
      this.messages.update(msgs =>
        msgs.map(m =>
          messageIds.includes(m.id) ? { ...m, readAt: new Date().toISOString() } : m
        )
      );
    } catch (err: any) {
      console.error('Failed to mark messages as read:', err);
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(isTyping: boolean): Promise<void> {
    const conv = this.conversation();
    if (!conv || !this.isConnected() || !this.hubConnection) return;

    try {
      await this.hubConnection.invoke(
        'SendTypingIndicator',
        conv.id,
        'Customer',
        isTyping
      );
    } catch (err) {
      console.error('Failed to send typing indicator:', err);
    }
  }

  /**
   * Connect to SignalR hub
   */
  private async connectToHub(): Promise<void> {
    if (this.hubConnection) {
      await this.disconnectFromHub();
    }

    const conv = this.conversation();
    if (!conv) return;

    this.isConnecting.set(true);

    try {
      // Build connection URL with token if authenticated
      const token = this.authService.getAccessToken();
      const hubUrl = `${this.apiUrl.replace('/api', '') }/hubs/chat${token ? `?access_token=${token}` : ''}`;

      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect()
        .build();

      // Set up event handlers
      this.hubConnection.on('ReceiveMessage', (message: ChatMessage) => {
        this.messages.update(msgs => [...msgs, message]);

        // Update unread count if message is from merchant
        if (message.senderType === 'Merchant' || message.senderType === 'Bot') {
          this.conversation.update(c =>
            c ? { ...c, unreadCustomerMessages: c.unreadCustomerMessages + 1 } : c
          );
        }
      });

      this.hubConnection.on('MessagesRead', (messageIds: string[]) => {
        this.messages.update(msgs =>
          msgs.map(m =>
            messageIds.includes(m.id) ? { ...m, readAt: new Date().toISOString() } : m
          )
        );
      });

      this.hubConnection.on('UserTyping', (senderType: string, isTyping: boolean) => {
        if (senderType === 'Merchant') {
          this.isMerchantTyping.set(isTyping);
        }
      });

      this.hubConnection.on('Error', (error: string) => {
        this.error.set(error);
      });

      this.hubConnection.on('ConversationClosed', () => {
        this.conversation.update(c => c ? { ...c, status: 'Closed' as const } : c);
      });

      // Start connection
      await this.hubConnection.start();

      // Join conversation room
      await this.hubConnection.invoke('JoinConversation', conv.id);

      this.isConnected.set(true);
      this.isConnecting.set(false);
    } catch (err) {
      console.error('SignalR connection failed:', err);
      this.isConnected.set(false);
      this.isConnecting.set(false);
      // Don't throw - HTTP fallback will be used
    }
  }

  /**
   * Disconnect from SignalR hub
   */
  private async disconnectFromHub(): Promise<void> {
    if (!this.hubConnection) return;

    try {
      const conv = this.conversation();
      if (conv) {
        await this.hubConnection.invoke('LeaveConversation', conv.id);
      }
      await this.hubConnection.stop();
    } catch (err) {
      console.error('Error disconnecting from hub:', err);
    } finally {
      this.hubConnection = undefined;
      this.isConnected.set(false);
    }
  }

  /**
   * Close current conversation UI (disconnect hub, clear state)
   */
  async closeConversation(): Promise<void> {
    await this.disconnectFromHub();
    this.conversation.set(null);
    this.messages.set([]);
    this.error.set(null);
  }

  /**
   * Start a brand-new conversation, clearing the old closed one from view
   */
  async startNewConversation(): Promise<void> {
    await this.disconnectFromHub();
    // Generate a new guest session so the new conversation is not linked to the closed one
    this.guestSessionId = this.generateGuestSessionId();
    localStorage.setItem('chat_guest_session', this.guestSessionId);
    this.conversation.set(null);
    this.messages.set([]);
    this.error.set(null);
    await this.startConversation();
  }

  /**
   * Clean up on service destroy
   */
  ngOnDestroy(): void {
    this.disconnectFromHub();
  }
}
