import { io, Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from '@/src/constants';
import type { MessagingConversation, MessagingMessage, MessagingTypingState } from '@/src/types';

type SocketAck<T> = {
  success: boolean;
  data?: T;
  msg?: string;
};

type MessagingSocketHandlers = {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessageNew?: (message: MessagingMessage & { clientTempId?: string | null }) => void;
  onConversationUpdated?: (conversation: MessagingConversation) => void;
  onConversationUnread?: (payload: { conversationId: string; unreadCount: number }) => void;
  onTypingUpdate?: (payload: MessagingTypingState) => void;
};

class MessagingSocketManager {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string, handlers: MessagingSocketHandlers) {
    if (this.socket && this.token === token) {
      this.bindHandlers(handlers);
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return;
    }

    this.disconnect();
    this.token = token;
    this.socket = io(SOCKET_BASE_URL, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
      reconnection: true,
    });

    this.bindHandlers(handlers);
  }

  private bindHandlers(handlers: MessagingSocketHandlers) {
    if (!this.socket) return;

    this.socket.removeAllListeners();
    this.socket.on('connect', () => handlers.onConnect?.());
    this.socket.on('disconnect', () => handlers.onDisconnect?.());
    this.socket.on('message:new', (payload: MessagingMessage & { clientTempId?: string | null }) => handlers.onMessageNew?.(payload));
    this.socket.on('conversation:updated', (payload: MessagingConversation) => handlers.onConversationUpdated?.(payload));
    this.socket.on('conversation:unread', (payload: { conversationId: string; unreadCount: number }) => handlers.onConversationUnread?.(payload));
    this.socket.on('typing:update', (payload: MessagingTypingState) => handlers.onTypingUpdate?.(payload));
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
  }

  isConnected() {
    return Boolean(this.socket?.connected);
  }

  private emitWithAck<T>(event: string, payload: object): Promise<SocketAck<T>> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Messaging socket is not connected'));
        return;
      }

      this.socket.timeout(10000).emit(event, payload, (error: Error | null, response: SocketAck<T>) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      });
    });
  }

  joinConversation(conversationId: string) {
    return this.emitWithAck<{ conversationId: string }>('conversation:join', { conversationId });
  }

  leaveConversation(conversationId: string) {
    return this.emitWithAck<{ conversationId: string }>('conversation:leave', { conversationId });
  }

  sendMessage(payload: {
    conversationId: string;
    type?: string;
    bodyPlain?: string;
    bodyMarkdown?: string;
    attachments?: unknown[];
    replyToMessageId?: string;
    clientTempId?: string;
  }) {
    return this.emitWithAck<MessagingMessage>('message:send', payload);
  }

  markRead(conversationId: string, messageId?: string) {
    return this.emitWithAck<{ conversationId: string; unreadCount: number }>('message:read', {
      conversationId,
      messageId,
    });
  }

  sendTyping(conversationId: string, isTyping: boolean) {
    const event = isTyping ? 'typing:start' : 'typing:stop';
    return this.emitWithAck<{ success: boolean }>(event, { conversationId });
  }
}

export const messagingSocket = new MessagingSocketManager();
