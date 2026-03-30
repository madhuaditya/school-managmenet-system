import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth.store';
import { ChatMessage, ChatReply } from '@/src/types';

export default function DoubtsTab() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((state) => state.user);

  const currentUserId = useMemo(() => user?._id || '', [user?._id]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const [replySendingId, setReplySendingId] = useState<string | null>(null);

  const [chatInput, setChatInput] = useState('');
  const [showChatComposer, setShowChatComposer] = useState(false);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [openReplyComposerByChat, setOpenReplyComposerByChat] = useState<Record<string, boolean>>({});
  const [repliesByChat, setRepliesByChat] = useState<Record<string, ChatReply[]>>({});
  const [replyLoadingMap, setReplyLoadingMap] = useState<Record<string, boolean>>({});
  const [expandedChats, setExpandedChats] = useState<Record<string, boolean>>({});

  const loadChats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiService.getSchoolChats({ page: 1, size: 30 });
      if (!response.success) {
        throw new Error(response.msg || 'Failed to fetch doubts');
      }

      const list = Array.isArray(response.data?.data) ? response.data.data : [];
      setChats(list);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to fetch doubts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  const loadReplies = useCallback(async (chatId: string) => {
    try {
      setReplyLoadingMap((prev) => ({ ...prev, [chatId]: true }));
      const response = await apiService.getRepliesByChat(chatId, { page: 1, size: 50 });
      if (!response.success) {
        throw new Error(response.msg || 'Failed to fetch replies');
      }

      const list = Array.isArray(response.data?.data) ? response.data.data : [];
      setRepliesByChat((prev) => ({ ...prev, [chatId]: list }));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to fetch replies');
    } finally {
      setReplyLoadingMap((prev) => ({ ...prev, [chatId]: false }));
    }
  }, []);

  const submitChat = useCallback(async () => {
    const msg = chatInput.trim();
    if (!msg) {
      Alert.alert('Validation', 'Please type your doubt first');
      return;
    }

    try {
      setSendingChat(true);
      const response = await apiService.createChat(msg);
      if (!response.success || !response.data) {
        throw new Error(response.msg || 'Failed to send doubt');
      }

      setChats((prev) => [response.data as ChatMessage, ...prev]);
      setChatInput('');
      setShowChatComposer(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send doubt');
    } finally {
      setSendingChat(false);
    }
  }, [chatInput]);

  const submitReply = useCallback(
    async (chatId: string) => {
      const msg = (replyInputs[chatId] || '').trim();
      if (!msg) {
        Alert.alert('Validation', 'Please type a reply first');
        return;
      }

      try {
        setReplySendingId(chatId);
        const response = await apiService.createReply(chatId, msg);
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to send reply');
        }

        setReplyInputs((prev) => ({ ...prev, [chatId]: '' }));
        setRepliesByChat((prev) => ({
          ...prev,
          [chatId]: [response.data as ChatReply, ...(prev[chatId] || [])],
        }));
        setChats((prev) =>
          prev.map((chat) =>
            chat._id === chatId ? { ...chat, replyCount: (chat.replyCount || 0) + 1 } : chat,
          ),
        );
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send reply');
      } finally {
        setReplySendingId(null);
      }
    },
    [replyInputs],
  );

  const toggleReplies = useCallback(
    async (chatId: string) => {
      const isOpen = !!expandedChats[chatId];
      if (isOpen) {
        setExpandedChats((prev) => ({ ...prev, [chatId]: false }));
        return;
      }

      setExpandedChats((prev) => ({ ...prev, [chatId]: true }));
      if (!repliesByChat[chatId]) {
        await loadReplies(chatId);
      }
    },
    [expandedChats, loadReplies, repliesByChat],
  );

  const renderReply = ({ item }: { item: ChatReply }) => (
    <View style={[styles.replyItem, { borderColor: theme.icon, backgroundColor: theme.background }]}> 
      <View style={styles.rowBetween}>
        <ThemedText style={styles.replyAuthor}>{item.user?.name || 'User'}</ThemedText>
        <ThemedText style={styles.replyMeta}>{new Date(item.createdAt || '').toLocaleString()}</ThemedText>
      </View>
      <ThemedText style={styles.replyText}>{item.msg}</ThemedText>
    </View>
  );

  const renderChatItem = ({ item }: { item: ChatMessage }) => {
    const isExpanded = !!expandedChats[item._id];
    const isReplyComposerOpen = !!openReplyComposerByChat[item._id];
    const replies = repliesByChat[item._id] || [];
    const replyValue = replyInputs[item._id] || '';
    const isReplyLoading = !!replyLoadingMap[item._id];
    const isSendingReply = replySendingId === item._id;
    const isMine = currentUserId && item.user?._id === currentUserId;

    return (
      <ThemedView style={[styles.chatCard, { borderColor: theme.icon, backgroundColor: theme.background }]}> 
        <View style={styles.rowBetween}>
          <View style={styles.authorRow}>
            <View style={[styles.avatarCircle, { backgroundColor: isMine ? '#0ea5e9' : '#14b8a6' }]}>
              <ThemedText style={styles.avatarText}>{(item.user?.name?.charAt(0) || 'U').toUpperCase()}</ThemedText>
            </View>
            <View>
              <ThemedText type="defaultSemiBold">{item.user?.name || 'User'}</ThemedText>
              <ThemedText style={styles.metaText}>{new Date(item.createdAt || '').toLocaleString()}</ThemedText>
            </View>
          </View>
          <View style={styles.countBadge}>
            <MaterialIcons name="chat-bubble-outline" size={14} color="#fff" />
            <ThemedText style={styles.countBadgeText}>{item.replyCount || 0}</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.chatText}>{item.msg}</ThemedText>

        <View style={styles.chatActionsRow}>
          <Pressable
            onPress={() =>
              setOpenReplyComposerByChat((prev) => ({
                ...prev,
                [item._id]: !prev[item._id],
              }))
            }
            style={styles.iconActionBtn}>
            <MaterialIcons name={isReplyComposerOpen ? 'close' : 'reply'} size={16} color="#fff" />
            <ThemedText style={styles.iconActionText}>{isReplyComposerOpen ? 'Close' : 'Reply'}</ThemedText>
          </Pressable>

          <Pressable onPress={() => void toggleReplies(item._id)} style={styles.replyToggleBtn}>
            <ThemedText style={styles.replyToggleText}>{isExpanded ? 'Hide Replies' : 'View Replies'}</ThemedText>
          </Pressable>
        </View>

        {isReplyComposerOpen ? (
          <View style={styles.replyComposerRow}>
            <TextInput
              value={replyValue}
              onChangeText={(text) => setReplyInputs((prev) => ({ ...prev, [item._id]: text }))}
              placeholder="Write a reply..."
              placeholderTextColor={theme.icon}
              editable={!isSendingReply}
              style={[styles.replyInput, { borderColor: theme.icon, color: theme.text }]}
            />
            <Pressable
              disabled={isSendingReply}
              onPress={() => void submitReply(item._id)}
              style={[styles.sendReplyButton, isSendingReply && styles.disabledButton]}>
              {isSendingReply ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </View>
        ) : null}

        {isExpanded ? (
          isReplyLoading ? (
            <View style={styles.replyLoaderWrap}>
              <ActivityIndicator size="small" color={theme.tint} />
            </View>
          ) : replies.length === 0 ? (
            <ThemedText style={styles.emptyRepliesText}>No replies yet</ThemedText>
          ) : (
            <FlatList
              data={replies}
              renderItem={renderReply}
              keyExtractor={(reply) => reply._id}
              scrollEnabled={false}
              contentContainerStyle={styles.replyListContainer}
            />
          )
        ) : null}
      </ThemedView>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.loaderScreen}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.composerCard, { borderColor: theme.icon, backgroundColor: theme.background }]}> 
        <View style={styles.composerHeaderRow}>
          <ThemedText type="subtitle">Ask a Doubt</ThemedText>
          <Pressable
            onPress={() => setShowChatComposer((prev) => !prev)}
            style={styles.composerToggleBtn}>
            <MaterialIcons name={showChatComposer ? 'close' : 'edit'} size={18} color="#fff" />
          </Pressable>
        </View>

        {showChatComposer ? (
          <View style={styles.composerRow}>
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Type your message..."
              placeholderTextColor={theme.icon}
              editable={!sendingChat}
              style={[styles.chatInput, { borderColor: theme.icon, color: theme.text }]}
              multiline
            />
            <Pressable
              disabled={sendingChat}
              onPress={() => void submitChat()}
              style={[styles.sendChatButton, sendingChat && styles.disabledButton]}>
              {sendingChat ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="send" size={20} color="#fff" />
              )}
            </Pressable>
          </View>
        ) : (
          <ThemedText style={styles.composerHint}>Tap the icon to write and send a doubt.</ThemedText>
        )}
      </View>

      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.chatListContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadChats(true)} />}
        ListEmptyComponent={<ThemedText style={styles.emptyState}>No doubts yet. Start the first one.</ThemedText>}
      />
    </ThemedView>
  );
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 12,
//   },
//   loaderScreen: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   composerCard: {
//     borderWidth: 1,
//     borderRadius: 14,
//     padding: 12,
//     gap: 10,
//     marginBottom: 10,
//   },
//   composerHeaderRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   composerToggleBtn: {
//     width: 34,
//     height: 34,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#2563eb',
//   },
//   composerHint: {
//     opacity: 0.7,
//     fontSize: 12,
//   },
//   composerRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     gap: 10,
//   },
//   chatInput: {
//     flex: 1,
//     minHeight: 44,
//     maxHeight: 120,
//     borderWidth: 1,
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     textAlignVertical: 'top',
//     fontSize: 14,
//   },
//   sendChatButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#2563eb',
//   },
//   chatListContainer: {
//     gap: 10,
//     paddingBottom: 36,
//   },
//   chatCard: {
//     borderWidth: 1,
//     borderRadius: 14,
//     padding: 12,
//     gap: 10,
//   },
//   rowBetween: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     gap: 8,
//   },
//   authorRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     flex: 1,
//   },
//   avatarCircle: {
//     width: 34,
//     height: 34,
//     borderRadius: 999,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   avatarText: {
//     color: '#fff',
//     fontWeight: '700',
//   },
//   metaText: {
//     opacity: 0.65,
//     fontSize: 12,
//   },
//   countBadge: {
//     minWidth: 44,
//     height: 26,
//     borderRadius: 999,
//     paddingHorizontal: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 4,
//     backgroundColor: '#0f766e',
//   },
//   countBadgeText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '700',
//   },
//   chatText: {
//     fontSize: 14,
//     lineHeight: 20,
//   },
//   chatActionsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: 8,
//   },
//   iconActionBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     borderRadius: 999,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     backgroundColor: '#0ea5e9',
//   },
//   iconActionText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '700',
//   },
//   replyComposerRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   replyInput: {
//     flex: 1,
//     minHeight: 40,
//     borderWidth: 1,
//     borderRadius: 10,
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     fontSize: 13,
//   },
//   sendReplyButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#059669',
//   },
//   replyToggleBtn: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 999,
//     backgroundColor: '#e2e8f0',
//   },
//   replyToggleText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#0f172a',
//   },
//   replyLoaderWrap: {
//     paddingVertical: 8,
//   },
//   emptyRepliesText: {
//     opacity: 0.7,
//     fontSize: 12,
//   },
//   replyListContainer: {
//     gap: 8,
//     marginTop: 2,
//   },
//   replyItem: {
//     borderWidth: 1,
//     borderRadius: 10,
//     padding: 10,
//     gap: 6,
//   },
//   replyAuthor: {
//     fontSize: 12,
//     fontWeight: '700',
//   },
//   replyMeta: {
//     opacity: 0.6,
//     fontSize: 11,
//   },
//   replyText: {
//     fontSize: 13,
//     lineHeight: 18,
//   },
//   disabledButton: {
//     opacity: 0.6,
//   },
//   emptyState: {
//     opacity: 0.75,
//     textAlign: 'center',
//     marginTop: 28,
//     fontSize: 13,
//   },
// });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },

  loaderScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  composerCard: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginBottom: 12,
    elevation: 4,
  },

  composerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  composerToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },

  composerHint: {
    opacity: 0.7,
    fontSize: 12,
  },

  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },

  chatInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
  },

  sendChatButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },

  chatListContainer: {
    gap: 12,
    paddingBottom: 40,
  },

  chatCard: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    elevation: 3,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },

  metaText: {
    opacity: 0.6,
    fontSize: 11,
  },

  countBadge: {
    minWidth: 40,
    height: 24,
    borderRadius: 999,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
  },

  countBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  chatText: {
    fontSize: 14,
    lineHeight: 20,
  },

  chatActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2563EB',
  },

  iconActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  replyComposerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  replyInput: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#F9FAFB',
  },

  sendReplyButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
  },

  replyToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },

  replyToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },

  replyLoaderWrap: {
    paddingVertical: 8,
  },

  emptyRepliesText: {
    opacity: 0.7,
    fontSize: 12,
  },

  replyListContainer: {
    gap: 8,
    marginTop: 4,
  },

  replyItem: {
    borderRadius: 12,
    padding: 10,
    gap: 6,
    backgroundColor: '#F9FAFB',
  },

  replyAuthor: {
    fontSize: 12,
    fontWeight: '700',
  },

  replyMeta: {
    opacity: 0.6,
    fontSize: 11,
  },

  replyText: {
    fontSize: 13,
    lineHeight: 18,
  },

  disabledButton: {
    opacity: 0.6,
  },

  emptyState: {
    opacity: 0.75,
    textAlign: 'center',
    marginTop: 30,
    fontSize: 13,
  },
});

