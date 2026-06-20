// import { useEffect, useMemo, useRef, useState } from 'react';
// import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

// import { apiService } from '@/api/client';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Colors } from '@/constants/theme';
// import { useColorScheme } from '@/hooks/use-color-scheme';
// import { useAuthStore } from '@/src/store/auth.store';

// export default function CreateAlertTab() {
//   const colorScheme = useColorScheme();
//   const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

//   const user = useAuthStore((state) => state.user);
//   const role = typeof user?.role === 'string' ? user.role : user?.role?.role;

//   const [userId, setUserId] = useState('');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
//   const [searchingUsers, setSearchingUsers] = useState(false);
//   const [title, setTitle] = useState('');
//   const [message, setMessage] = useState('');
//   const [submitting, setSubmitting] = useState(false);
//   const cacheRef = useRef<Record<string, UserSuggestion[]>>({});

//   const isAdmin = useMemo(() => role === 'admin', [role]);

//   useEffect(() => {
//     const query = searchQuery.trim();
//     if (query.length < 3) {
//       setSuggestions([]);
//       setSearchingUsers(false);
//       return;
//     }

//     const cacheKey = query.toLowerCase();
//     if (cacheRef.current[cacheKey]) {
//       setSuggestions(cacheRef.current[cacheKey]);
//       return;
//     }

//     setSearchingUsers(true);
//     const timeout = setTimeout(async () => {
//       try {
//         const response = await apiService.searchSchoolUsers({
//           q: query,
//           limit: 6,
//         });

//         if (!response.success || !response.data) {
//           throw new Error(response.msg || 'Failed to search users.');
//         }

//         cacheRef.current[cacheKey] = response.data;
//         setSuggestions(response.data);
//       } catch (error) {
//         setSuggestions([]);
//         Alert.alert('Search', error instanceof Error ? error.message : 'Failed to search users.');
//       } finally {
//         setSearchingUsers(false);
//       }
//     }, 350);

//     return () => {
//       clearTimeout(timeout);
//       setSearchingUsers(false);
//     };
//   }, [searchQuery]);

//   const selectUser = (entry: UserSuggestion) => {
//     setUserId(entry._id);
//     setSearchQuery(entry.phone ? `${entry.name} • ${entry.phone}` : entry.name);
//     setSuggestions([]);
//   };

//   const clearSelectedUser = () => {
//     setUserId('');
//     setSearchQuery('');
//     setSuggestions([]);
//   };

//   const submit = async () => {
//     if (!message.trim()) {
//       Alert.alert('Validation', 'Message is required.');
//       return;
//     }

//     try {
//       setSubmitting(true);
//       const response = await apiService.createAlert({
//         userId: userId.trim() || undefined,
//         title: title.trim() || undefined,
//         message: message.trim(),
//       });

//       if (!response.success) {
//         throw new Error(response.msg || 'Failed to create alert.');
//       }

//       setUserId('');
//       setSearchQuery('');
//       setSuggestions([]);
//       setTitle('');
//       setMessage('');
//       Alert.alert('Success', 'Alert created successfully.');
//     } catch (error) {
//       Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create alert.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (!isAdmin) {
//     return (
//       <ThemedView style={styles.centered}>
//         <ThemedText>Access denied. Admin role is required.</ThemedText>
//       </ThemedView>
//     );
//   }

//   return (
//     <ScrollView style={styles.container} contentContainerStyle={styles.content}>
//       <ThemedView style={[styles.card, { borderColor: theme.icon, backgroundColor: theme.background }]}>
//         <ThemedText type="subtitle">Create Alert</ThemedText>
//         <ThemedText style={styles.hint}>
//           Search users by name, username or phone. Search starts only after 3 characters and waits for typing to pause.
//         </ThemedText>

//         <View style={styles.searchBlock}>
//           <TextInput
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             editable={!submitting}
//             style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
//             placeholder="Search user by name, username or phone"
//             placeholderTextColor={theme.icon}
//           />

//           {userId ? (
//             <Pressable onPress={clearSelectedUser} style={styles.clearSelection}>
//               <ThemedText style={styles.clearSelectionText}>Clear selected user</ThemedText>
//             </Pressable>
//           ) : null}

//           {searchingUsers ? (
//             <View style={styles.loaderRow}>
//               <ActivityIndicator size="small" color={theme.tint} />
//             </View>
//           ) : null}

//           {!searchingUsers && suggestions.length ? (
//             <View style={[styles.suggestionList, { borderColor: theme.icon, backgroundColor: theme.background }]}>
//               {suggestions.map((entry) => (
//                 <Pressable key={entry._id} onPress={() => selectUser(entry)} style={styles.suggestionItem}>
//                   <View style={styles.suggestionMeta}>
//                     <ThemedText type="defaultSemiBold">{entry.name}</ThemedText>
//                     <ThemedText style={styles.suggestionSubtext}>
//                       {[entry.username, entry.phone, entry.role].filter(Boolean).join(' • ')}
//                     </ThemedText>
//                   </View>
//                 </Pressable>
//               ))}
//             </View>
//           ) : null}

