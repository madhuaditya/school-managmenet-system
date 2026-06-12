export type MessagingConversationType = 'direct' | 'school_broadcast' | 'private_group';
export type MessagingMessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'system';
type MessagingRole = 'admin' | 'teacher' | 'student' | 'staff' | string;

export interface MessagingUserSummary {
  _id: string;
  name: string;
  email?: string;
  image?: string;
  username?: string;
  role: MessagingRole;
}

export interface MessagingAttachment {
  url: string;
  publicId?: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface MessagingReplyPreview {
  _id: string;
  bodyPlain: string;
  type: MessagingMessageType;
  sender: MessagingUserSummary | null;
  createdAt?: string;
}

export interface MessagingMessage {
  _id: string;
  conversation: string;
  school?: string;
  sender: MessagingUserSummary | null;
  type: MessagingMessageType;
  bodyPlain: string;
  bodyMarkdown?: string;
  attachments: MessagingAttachment[];
  replyToMessage?: MessagingReplyPreview | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  clientTempId?: string | null;
  localStatus?: 'sending' | 'failed';
}

export interface MessagingConversationMember {
  _id: string;
  roleInGroup: 'owner' | 'member' | 'participant';
  isMuted?: boolean;
  joinedAt?: string;
  user: MessagingUserSummary | null;
}

export interface MessagingConversation {
  _id: string;
  school?: string;
  type: MessagingConversationType;
  name: string;
  description?: string;
  title: string;
  image?: string | null;
  isArchived?: boolean;
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
  lastMessage?: MessagingMessage | null;
  unreadCount?: number;
  currentMember?: {
    _id: string;
    roleInGroup: 'owner' | 'member' | 'participant';
    lastReadAt?: string | null;
    lastReadMessage?: string | null;
    isMuted?: boolean;
  } | null;
  members: MessagingConversationMember[];
  canPost?: boolean;
}

export interface MessagingContact {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  image?: string;
  username?: string;
  role: MessagingRole;
  school?: string;
}

export interface MessagingMessagesPage {
  records: MessagingMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MessagingTypingState {
  conversationId: string;
  user: Pick<MessagingUserSummary, '_id' | 'name' | 'image'>;
  isTyping: boolean;
}
