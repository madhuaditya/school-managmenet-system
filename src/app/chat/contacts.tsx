import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
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
import { router, useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useChatStore } from '@/src/store/chat.store';
import { apiService } from '@/api/client';
import { debounce } from '@/src/utils/helpers';

export default function ChatContactsScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const contacts = useChatStore((state) => state.contacts);
  const loadingContacts = useChatStore((state) => state.loadingContacts);
  const loadContacts = useChatStore((state) => state.loadContacts);
  const createDirectConversation = useChatStore((state) => state.createDirectConversation);

  const [search, setSearch] = useState('');
  const [remoteResults, setRemoteResults] = useState<typeof contacts | null>(null);
  const [searching, setSearching] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const performSearch = useRef(
    debounce(async (q: string) => {
      if (!mountedRef.current) return;
      try {
        setSearching(true);
        const response = await apiService.searchMessagingUsers({ q, limit: 6 });
        if (response?.success && response.data) {
          setRemoteResults(response.data);
        } else {
          setRemoteResults([]);
        }
      } catch (error) {
        setRemoteResults([]);
      } finally {
        if (mountedRef.current) setSearching(false);
      }
    }, 350),
  ).current;

  useEffect(() => {
    const q = String(search || '').trim();
    if (!q) {
      setRemoteResults(null);
      setSearching(false);
      return;
    }

    if (q.length < 3) {
      // Do not call backend for very short queries
      setRemoteResults(null);
      setSearching(false);
      return;
    }

    performSearch(q);
  }, [search, performSearch]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadContacts();
    }, [loadContacts]),
  );

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((entry) =>
      [entry.name, entry.email, entry.username, entry.role, entry.phone].some((value) =>
        String(value || '').toLowerCase().includes(query),
      ),
    );
  }, [contacts, search]);

  const openDirectConversation = async (userId: string) => {
    try {
      setBusyId(userId);
      const conversation = await createDirectConversation(userId);
      router.replace(`/chat/${conversation._id}` as never);
    } catch (error) {
      Alert.alert('Chat', error instanceof Error ? error.message : 'Failed to create direct conversation');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchBar, { borderColor: theme.icon, backgroundColor: theme.background }]}>
        <MaterialIcons name="search" size={20} color={theme.icon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search users"
          placeholderTextColor={theme.icon}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <FlatList
        data={remoteResults != null ? remoteResults : filteredContacts}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loadingContacts} onRefresh={() => void loadContacts()} />}
        ListEmptyComponent={
          loadingContacts || searching ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={theme.tint} />
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>No contacts found.</ThemedText>
          )
        }
        renderItem={({ item }) => {
          const isBusy = busyId === item._id;
          return (
            <Pressable
              onPress={() => void openDirectConversation(item._id)}
              style={[styles.contactCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
              <View style={[styles.avatar, { backgroundColor: '#2563EB' }]}>
                <ThemedText style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || 'U'}</ThemedText>
              </View>
              <View style={styles.contactInfo}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={styles.contactMeta}>
                  {(item.role || '').toUpperCase()} {item.username ? `• ${item.username}` : ''}
                </ThemedText>
                {item.email ? <ThemedText style={styles.contactMeta}>{item.email}</ThemedText> : null}
              </View>
              {isBusy ? (
                <ActivityIndicator size="small" color={theme.tint} />
              ) : (
                <MaterialIcons name="chat" size={20} color={theme.tint} />
              )}
            </Pressable>
          );
        }}
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
  centered: {
    paddingVertical: 30,
    alignItems: 'center',
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
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  contactInfo: {
    flex: 1,
  },
  contactMeta: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 20,
  },
});
