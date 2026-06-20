// import { useEffect, useMemo, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   Platform,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   TextInput,
//   View,
// } from 'react-native';
// import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// import { apiService } from '@/api/client';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Colors } from '@/constants/theme';
// import { useColorScheme } from '@/hooks/use-color-scheme';

// interface NoticeItem {
//   _id: string;
//   title: string;
//   details: string;
//   date: string;
//   validity: string;
// }

// export default function NoticeTab() {
//   const colorScheme = useColorScheme();
//   const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [title, setTitle] = useState('');
//   const [details, setDetails] = useState('');
//   const [validity, setValidity] = useState('');
//   const [showValidityPicker, setShowValidityPicker] = useState(false);
//   const [notices, setNotices] = useState<NoticeItem[]>([]);

//   const isEditing = useMemo(() => !!editingId, [editingId]);

//   useEffect(() => {
//     void loadNotices();
//   }, []);

//   const loadNotices = async () => {
//     try {
//       setLoading(true);
//       const response = await apiService.getValidNotices();
//       if (!response.success) {
//         throw new Error(response.msg || 'Failed to fetch notices');
//       }
//       setNotices(Array.isArray(response.data) ? (response.data as unknown as NoticeItem[]) : []);
//     } catch (err) {
//       Alert.alert('Error', err instanceof Error ? err.message : 'Failed to fetch notices');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setEditingId(null);
//     setTitle('');
//     setDetails('');
//     setValidity('');
//     setShowValidityPicker(false);
//   };

//   const formatDate = (date: Date) => date.toISOString().split('T')[0];

//   const parseDate = (value: string) => {
//     const parsed = value ? new Date(value) : new Date();
//     return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
//   };

//   const onValidityDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
//     if (Platform.OS === 'android') {
//       setShowValidityPicker(false);
//     }

//     if (event.type === 'dismissed' || !selectedDate) return;
//     setValidity(formatDate(selectedDate));
//   };

//   const onSubmit = async () => {
//     if (!title.trim() || !details.trim() || !validity.trim()) {
//       Alert.alert('Validation', 'Title, details and validity date are required');
//       return;
//     }

//     try {
//       setSaving(true);

//       if (isEditing && editingId) {
//         const response = await apiService.updateNotice(editingId, {
//           title: title.trim(),
//           details: details.trim(),
//           validity,
//         });
//         if (!response.success) throw new Error(response.msg || 'Failed to update notice');
//         Alert.alert('Success', 'Notice updated successfully');
//       } else {
//         const response = await apiService.createNotice({
//           title: title.trim(),
//           details: details.trim(),
//           validity,
//         });
//         if (!response.success) throw new Error(response.msg || 'Failed to create notice');
//         Alert.alert('Success', 'Notice created successfully');
//       }

//       resetForm();
//       await loadNotices();
//     } catch (err) {
//       Alert.alert('Error', err instanceof Error ? err.message : 'Operation failed');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const onDelete = async (id: string) => {
//     try {
//       setSaving(true);
//       const response = await apiService.deleteNotice(id);
//       if (!response.success) throw new Error(response.msg || 'Failed to delete notice');
//       Alert.alert('Success', 'Notice deleted successfully');
//       await loadNotices();
//     } catch (err) {
//       Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete notice');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const onEdit = (item: NoticeItem) => {
//     setEditingId(item._id);
//     setTitle(item.title || '');
//     setDetails(item.details || '');
//     setValidity(item.validity ? new Date(item.validity).toISOString().substring(0, 10) : '');
//   };

//   return (
//     <ScrollView style={styles.container} contentContainerStyle={styles.content}>
//       <ThemedView style={[styles.formCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
//         <ThemedText type="defaultSemiBold">{isEditing ? 'Update Notice' : 'Add Notice'}</ThemedText>
//         <TextInput
//           style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
//           placeholder="Title"
//           placeholderTextColor={theme.icon}
//           value={title}
//           onChangeText={setTitle}
//           editable={!saving}
//         />
//         <TextInput
//           style={[styles.input, styles.textArea, { borderColor: theme.icon, color: theme.text }]}
//           placeholder="Details"
//           placeholderTextColor={theme.icon}
//           value={details}
//           onChangeText={setDetails}
//           editable={!saving}
//           multiline
//         />

//         <ThemedText style={styles.fieldLabel}>Validity Date</ThemedText>
//         <Pressable
//           style={[styles.dateInputButton, { borderColor: theme.icon }]}
//           onPress={() => setShowValidityPicker(true)}
//           disabled={saving}
//         >
//           <ThemedText style={[styles.dateInputText, { color: validity ? theme.text : theme.icon }]}>
//             {validity || 'Select validity date'}
//           </ThemedText>
//         </Pressable>
//         {showValidityPicker ? (
//           <DateTimePicker
//             value={parseDate(validity)}
//             mode="date"
//             display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//             minimumDate={new Date()}
//             onChange={onValidityDateChange}
//           />
//         ) : null}

