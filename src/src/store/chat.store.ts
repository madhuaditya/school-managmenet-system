import { create } from 'zustand';
import { apiService } from '@/api/client';
import { messagingSocket } from '@/src/services/messagingSocket';
import type {
  MessagingAttachment,
  MessagingContact,
  MessagingConversation,
  MessagingMessage,
  MessagingTypingState,
  User,
} from '@/src/types';
import { useAuthStore } from './auth.store';

type AttachmentUploadInput = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

interface ChatState {
  conversations: MessagingConversation[];
  messagesByConversation: Record<string, MessagingMessage[]>;
  contacts: MessagingContact[];
  typingByConversation: Record<string, MessagingTypingState['user'][]>;
  isSocketConnected: boolean;
  isSocketInitialized: boolean;
  socketToken: string | null;
  currentConversationId: string | null;
  loadingConversations: boolean;
  loadingContacts: boolean;
  loadingMessages: Record<string, boolean>;
  initializeSocket: (token: string) => void;
  disconnectSocket: () => void;
  loadConversations: () => Promise<void>;
  loadContacts: (params?: { q?: string; roles?: string[] }) => Promise<void>;
  loadMessages: (conversationId: string, page?: number, limit?: number) => Promise<void>;
  createDirectConversation: (targetUserId: string) => Promise<MessagingConversation>;
  createPrivateGroup: (payload: { name: string; description?: string; memberIds: string[] }) => Promise<MessagingConversation>;
  uploadAttachment: (input: AttachmentUploadInput) => Promise<MessagingAttachment>;
  sendMessage: (payload: {
    conversationId: string;
    bodyPlain?: string;
    bodyMarkdown?: string;
    attachments?: MessagingAttachment[];
    type?: string;
  }) => Promise<void>;
  markConversationRead: (conversationId: string, messageId?: string) => Promise<void>;
  joinConversation: (conversationId: string) => Promise<void>;
  leaveConversation: (conversationId: string) => Promise<void>;
  setCurrentConversation: (conversationId: string | null) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => Promise<void>;
}

const toRoleName = (user: User | null | undefined) =>
  typeof user?.role === 'string' ? user.role : user?.role?.role || 'student';

const sortConversations = (conversations: MessagingConversation[]) =>
  [...conversations].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

const sortMessages = (messages: MessagingMessage[]) =>
  [...messages].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return aTime - bTime;
  });

const upsertConversation = (conversations: MessagingConversation[], nextConversation: MessagingConversation) => {
  const rest = conversations.filter((entry) => entry._id !== nextConversation._id);
  return sortConversations([nextConversation, ...rest]);
};

