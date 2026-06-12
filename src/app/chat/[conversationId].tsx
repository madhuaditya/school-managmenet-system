import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MessageMarkdown } from '@/src/components/chat/MessageMarkdown';
import { useAuthStore } from '@/src/store/auth.store';
import { useChatStore } from '@/src/store/chat.store';
import type { MessagingAttachment, MessagingMessage } from '@/src/types';

export default function ConversationScreen() {
  const params = useLocalSearchParams<{ conversationId?: string | string[] }>();
  const conversationId = Array.isArray(params.conversationId) ? params.conversationId[0] || '' : params.conversationId || '';
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const flatListRef = useRef<FlatList<MessagingMessage>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const user = useAuthStore((state) => state.user);
  const conversations = useChatStore((state) => state.conversations);
  const messagesByConversation = useChatStore((state) => state.messagesByConversation);
  const loadingMessages = useChatStore((state) => state.loadingMessages);
  const typingByConversation = useChatStore((state) => state.typingByConversation);
  const loadMessages = useChatStore((state) => state.loadMessages);
  const joinConversation = useChatStore((state) => state.joinConversation);
  const leaveConversation = useChatStore((state) => state.leaveConversation);
  const markConversationRead = useChatStore((state) => state.markConversationRead);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const sendTyping = useChatStore((state) => state.sendTyping);
  const uploadAttachment = useChatStore((state) => state.uploadAttachment);

  const [draft, setDraft] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<MessagingAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const insets = useSafeAreaInsets();

  const conversation = useMemo(
    () => conversations.find((entry) => entry._id === conversationId),
    [conversationId, conversations],
  );

  const messages = useMemo(
    () => messagesByConversation[conversationId || ''] || [],
    [conversationId, messagesByConversation],
  );

  const typingUsers = typingByConversation[conversationId || ''] || [];
  const canPost = conversation?.canPost !== false;

  useEffect(() => {
    navigation.setOptions({
      title: conversation?.title || 'Chat',
    });
  }, [conversation?.title, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!conversationId) return () => undefined;

      let active = true;

      const bootstrap = async () => {
        try {
          await joinConversation(conversationId);
          await loadMessages(conversationId);
        } catch (error) {
          if (active) {
            Alert.alert('Chat', error instanceof Error ? error.message : 'Failed to open conversation');
          }
        }
      };

      void bootstrap();

      return () => {
        active = false;
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        void sendTyping(conversationId, false);
        void leaveConversation(conversationId);
      };
    }, [conversationId, joinConversation, leaveConversation, loadMessages, sendTyping]),
  );

  useEffect(() => {
    if (!conversationId || !messages.length) return;
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.sender?._id && latestMessage.sender._id !== user?._id) {
      void markConversationRead(conversationId, latestMessage._id);
    }
  }, [conversationId, markConversationRead, messages, user?._id]);


  const appendMarkdownToken = (token: string) => {
    setDraft((prev) => `${prev}${prev ? ' ' : ''}${token}`);
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!conversationId) return;
    void sendTyping(conversationId, Boolean(value.trim()));
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      void sendTyping(conversationId, false);
    }, 1500);
  };

  const handleUploadAssets = async (assets: AttachmentSource[]) => {
    if (!assets.length) return;

    try {
      setUploading(true);
      const uploaded: MessagingAttachment[] = [];
      for (const asset of assets) {
        const result = await uploadAttachment({
          uri: asset.uri,
          fileName: asset.name,
          mimeType: asset.mimeType,
        });
        uploaded.push(result);
      }
      setSelectedAttachments((prev) => [...prev, ...uploaded]);
    } catch (error) {
      Alert.alert('Upload', error instanceof Error ? error.message : 'Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Media library access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (result.canceled) return;
    const assets: AttachmentSource[] = (result.assets || []).map((asset: any) => ({
      uri: asset.uri,
      name: asset.fileName || `media-${Date.now()}`,
      mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
    }));
    await handleUploadAssets(assets);
  };

  const pickDocument = async (type: string) => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;
    const assets: AttachmentSource[] = (result.assets || []).map((asset: any) => ({
      uri: asset.uri,
      name: asset.name || `file-${Date.now()}`,
      mimeType: asset.mimeType || 'application/octet-stream',
    }));
    await handleUploadAssets(assets);
  };

  const handleSend = async () => {
    if (!conversationId) return;
    const nextDraft = draft.trim();
    if (!nextDraft && !selectedAttachments.length) {
      Alert.alert('Validation', 'Write a message or attach a file first.');
      return;
    }

    try {
      setSending(true);
      await sendMessage({
        conversationId,
        bodyPlain: nextDraft,
        bodyMarkdown: nextDraft,
        attachments: selectedAttachments,
      });
      setDraft('');
      setSelectedAttachments([]);
      void sendTyping(conversationId, false);
    } catch (error) {
      Alert.alert('Chat', error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderAttachmentPreview = (attachment: MessagingAttachment, index: number) => (
    <View key={`${attachment.url}-${index}`} style={[styles.attachmentPreview, { borderColor: theme.icon }]}>
      <View style={styles.attachmentPreviewInfo}>
        <MaterialIcons
          name={attachment.mimeType.startsWith('image/') ? 'image' : attachment.mimeType.startsWith('audio/') ? 'audiotrack' : attachment.mimeType.startsWith('video/') ? 'movie' : 'attach-file'}
          size={18}
          color={theme.tint}
        />
        <ThemedText numberOfLines={1} style={styles.attachmentPreviewName}>
          {attachment.fileName}
        </ThemedText>
      </View>
      <Pressable onPress={() => setSelectedAttachments((prev) => prev.filter((_, current) => current !== index))}>
        <MaterialIcons name="close" size={18} color="#ef4444" />
      </Pressable>
    </View>
  );

  const renderMessage = ({ item }: { item: MessagingMessage }) => {
    const isOwn = item.sender?._id === user?._id;

    return (
      <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isOwn ? '#2563EB' : theme.background,
              borderColor: isOwn ? '#2563EB' : theme.icon,
            },
          ]}>
          {!isOwn ? (
            <ThemedText type="defaultSemiBold" style={styles.senderName}>
              {item.sender?.name || 'User'}
            </ThemedText>
          ) : null}

          {item.bodyMarkdown || item.bodyPlain ? (
            <MessageMarkdown
              text={item.bodyMarkdown || item.bodyPlain}
              color={isOwn ? '#fff' : theme.text}
            />
          ) : null}

          {item.attachments?.length ? (
            <View style={styles.messageAttachments}>
              {item.attachments.map((attachment, index) => (
                <Pressable
                  key={`${attachment.url}-${index}`}
                  style={[styles.attachmentCard, { borderColor: isOwn ? 'rgba(255,255,255,0.25)' : theme.icon }]}
                  onPress={() => void Linking.openURL(attachment.url)}>
                  {attachment.mimeType.startsWith('image/') ? (
                    <Image source={{ uri: attachment.url }} style={styles.attachmentImage} />
                  ) : (
                    <View style={styles.attachmentFileRow}>
                      <MaterialIcons
                        name={attachment.mimeType.startsWith('audio/') ? 'audiotrack' : attachment.mimeType.startsWith('video/') ? 'movie' : 'description'}
                        size={18}
                        color={isOwn ? '#fff' : theme.tint}
                      />
                      <View style={styles.attachmentMeta}>
                        <ThemedText numberOfLines={1} style={{ color: isOwn ? '#fff' : theme.text }}>
                          {attachment.fileName}
                        </ThemedText>
                        <ThemedText style={[styles.attachmentHint, { color: isOwn ? 'rgba(255,255,255,0.75)' : theme.icon }]}>
                          Tap to open
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          ) : null}

          <ThemedText style={[styles.messageMeta, { color: isOwn ? 'rgba(255,255,255,0.75)' : theme.icon }]}>
            {item.localStatus === 'sending' ? 'Sending...' : new Date(item.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>
      </View>
    );
  };

  if (!conversationId) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Conversation not found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.messageList
          ]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            loadingMessages[conversationId] ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="small" color={theme.tint} />
              </View>
            ) : null
          }
          ListFooterComponent={
            typingUsers.length ? (
              <ThemedText style={styles.typingText}>
                {typingUsers.map((entry) => entry.name).join(', ')} typing...
              </ThemedText>
            ) : null
          }
        />

        {selectedAttachments.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachmentPreviewList}>
            {selectedAttachments.map(renderAttachmentPreview)}
          </ScrollView>
        ) : null}

        <View style={[styles.toolbar, { borderColor: theme.icon }]}>
          <Pressable onPress={() => appendMarkdownToken('**bold**')} style={styles.toolbarChip}>
            <ThemedText style={styles.toolbarChipText}>B</ThemedText>
          </Pressable>
          <Pressable onPress={() => appendMarkdownToken('_italic_')} style={styles.toolbarChip}>
            <ThemedText style={styles.toolbarChipText}>I</ThemedText>
          </Pressable>
          <Pressable onPress={() => appendMarkdownToken('`code`')} style={styles.toolbarChip}>
            <ThemedText style={styles.toolbarChipText}>Code</ThemedText>
          </Pressable>
          <Pressable onPress={() => void pickMedia()} style={styles.toolbarChip}>
            <ThemedText style={styles.toolbarChipText}>Media</ThemedText>
          </Pressable>
          <Pressable onPress={() => void pickDocument('audio/*')} style={styles.toolbarChip}>
            <ThemedText style={styles.toolbarChipText}>Audio</ThemedText>
          </Pressable>
          <Pressable onPress={() => void pickDocument('*/*')} style={styles.toolbarChip}>
            <ThemedText style={styles.toolbarChipText}>File</ThemedText>
          </Pressable>
        </View>

        {canPost ? (
          <View
            style={[
              styles.composer,
              { borderColor: theme.icon, backgroundColor: theme.background },
              {
                position: 'absolute',
                left: 0,
                right: 0,
                zIndex: 20,
                elevation: 20,
                margin: 0,
                paddingBottom: insets.bottom,
              },
            ]}>
            <TextInput
              value={draft}
              onChangeText={handleDraftChange}
              placeholder="Write a message"
              placeholderTextColor={theme.icon}
              multiline
              onFocus={() => flatListRef.current?.scrollToEnd({ animated: true })}
              style={[styles.input, { color: theme.text }]}
            />
            <Pressable
              disabled={sending || uploading}
              onPress={() => void handleSend()}
              style={[styles.sendButton, (sending || uploading) && styles.disabledButton]}>
              {sending || uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="send" size={20} color="#fff" />
              )}
            </Pressable>
          </View>
        ) : (
          <View style={[styles.readOnlyBanner, { borderColor: theme.icon }]}>
            <ThemedText style={styles.readOnlyText}>
              Only admins and teachers can send messages in this broadcast channel.
            </ThemedText>
          </View>
        )}
    </ThemedView>
  );
}