//         <View style={styles.row}>
//           <Pressable style={[styles.primaryBtn, saving && styles.disabled]} onPress={onSubmit} disabled={saving}>
//             {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.btnText}>{isEditing ? 'Update' : 'Create'}</ThemedText>}
//           </Pressable>
//           {isEditing ? (
//             <Pressable style={styles.secondaryBtn} onPress={resetForm} disabled={saving}>
//               <ThemedText style={styles.secondaryText}>Cancel</ThemedText>
//             </Pressable>
//           ) : null}
//         </View>
//       </ThemedView>

//       <ThemedText type="subtitle" style={{ marginTop: 8 }}>Valid Notices (Latest to Old)</ThemedText>

//       {loading ? (
//         <ThemedView style={styles.centered}><ActivityIndicator size="large" color={theme.tint} /></ThemedView>
//       ) : notices.length === 0 ? (
//         <ThemedText style={styles.mutedText}>No valid notices found</ThemedText>
//       ) : (
//         notices.map((item) => (
//           <ThemedView
//             key={item._id}
//             style={[styles.noticeCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
//             <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
//             <ThemedText style={styles.noticeDetails}>{item.details}</ThemedText>
//             <ThemedText style={styles.noticeMeta}>
//               Date: {new Date(item.date).toLocaleDateString()} | Valid till: {new Date(item.validity).toLocaleDateString()}
//             </ThemedText>

//             <View style={styles.row}>
//               <Pressable style={styles.editBtn} onPress={() => onEdit(item)} disabled={saving}>
//                 <ThemedText style={styles.btnText}>Edit</ThemedText>
//               </Pressable>
//               <Pressable style={styles.deleteBtn} onPress={() => onDelete(item._id)} disabled={saving}>
//                 <ThemedText style={styles.btnText}>Delete</ThemedText>
//               </Pressable>
//             </View>
//           </ThemedView>
//         ))
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   content: { padding: 16, gap: 12, paddingBottom: 40 },
//   formCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
//   input: {
//     borderWidth: 1,
//     borderRadius: 8,
//     minHeight: 42,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     fontSize: 14,
//   },
//   textArea: {
//     minHeight: 90,
//     textAlignVertical: 'top',
//   },
//   fieldLabel: {
//     fontSize: 13,
//     fontWeight: '600',
//     marginBottom: -2,
//     opacity: 0.8,
//   },
//   dateInputButton: {
//     borderWidth: 1,
//     borderRadius: 8,
//     minHeight: 42,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     justifyContent: 'center',
//     backgroundColor: '#f5f5f5',
//   },
//   dateInputText: {
//     fontSize: 14,
//   },
//   row: { flexDirection: 'row', gap: 8, marginTop: 4 },
//   primaryBtn: {
//     flex: 1,
//     height: 40,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#1976d2',
//   },
//   secondaryBtn: {
//     flex: 1,
//     height: 40,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#1976d2',
//     backgroundColor: '#fff',
//   },
//   editBtn: {
//     flex: 1,
//     height: 36,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#2e7d32',
//   },
//   deleteBtn: {
//     flex: 1,
//     height: 36,
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#d32f2f',
//   },
//   btnText: { color: '#fff', fontWeight: '700' },
//   secondaryText: { color: '#1976d2', fontWeight: '700' },
//   centered: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
//   mutedText: { opacity: 0.7, fontSize: 13 },
//   noticeCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
//   noticeDetails: { opacity: 0.9 },
//   noticeMeta: { opacity: 0.65, fontSize: 12 },
//   disabled: { opacity: 0.65 },
// });


import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Text
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { apiService } from '@/api/client';

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

interface NoticeItem {
  _id: string;
  title: string;
  details: string;
  date: string;
  validity: string;
}

