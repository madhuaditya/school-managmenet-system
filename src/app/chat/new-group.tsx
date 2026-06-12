import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
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

export default function NewGroupScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const contacts = useChatStore((state) => state.contacts);
  const loadingContacts = useChatStore((state) => state.loadingContacts);
  const loadContacts = useChatStore((state) => state.loadContacts);
  const createPrivateGroup = useChatStore((state) => state.createPrivateGroup);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadContacts();
    }, [loadContacts]),
  );

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((entry) =>
      [entry.name, entry.email, entry.username, entry.role].some((value) =>
        String(value || '').toLowerCase().includes(query),
      ),
    );
  }, [contacts, search]);

  const toggleMember = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((entry) => entry !== userId) : [...prev, userId],
    );
  };

  const handleCreateGroup = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      Alert.alert('Validation', 'Group name is required.');
      return;
    }
    if (!selectedIds.length) {
      Alert.alert('Validation', 'Select at least one member.');
      return;
    }

    try {
      setSubmitting(true);
      const conversation = await createPrivateGroup({
        name: cleanName,
        description: description.trim(),
        memberIds: selectedIds,
      });
      router.replace(`/chat/${conversation._id}` as never);
    } catch (error) {
      Alert.alert('Chat', error instanceof Error ? error.message : 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.card, { borderColor: theme.icon, backgroundColor: theme.background }]}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Group name"
          placeholderTextColor={theme.icon}
          style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
        />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
          placeholderTextColor={theme.icon}
          style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
        />
      </View>

      <View style={[styles.searchBar, { borderColor: theme.icon, backgroundColor: theme.background }]}>
        <MaterialIcons name="search" size={20} color={theme.icon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search members"
          placeholderTextColor={theme.icon}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          loadingContacts ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={theme.tint} />
            </View>
          ) : (
            <ThemedText style={styles.emptyText}>No users found.</ThemedText>
          )
        }
        renderItem={({ item }) => {
          const selected = selectedIds.includes(item._id);
          return (
            <Pressable
              onPress={() => toggleMember(item._id)}
              style={[styles.memberCard, { borderColor: selected ? '#2563EB' : theme.icon, backgroundColor: theme.background }]}>
              <View style={styles.memberInfo}>
                <View style={[styles.avatar, { backgroundColor: selected ? '#2563EB' : '#14B8A6' }]}>
                  <ThemedText style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || 'U'}</ThemedText>
                </View>
                <View style={styles.memberText}>
                  <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                  <ThemedText style={styles.memberMeta}>
                    {(item.role || '').toUpperCase()} {item.username ? `• ${item.username}` : ''}
                  </ThemedText>
                </View>
              </View>
              <MaterialIcons
                name={selected ? 'check-circle' : 'radio-button-unchecked'}
                size={22}
                color={selected ? '#2563EB' : theme.icon}
              />
            </Pressable>
          );
        }}
      />

      <Pressable
        disabled={submitting}
        onPress={() => void handleCreateGroup()}
        style={[styles.createButton, submitting && styles.disabledButton]}>
        {submitting ? <ActivityIndicator size="small" color="#fff" /> : <ThemedText style={styles.createButtonText}>Create Group</ThemedText>}
      </Pressable>
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
    paddingVertical: 24,
    alignItems: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 46,
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
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  memberText: {
    flex: 1,
  },
  memberMeta: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  createButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.65,
  },
});