const upsertMessage = (messages: MessagingMessage[], incoming: MessagingMessage, clientTempId?: string | null) => {
  const withoutTemp = messages.filter((entry) => entry._id !== incoming._id && (!clientTempId || entry._id !== clientTempId));
  return sortMessages([...withoutTemp, incoming]);
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messagesByConversation: {},
  contacts: [],
  typingByConversation: {},
  isSocketConnected: false,
  isSocketInitialized: false,
  socketToken: null,
  currentConversationId: null,
  loadingConversations: false,
  loadingContacts: false,
  loadingMessages: {},

  initializeSocket: (token: string) => {
    if (!token) return;

    messagingSocket.connect(token, {
      onConnect: () => set({ isSocketConnected: true, isSocketInitialized: true, socketToken: token }),
      onDisconnect: () => set({ isSocketConnected: false }),
      onMessageNew: (message) => {
        set((state) => {
          const currentMessages = state.messagesByConversation[message.conversation] || [];
          return {
            messagesByConversation: {
              ...state.messagesByConversation,
              [message.conversation]: upsertMessage(currentMessages, message, message.clientTempId || null),
            },
          };
        });
      },
      onConversationUpdated: (conversation) => {
        set((state) => ({
          conversations: upsertConversation(state.conversations, conversation),
        }));
      },
      onConversationUnread: ({ conversationId, unreadCount }) => {
        set((state) => ({
          conversations: state.conversations.map((entry) =>
            entry._id === conversationId ? { ...entry, unreadCount } : entry,
          ),
        }));
      },
      onTypingUpdate: (payload) => {
        set((state) => {
          const currentUsers = state.typingByConversation[payload.conversationId] || [];
          const nextUsers = payload.isTyping
            ? [...currentUsers.filter((entry) => entry._id !== payload.user._id), payload.user]
            : currentUsers.filter((entry) => entry._id !== payload.user._id);

          return {
            typingByConversation: {
              ...state.typingByConversation,
              [payload.conversationId]: nextUsers,
            },
          };
        });
      },
    });
  },

  disconnectSocket: () => {
    messagingSocket.disconnect();
    set({
      isSocketConnected: false,
      isSocketInitialized: false,
      socketToken: null,
      typingByConversation: {},
    });
  },

  loadConversations: async () => {
    set({ loadingConversations: true });
    try {
      const response = await apiService.getMessagingConversations();
      if (!response.success || !response.data) {
        throw new Error(response.msg || 'Failed to fetch conversations');
      }

      set({
        conversations: sortConversations(response.data),
      });
    } finally {
      set({ loadingConversations: false });
    }
  },

  loadContacts: async (params) => {
    set({ loadingContacts: true });
    try {
      const response = await apiService.getMessagingContacts(params);
      if (!response.success || !response.data) {
        throw new Error(response.msg || 'Failed to fetch contacts');
      }
      set({ contacts: response.data });
    } finally {
      set({ loadingContacts: false });
    }
  },

  loadMessages: async (conversationId, page = 1, limit = 30) => {
    set((state) => ({
      loadingMessages: {
        ...state.loadingMessages,
        [conversationId]: true,
      },
    }));

    try {
      const response = await apiService.getMessagingMessages(conversationId, { page, limit });
      if (!response.success || !response.data) {
        throw new Error(response.msg || 'Failed to fetch messages');
      }

      const current = page > 1 ? get().messagesByConversation[conversationId] || [] : [];
      const merged = sortMessages([...current, ...(response.data.records || [])]);
      const deduped = Array.from(new Map(merged.map((entry) => [entry._id, entry])).values());

      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: deduped,
        },
      }));
    } finally {
      set((state) => ({
        loadingMessages: {
          ...state.loadingMessages,
          [conversationId]: false,
        },
      }));
    }
  },

  createDirectConversation: async (targetUserId) => {
    const response = await apiService.createDirectConversation(targetUserId);
    const conversation = response.data;
    if (!response.success || !conversation) {
      throw new Error(response.msg || 'Failed to create direct conversation');
    }

    set((state) => ({
      conversations: upsertConversation(state.conversations, conversation),
    }));

    return conversation;
  },

  createPrivateGroup: async (payload) => {
    const response = await apiService.createMessagingGroup(payload);
    const conversation = response.data;
    if (!response.success || !conversation) {
      throw new Error(response.msg || 'Failed to create private group');
    }

    set((state) => ({
      conversations: upsertConversation(state.conversations, conversation),
    }));

    return conversation;
  },

  uploadAttachment: async (input) => {
    const response = await apiService.uploadMessagingAsset(input);
    if (!response.success || !response.data) {
      throw new Error(response.msg || 'Failed to upload attachment');
    }
    return response.data;
  },

  sendMessage: async ({ conversationId, bodyPlain, bodyMarkdown, attachments = [], type }) => {
    const authUser = useAuthStore.getState().user;
    if (!authUser) {
      throw new Error('You must be logged in to send messages');
    }

    const tempId = `temp-${Date.now()}`;
    const draftText = String(bodyPlain || '').trim();
    const createdAt = new Date().toISOString();
    const tempMessage: MessagingMessage = {
      _id: tempId,
      conversation: conversationId,
      sender: {
        _id: authUser._id,
        name: authUser.name,
        email: authUser.email,
        image: authUser.image,
        role: toRoleName(authUser),
      },
      type: (type as MessagingMessage['type']) || (attachments[0]?.mimeType?.startsWith('image/') ? 'image' : 'text'),
      bodyPlain: draftText,
      bodyMarkdown: bodyMarkdown || draftText,
      attachments,
      createdAt,
      updatedAt: createdAt,
      localStatus: 'sending',
    };

    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: upsertMessage(state.messagesByConversation[conversationId] || [], tempMessage),
      },
    }));

    try {
      let finalMessage: MessagingMessage | null = null;

      if (get().isSocketConnected) {
        const ack = await messagingSocket.sendMessage({
          conversationId,
          type,
          bodyPlain: draftText,
          bodyMarkdown: bodyMarkdown || draftText,
          attachments,
          clientTempId: tempId,
        });

        if (!ack.success || !ack.data) {
          throw new Error(ack.msg || 'Failed to send message');
        }

        finalMessage = ack.data;
      } else {
        const response = await apiService.sendMessagingMessage(conversationId, {
          type,
          bodyPlain: draftText,
          bodyMarkdown: bodyMarkdown || draftText,
          attachments,
        });

        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to send message');
        }

        finalMessage = response.data;
      }

      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: upsertMessage(state.messagesByConversation[conversationId] || [], finalMessage, tempId),
        },
      }));
    } catch (error) {
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: (state.messagesByConversation[conversationId] || []).filter((entry) => entry._id !== tempId),
        },
      }));
      throw error;
    }
  },

  markConversationRead: async (conversationId, messageId) => {
    const response = await apiService.markMessagingConversationRead(conversationId, messageId);
    if (!response.success) {
      throw new Error(response.msg || 'Failed to mark conversation as read');
    }

    set((state) => ({
      conversations: state.conversations.map((entry) =>
        entry._id === conversationId ? { ...entry, unreadCount: 0 } : entry,
      ),
    }));

    if (get().isSocketConnected) {
      try {
        await messagingSocket.markRead(conversationId, messageId);
      } catch {
        // Read state is already persisted via REST.
      }
    }
  },

  joinConversation: async (conversationId) => {
    set({ currentConversationId: conversationId });
    if (!get().isSocketConnected) return;
    const ack = await messagingSocket.joinConversation(conversationId);
    if (!ack.success) {
      throw new Error(ack.msg || 'Failed to join conversation');
    }
  },

  leaveConversation: async (conversationId) => {
    if (get().isSocketConnected) {
      try {
        await messagingSocket.leaveConversation(conversationId);
      } catch {
        // Ignore leave failures during navigation.
      }
    }

    set((state) => ({
      currentConversationId: state.currentConversationId === conversationId ? null : state.currentConversationId,
      typingByConversation: {
        ...state.typingByConversation,
        [conversationId]: [],
      },
    }));
  },

  setCurrentConversation: (conversationId) => set({ currentConversationId: conversationId }),

  sendTyping: async (conversationId, isTyping) => {
    if (!get().isSocketConnected) return;
    try {
      await messagingSocket.sendTyping(conversationId, isTyping);
    } catch {
      // Typing indicators are best-effort.
    }
  },
}));