//           {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 ? (
//             <ThemedText style={styles.metaHint}>Type at least 3 characters to search.</ThemedText>
//           ) : null}

//           {userId ? (
//             <ThemedText style={styles.metaHint}>Selected user ID: {userId}</ThemedText>
//           ) : (
//             <ThemedText style={styles.metaHint}>No user selected. Alert will use backend default behavior.</ThemedText>
//           )}
//         </View>

//         <TextInput
//           value={title}
//           onChangeText={setTitle}
//           editable={!submitting}
//           style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
//           placeholder="Title (optional)"
//           placeholderTextColor={theme.icon}
//         />

//         <TextInput
//           value={message}
//           onChangeText={setMessage}
//           editable={!submitting}
//           multiline
//           style={[styles.input, styles.textArea, { borderColor: theme.icon, color: theme.text }]}
//           placeholder="Alert message"
//           placeholderTextColor={theme.icon}
//         />

//         <Pressable style={[styles.submit, submitting && styles.disabled]} disabled={submitting} onPress={submit}>
//           {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.submitText}>Send Alert</ThemedText>}
//         </Pressable>
//       </ThemedView>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   content: { padding: 16, paddingBottom: 40 },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
//   card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
//   hint: { opacity: 0.7, fontSize: 12 },
//   searchBlock: { gap: 8 },
//   input: {
//     borderWidth: 1,
//     borderRadius: 8,
//     minHeight: 42,
//     paddingHorizontal: 10,
//     paddingVertical: 10,
//   },
//   suggestionList: {
//     borderWidth: 1,
//     borderRadius: 10,
//     overflow: 'hidden',
//   },
//   suggestionItem: {
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     borderBottomWidth: StyleSheet.hairlineWidth,
//     borderBottomColor: '#d4d4d8',
//   },
//   suggestionMeta: { gap: 4 },
//   suggestionSubtext: { fontSize: 12, opacity: 0.7 },
//   loaderRow: { paddingVertical: 8, alignItems: 'center' },
//   clearSelection: { alignSelf: 'flex-start' },
//   clearSelectionText: { color: '#2563EB', fontWeight: '600' },
//   metaHint: { fontSize: 12, opacity: 0.7 },
//   textArea: { minHeight: 110, textAlignVertical: 'top' },
//   submit: {
//     marginTop: 8,
//     height: 42,
//     borderRadius: 8,
//     backgroundColor: '#2563EB',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   submitText: { color: '#fff', fontWeight: '700' },
//   disabled: { opacity: 0.65 },
// });

// type UserSuggestion = {
//   _id: string;
//   name: string;
//   username?: string;
//   email?: string;
//   phone?: string;
//   image?: string;
//   role?: string;
// };

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { apiService } from '@/api/client';
import { useAuthStore } from '@/src/store/auth.store';

// --- ERP BRANDING PALETTE ---
const PALETTE = {
  primary: '#303841',
  accent: '#76ABAE',
  cta: '#FF5722',
  background: '#F5F5F5',
  border: '#E6E6E6',
  surface: '#FFFFFF',
  textBody: '#5D646B',
  textHeading: '#303841',
  success: '#2E7D32',
  error: '#D32F2F',
  warning: '#F9A825',
};

type UserSuggestion = {
  _id: string;
  name: string;
  username?: string;
  email?: string;
  phone?: string;
  image?: string;
  role?: string;
};

