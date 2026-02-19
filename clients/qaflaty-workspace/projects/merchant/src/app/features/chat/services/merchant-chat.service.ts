import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'Customer' | 'Merchant' | 'Bot';
  senderId?: string;
  content: string;
  sentAt: string;
  readAt?: string;
}

export interface ConversationSummary {
  id: string;
  storeId: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  guestSessionId?: string;
  status: 'Active' | 'Closed' | 'Archived';
  startedAt: string;
  closedAt?: string;
  lastMessageAt?: string;
  lastMessageContent?: string;
  lastMessageSenderType?: string;
  unreadCustomerMessages: number;
  unreadMerchantMessages: number;
}

export interface ChatConversation {
  id: string;
  storeId: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  guestSessionId?: string;
  status: 'Active' | 'Closed' | 'Archived';
  startedAt: string;
  closedAt?: string;
  lastMessageAt?: string;
  messages: ChatMessage[];
  unreadCustomerMessages: number;
  unreadMerchantMessages: number;
}

interface SendMessageRequest {
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class MerchantChatService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  // SignalR connection
  private hubConnection?: signalR.HubConnection;

  // State
  public conversations = signal<ConversationSummary[]>([]);
  public activeConversation = signal<ChatConversation | null>(null);
  public messages = signal<ChatMessage[]>([]);
  public isConnected = signal(false);
  public isConnecting = signal(false);
  public isCustomerTyping = signal(false);
  public error = signal<string | null>(null);

  // Computed
  public totalUnreadCount = computed(() =>
    this.conversations().reduce((sum, conv) => sum + conv.unreadMerchantMessages, 0)
  );

  /**
   * Load conversations for a store
   */
  async loadConversations(storeId: string, pageNumber: number = 1, pageSize: number = 20): Promise<void> {
    try {
      this.error.set(null);

      const response = await firstValueFrom(
        this.http.get<{ conversations: ConversationSummary[]; pageNumber: number; pageSize: number; totalCount: number }>(
          `${this.apiUrl}/stores/${storeId}/chat/conversations`,
          { params: { pageNumber: pageNumber.toString(), pageSize: pageSize.toString() } }
        )
      );

      this.conversations.set(response.conversations);
    } catch (err: any) {
      this.error.set(err?.error?.error || 'Failed to load conversations');
      throw err;
    }
  }