type AttachmentSource = {
  uri: string;
  name?: string;
  mimeType?: string;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderWrap: {
    paddingVertical: 12,
  },
  messageList: {
    padding: 12,
    gap: 10,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  senderName: {
    fontSize: 12,
  },
  messageAttachments: {
    gap: 8,
  },
  attachmentCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  attachmentImage: {
    width: 220,
    height: 160,
    backgroundColor: '#e5e7eb',
  },
  attachmentFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
  },
  attachmentMeta: {
    flex: 1,
  },
  attachmentHint: {
    fontSize: 11,
  },
  messageMeta: {
    fontSize: 11,
    textAlign: 'right',
  },
  typingText: {
    fontSize: 12,
    opacity: 0.7,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  attachmentPreviewList: {
    paddingHorizontal: 12,
    gap: 8,
    paddingBottom: 8,
  },
  attachmentPreview: {
    minWidth: 180,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  attachmentPreviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  attachmentPreviewName: {
    flex: 1,
    fontSize: 12,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: 1,
  },
  toolbarChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(37,99,235,0.12)',
  },
  toolbarChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    padding: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  disabledButton: {
    opacity: 0.6,
  },
  readOnlyBanner: {
    borderTopWidth: 1,
    padding: 12,
  },
  readOnlyText: {
    fontSize: 12,
    opacity: 0.75,
  },
});
