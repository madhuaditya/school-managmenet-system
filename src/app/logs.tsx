import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';


const LOG_DIR = new Directory(Paths.document, 'logs');

export default function LogsScreen() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

const loadFiles = useCallback(async () => {
  setLoading(true);

  try {
    if (!LOG_DIR.exists) {
      setFiles([]);
      return;
    }

    const entries = LOG_DIR.list();

    const filesWithTime = entries
      .filter((entry) => entry instanceof File)
      .map((file) => ({
        name: file.name,
        mtime: file.modificationTime ?? 0,
      }));

    filesWithTime.sort((a, b) => b.mtime - a.mtime);

    setFiles(filesWithTime.map((f) => f.name));
  } catch (error) {
    Alert.alert('Failed to read logs', String(error));
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

const openFile = useCallback(async (filename: string) => {
  try {
    const file = new File(LOG_DIR, filename);

    if (!file.exists) {
      Alert.alert('File not found');
      return;
    }

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert(
        filename,
        file.text().slice(0, 10000)
      );
      return;
    }

    await Sharing.shareAsync(file.uri);
  } catch (error) {
    Alert.alert('Failed to open file', String(error));
  }
}, []);

  const exportNow = useCallback(async () => {
    try {
      setExporting(true);
      const dest = await exportLogsSnapshotToDownloads();
      if (dest) {
        Alert.alert('Exported', `Logs exported to: ${dest}`);
      } else {
        Alert.alert('Export failed', 'Could not export logs.');
      }
    } catch (error) {
      Alert.alert('Export error', String(error));
    } finally {
      setExporting(false);
      void loadFiles();
    }
  }, [loadFiles]);

  const renderItem = ({ item }: { item: string }) => (
    <Pressable style={styles.item} onPress={() => void openFile(item)}>
      <Text style={styles.itemText}>{item}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>App Logs</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList data={files} keyExtractor={(i) => i} renderItem={renderItem} contentContainerStyle={styles.list} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '700' },
  exportButton: { backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  exportText: { color: '#fff', fontWeight: '700' },
  list: { paddingTop: 12 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  itemText: { fontSize: 14 },
});