export default function CreateAlertTab() {
  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;

  const [userId, setUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const cacheRef = useRef<Record<string, UserSuggestion[]>>({});

  const isAdmin = useMemo(() => role === 'admin', [role]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setSearchingUsers(false);
      return;
    }

    const cacheKey = query.toLowerCase();
    if (cacheRef.current[cacheKey]) {
      setSuggestions(cacheRef.current[cacheKey]);
      return;
    }

    setSearchingUsers(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await apiService.searchSchoolUsers({
          q: query,
          limit: 6,
        });

        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to search users.');
        }

        cacheRef.current[cacheKey] = response.data;
        setSuggestions(response.data);
      } catch (error) {
        setSuggestions([]);
        Alert.alert('Search Error', error instanceof Error ? error.message : 'Failed to search users.');
      } finally {
        setSearchingUsers(false);
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      setSearchingUsers(false);
    };
  }, [searchQuery]);

  const selectUser = (entry: UserSuggestion) => {
    setUserId(entry._id);
    setSearchQuery(entry.phone ? `${entry.name} • ${entry.phone}` : entry.name);
    setSuggestions([]);
  };

  const clearSelectedUser = () => {
    setUserId('');
    setSearchQuery('');
    setSuggestions([]);
  };

  const submit = async () => {
    if (!message.trim()) {
      Alert.alert('Validation Error', 'Message is required.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.createAlert({
        userId: userId.trim() || undefined,
        title: title.trim() || undefined,
        message: message.trim(),
      });

      if (!response.success) {
        throw new Error(response.msg || 'Failed to create alert.');
      }

      setUserId('');
      setSearchQuery('');
      setSuggestions([]);
      setTitle('');
      setMessage('');
      Alert.alert('Success', 'Alert created successfully.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create alert.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.accessDeniedText}>Access denied. Admin role is required.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create Alert</Text>
        <Text style={styles.hint}>
          Search users by name, username or phone. Search starts automatically after typing 3 characters.
        </Text>

        <View style={styles.searchBlock}>
          <Text style={styles.inputLabel}>Recipient</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            editable={!submitting}
            style={styles.input}
            placeholder="Search user..."
            placeholderTextColor={PALETTE.textBody}
          />

          {userId ? (
            <Pressable onPress={clearSelectedUser} style={({ pressed }) => [styles.clearSelection, pressed && styles.pressed]}>
              <Text style={styles.clearSelectionText}>Clear selected user</Text>
            </Pressable>
          ) : null}

          {searchingUsers ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color={PALETTE.accent} />
            </View>
          ) : null}

          {!searchingUsers && suggestions.length ? (
            <View style={styles.suggestionList}>
              {suggestions.map((entry) => (
                <Pressable 
                  key={entry._id} 
                  onPress={() => selectUser(entry)} 
                  style={({ pressed }) => [styles.suggestionItem, pressed && styles.pressedBg]}>
                  <View style={styles.suggestionMeta}>
                    <Text style={styles.suggestionName}>{entry.name}</Text>
                    <Text style={styles.suggestionSubtext}>
                      {[entry.username, entry.phone, entry.role].filter(Boolean).join(' • ')}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 ? (
            <Text style={styles.metaHint}>Type at least 3 characters to search.</Text>
          ) : null}

          {userId ? (
            <Text style={styles.metaHint}>Selected user ID: {userId}</Text>
          ) : (
            <Text style={styles.metaHint}>No user selected. Alert will be sent globally (default behavior).</Text>
          )}
        </View>

        <View style={styles.fieldGap}>
          <Text style={styles.inputLabel}>Alert Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            editable={!submitting}
            style={styles.input}
            placeholder="e.g. Weather Update (Optional)"
            placeholderTextColor={PALETTE.textBody}
          />
        </View>

        <View style={styles.fieldGap}>
          <Text style={styles.inputLabel}>Message</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            editable={!submitting}
            multiline
            style={[styles.input, styles.textArea]}
            placeholder="Write the alert message..."
            placeholderTextColor={PALETTE.textBody}
          />
        </View>

        <Pressable 
          style={({ pressed }) => [styles.submit, (submitting || pressed) && styles.disabled]} 
          disabled={submitting} 
          onPress={submit}>
          {submitting ? <ActivityIndicator color={PALETTE.surface} /> : <Text style={styles.submitText}>Send Alert</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  content: { 
    padding: 16, 
    paddingBottom: 40 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24,
    backgroundColor: PALETTE.background,
  },
  accessDeniedText: {
    color: PALETTE.error,
    fontWeight: '600',
    fontSize: 16,
  },
  card: { 
    borderWidth: 1, 
    borderRadius: 4, 
    padding: 16, 
    gap: 16,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textHeading,
    marginBottom: -4,
  },
  hint: { 
    color: PALETTE.textBody, 
    fontSize: 13,
    lineHeight: 18,
  },
  searchBlock: { 
    gap: 6 
  },
  fieldGap: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textHeading,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderColor: PALETTE.border,
    color: PALETTE.textHeading,
    backgroundColor: PALETTE.background,
    fontSize: 14,
  },
  textArea: { 
    minHeight: 110, 
    textAlignVertical: 'top' 
  },
  suggestionList: {
    borderWidth: 1,
    borderRadius: 4,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
    overflow: 'hidden',
    marginTop: 4,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  pressedBg: {
    backgroundColor: PALETTE.background,
  },
  suggestionMeta: { 
    gap: 4 
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textHeading,
  },
  suggestionSubtext: { 
    fontSize: 12, 
    color: PALETTE.textBody,
  },
  loaderRow: { 
    paddingVertical: 8, 
    alignItems: 'center' 
  },
  clearSelection: { 
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  clearSelectionText: { 
    color: PALETTE.error, 
    fontWeight: '600',
    fontSize: 13,
  },
  metaHint: { 
    fontSize: 12, 
    color: PALETTE.textBody,
    marginTop: 2,
  },
  submit: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 4,
    backgroundColor: PALETTE.cta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { 
    color: PALETTE.surface, 
    fontWeight: '700',
    fontSize: 14,
  },
  disabled: { 
    opacity: 0.7 
  },
  pressed: {
    opacity: 0.7,
  }
});