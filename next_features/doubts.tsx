import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useChatStore } from '@/src/store/chat.store';
import type { MessagingConversation } from '@/src/types';

export default function ChatHomeTab() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const conversations = useChatStore((state) => state.conversations);
  const loadingConversations = useChatStore((state) => state.loadingConversations);
  const isSocketConnected = useChatStore((state) => state.isSocketConnected);
  const loadConversations = useChatStore((state) => state.loadConversations);

  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      void loadConversations();
    }, [loadConversations]),
  );

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    const next = !query
      ? conversations
      : conversations.filter((entry) =>
          [entry.title, entry.description, entry.lastMessage?.bodyPlain]
            .some((value) => String(value || '').toLowerCase().includes(query)),
        );

    return [...next].sort((a, b) => {
      if (a.type === 'school_broadcast' && b.type !== 'school_broadcast') return -1;
      if (b.type === 'school_broadcast' && a.type !== 'school_broadcast') return 1;
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [conversations, search]);

  const openConversation = (conversation: MessagingConversation) => {
    router.push(`/chat/${conversation._id}` as never);
  };

  const renderConversation = ({ item }: { item: MessagingConversation }) => (
    <Pressable
      onPress={() => openConversation(item)}
      style={[styles.conversationCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: item.type === 'school_broadcast' ? '#F59E0B' : '#2563EB' }]}>
          <ThemedText style={styles.avatarText}>
            {item.type === 'school_broadcast' ? 'SC' : item.title?.charAt(0)?.toUpperCase() || 'C'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.conversationBody}>
        <View style={styles.rowBetween}>
          <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.conversationTitle}>
            {item.title}
          </ThemedText>
          <ThemedText style={styles.timeText}>
            {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ''}
          </ThemedText>
        </View>

        <ThemedText numberOfLines={1} style={styles.previewText}>
          {item.lastMessage?.bodyPlain || item.description || 'No messages yet'}
        </ThemedText>

        <View style={styles.metaRow}>
          <View style={[styles.typeBadge, { backgroundColor: item.type === 'school_broadcast' ? '#FEF3C7' : '#DBEAFE' }]}>
            <ThemedText style={[styles.typeBadgeText, { color: item.type === 'school_broadcast' ? '#92400E' : '#1D4ED8' }]}>
              {item.type === 'school_broadcast' ? 'Broadcast' : item.type === 'private_group' ? 'Group' : 'Direct'}
            </ThemedText>
          </View>

          {item.unreadCount ? (
            <View style={styles.unreadBadge}>
              <ThemedText style={styles.unreadBadgeText}>{item.unreadCount}</ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topActions}>
        <Pressable onPress={() => router.push('/chat/contacts' as never)} style={styles.actionButton}>
          <MaterialIcons name="person-add-alt-1" size={18} color="#fff" />
          <ThemedText style={styles.actionButtonText}>Direct</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.push('/chat/new-group' as never)} style={[styles.actionButton, styles.actionButtonAlt]}>
          <MaterialIcons name="groups" size={18} color="#fff" />
          <ThemedText style={styles.actionButtonText}>Group</ThemedText>
        </Pressable>
      </View>

      <View style={[styles.searchBar, { borderColor: theme.icon, backgroundColor: theme.background }]}>
        <MaterialIcons name="search" size={20} color={theme.icon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search chats"
          placeholderTextColor={theme.icon}
          style={[styles.searchInput, { color: theme.text }]}
        />
        <View style={[styles.connectionDot, { backgroundColor: isSocketConnected ? '#16A34A' : '#F59E0B' }]} />
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item._id}
        renderItem={renderConversation}
        refreshControl={<RefreshControl refreshing={loadingConversations} onRefresh={() => void loadConversations()} />}
        ListEmptyComponent={
          loadingConversations ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="small" color={theme.tint} />
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>No chats yet. Start a direct chat or create a group.</ThemedText>
          )
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    gap: 12,
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonAlt: {
    backgroundColor: '#0F766E',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    minHeight: 46,
    fontSize: 14,
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  conversationCard: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  avatarWrap: {
    justifyContent: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  conversationBody: {
    flex: 1,
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  conversationTitle: {
    flex: 1,
  },
  timeText: {
    fontSize: 11,
    opacity: 0.65,
  },
  previewText: {
    fontSize: 13,
    opacity: 0.75,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  unreadBadge: {
    minWidth: 24,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  loaderWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
});