export default function NoticeTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [validity, setValidity] = useState('');
  const [showValidityPicker, setShowValidityPicker] = useState(false);
  const [notices, setNotices] = useState<NoticeItem[]>([]);

  const isEditing = useMemo(() => !!editingId, [editingId]);

  useEffect(() => {
    void loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const response = await apiService.getValidNotices();
      if (!response.success) {
        throw new Error(response.msg || 'Failed to fetch notices');
      }
      setNotices(Array.isArray(response.data) ? (response.data as unknown as NoticeItem[]) : []);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDetails('');
    setValidity('');
    setShowValidityPicker(false);
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const parseDate = (value: string) => {
    const parsed = value ? new Date(value) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const onValidityDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowValidityPicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) return;
    setValidity(formatDate(selectedDate));
  };

  const onSubmit = async () => {
    if (!title.trim() || !details.trim() || !validity.trim()) {
      Alert.alert('Validation Error', 'Title, details and validity date are required');
      return;
    }

    try {
      setSaving(true);

      if (isEditing && editingId) {
        const response = await apiService.updateNotice(editingId, {
          title: title.trim(),
          details: details.trim(),
          validity,
        });
        if (!response.success) throw new Error(response.msg || 'Failed to update notice');
        Alert.alert('Success', 'Notice updated successfully');
      } else {
        const response = await apiService.createNotice({
          title: title.trim(),
          details: details.trim(),
          validity,
        });
        if (!response.success) throw new Error(response.msg || 'Failed to create notice');
        Alert.alert('Success', 'Notice created successfully');
      }

      resetForm();
      await loadNotices();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      setSaving(true);
      const response = await apiService.deleteNotice(id);
      if (!response.success) throw new Error(response.msg || 'Failed to delete notice');
      Alert.alert('Success', 'Notice deleted successfully');
      await loadNotices();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete notice');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item: NoticeItem) => {
    setEditingId(item._id);
    setTitle(item.title || '');
    setDetails(item.details || '');
    setValidity(item.validity ? new Date(item.validity).toISOString().substring(0, 10) : '');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{isEditing ? 'Update Notice' : 'Add Notice'}</Text>
        
        <View style={styles.fieldGap}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Annual Sports Day"
            placeholderTextColor={PALETTE.textBody}
            value={title}
            onChangeText={setTitle}
            editable={!saving}
          />
        </View>

        <View style={styles.fieldGap}>
          <Text style={styles.fieldLabel}>Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide complete details here..."
            placeholderTextColor={PALETTE.textBody}
            value={details}
            onChangeText={setDetails}
            editable={!saving}
            multiline
          />
        </View>

        <View style={styles.fieldGap}>
          <Text style={styles.fieldLabel}>Validity Date</Text>
          <Pressable
            style={({ pressed }) => [styles.dateInputButton, pressed && styles.pressedOpacity]}
            onPress={() => setShowValidityPicker(true)}
            disabled={saving}
          >
            <Text style={[styles.dateInputText, { color: validity ? PALETTE.textHeading : PALETTE.textBody }]}>
              {validity || 'Select validity date'}
            </Text>
          </Pressable>
          {showValidityPicker ? (
            <DateTimePicker
              value={parseDate(validity)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={onValidityDateChange}
            />
          ) : null}
        </View>

        <View style={styles.row}>
          <Pressable 
            style={({ pressed }) => [styles.primaryBtn, (saving || pressed) && styles.pressedOpacity]} 
            onPress={onSubmit} 
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isEditing ? 'Update' : 'Create Notice'}</Text>}
          </Pressable>
          {isEditing ? (
            <Pressable 
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressedOpacity]} 
              onPress={resetForm} 
              disabled={saving}
            >
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Valid Notices</Text>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={PALETTE.accent} /></View>
      ) : notices.length === 0 ? (
        <Text style={styles.mutedText}>No valid notices found.</Text>
      ) : (
        notices.map((item) => (
          <View key={item._id} style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>{item.title}</Text>
            <Text style={styles.noticeDetails}>{item.details}</Text>
            <Text style={styles.noticeMeta}>
              Date: {new Date(item.date).toLocaleDateString()} | Valid till: {new Date(item.validity).toLocaleDateString()}
            </Text>

            <View style={styles.actionRow}>
              <Pressable 
                style={({ pressed }) => [styles.editBtn, pressed && styles.pressedOpacity]} 
                onPress={() => onEdit(item)} 
                disabled={saving}
              >
                <Text style={styles.btnText}>Edit</Text>
              </Pressable>
              <Pressable 
                style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressedOpacity]} 
                onPress={() => onDelete(item._id)} 
                disabled={saving}
              >
                <Text style={styles.btnText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
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
    gap: 16, 
    paddingBottom: 40 
  },
  formCard: { 
    borderWidth: 1, 
    borderRadius: 4, 
    padding: 16, 
    gap: 16,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  fieldGap: {
    gap: 6,
  },
  fieldLabel: {
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
    fontSize: 14,
    backgroundColor: PALETTE.background,
    borderColor: PALETTE.border,
    color: PALETTE.textHeading,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateInputButton: {
    borderWidth: 1,
    borderRadius: 4,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    backgroundColor: PALETTE.background,
    borderColor: PALETTE.border,
  },
  dateInputText: {
    fontSize: 14,
  },
  row: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 4 
  },
  primaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.cta,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
  },
  btnText: { 
    color: PALETTE.surface, 
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryText: { 
    color: PALETTE.textHeading, 
    fontWeight: '700',
    fontSize: 14, 
  },
  centered: { 
    paddingVertical: 24, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  mutedText: { 
    color: PALETTE.textBody,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  noticeCard: { 
    borderWidth: 1, 
    borderRadius: 4, 
    padding: 16, 
    gap: 8,
    backgroundColor: PALETTE.surface,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  noticeDetails: { 
    fontSize: 14,
    color: PALETTE.textBody,
    lineHeight: 20,
  },
  noticeMeta: { 
    fontSize: 12,
    color: PALETTE.textBody,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  editBtn: {
    flex: 1,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.success,
  },
  deleteBtn: {
    flex: 1,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.error,
  },
  disabled: { 
    opacity: 0.65 
  },
  pressedOpacity: {
    opacity: 0.85,
  }
});