  /**
   * Get unread conversations count
   */
  async getUnreadCount(storeId: string): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ unreadCount: number }>(
          `${this.apiUrl}/stores/${storeId}/chat/conversations/unread/count`
        )
      );

      return response.unreadCount;
    } catch (err) {
      console.error('Failed to get unread count:', err);
      return 0;
    }
  }

  /**
   * Open a conversation and connect to SignalR
   */
  async openConversation(storeId: string, conversationId: string): Promise<void> {
    try {
      this.error.set(null);

      const conversation = await firstValueFrom(
        this.http.get<ChatConversation>(
          `${this.apiUrl}/stores/${storeId}/chat/conversations/${conversationId}`
        )
      );

      this.activeConversation.set(conversation);
      this.messages.set(conversation.messages);

      await this.connectToHub();
    } catch (err: any) {
      this.error.set(err?.error?.error || 'Failed to open conversation');
      throw err;
    }
  }

  /**
   * Send a message in the active conversation
   */
  async sendMessage(storeId: string, content: string): Promise<void> {
    const conv = this.activeConversation();
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
          'Merchant',
          this.authService.getCurrentMerchantId()
        );
      } else {
        // Fallback to HTTP
        const request: SendMessageRequest = { content };
        const message = await firstValueFrom(
          this.http.post<ChatMessage>(
            `${this.apiUrl}/stores/${storeId}/chat/conversations/${conv.id}/messages`,
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
  async markMessagesAsRead(storeId: string, messageIds: string[]): Promise<void> {
    const conv = this.activeConversation();
    if (!conv || messageIds.length === 0) return;

    try {
      // Use SignalR if connected
      if (this.isConnected() && this.hubConnection) {
        await this.hubConnection.invoke(
          'MarkMessagesAsRead',
          conv.id,
          messageIds,
          'Merchant'
        );
      } else {
        // Fallback to HTTP
        await firstValueFrom(
          this.http.post(
            `${this.apiUrl}/stores/${storeId}/chat/conversations/${conv.id}/messages/read`,
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

      // Update conversation unread count
      this.activeConversation.update(c =>
        c ? { ...c, unreadMerchantMessages: 0 } : c
      );

      // Update conversations list
      this.conversations.update(convs =>
        convs.map(c =>
          c.id === conv.id ? { ...c, unreadMerchantMessages: 0 } : c
        )
      );
    } catch (err: any) {
      console.error('Failed to mark messages as read:', err);
    }
  }

  /**
   * Close active conversation
   */
  async closeConversation(storeId: string): Promise<void> {
    const conv = this.activeConversation();
    if (!conv) return;

    try {
      await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/stores/${storeId}/chat/conversations/${conv.id}/close`,
          {}
        )
      );

      // Update local state
      this.activeConversation.update(c =>
        c ? { ...c, status: 'Closed' as const, closedAt: new Date().toISOString() } : c
      );

      this.conversations.update(convs =>
        convs.map(c =>
          c.id === conv.id ? { ...c, status: 'Closed' as const, closedAt: new Date().toISOString() } : c
        )
      );

      await this.disconnectFromHub();
    } catch (err: any) {
      this.error.set(err?.error?.error || 'Failed to close conversation');
      throw err;
    }
  }

  /**
   * Archive a closed conversation
   */
  async archiveConversation(storeId: string): Promise<void> {
    const conv = this.activeConversation();
    if (!conv) return;

    try {
      await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/stores/${storeId}/chat/conversations/${conv.id}/archive`,
          {}
        )
      );

      // Update local state
      this.activeConversation.update(c =>
        c ? { ...c, status: 'Archived' as const } : c
      );

      this.conversations.update(convs =>
        convs.map(c =>
          c.id === conv.id ? { ...c, status: 'Archived' as const } : c
        )
      );
    } catch (err: any) {
      this.error.set(err?.error?.error || 'Failed to archive conversation');
      throw err;
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(isTyping: boolean): Promise<void> {
    const conv = this.activeConversation();
    if (!conv || !this.isConnected() || !this.hubConnection) return;

    try {
      await this.hubConnection.invoke(
        'SendTypingIndicator',
        conv.id,
        'Merchant',
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

    const conv = this.activeConversation();
    if (!conv) return;

    this.isConnecting.set(true);

    try {
      // Build connection URL with merchant token
      const token = this.authService.getAccessToken();
      const hubUrl = `${this.apiUrl.replace('/api', '') }/hubs/chat${token ? `?access_token=${token}` : ''}`;
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect()
        .build();

      // Set up event handlers
      this.hubConnection.on('ReceiveMessage', (message: ChatMessage) => {
        this.messages.update(msgs => [...msgs, message]);

        // Update conversation in list
        this.conversations.update(convs =>
          convs.map(c =>
            c.id === conv.id
              ? {
                  ...c,
                  lastMessageAt: message.sentAt,
                  lastMessageContent: message.content,
                  lastMessageSenderType: message.senderType,
                  unreadMerchantMessages:
                    message.senderType === 'Customer' ? c.unreadMerchantMessages + 1 : c.unreadMerchantMessages
                }
              : c
          )
        );
      });

      this.hubConnection.on('MessagesRead', (messageIds: string[]) => {
        this.messages.update(msgs =>
          msgs.map(m =>
            messageIds.includes(m.id) ? { ...m, readAt: new Date().toISOString() } : m
          )
        );
      });

      this.hubConnection.on('UserTyping', (senderType: string, isTyping: boolean) => {
        if (senderType === 'Customer') {
          this.isCustomerTyping.set(isTyping);
        }
      });

      this.hubConnection.on('Error', (error: string) => {
        this.error.set(error);
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
      const conv = this.activeConversation();
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
   * Close active conversation UI (without closing the conversation itself)
   */
  async closeActiveConversation(): Promise<void> {
    await this.disconnectFromHub();
    this.activeConversation.set(null);
    this.messages.set([]);
    this.error.set(null);
  }

  /**
   * Clean up on service destroy
   */
  ngOnDestroy(): void {
    this.disconnectFromHub();
  }
}
