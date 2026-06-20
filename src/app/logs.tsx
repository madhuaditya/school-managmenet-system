import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';


const LOG_DIR = new Directory(Paths.document, 'logs');

export default function LogsScreen() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const getAllLogFiles = (
    directory: Directory,
    collected: File[] = []
  ): File[] => {
    try {
      const entries = directory.list();

      for (const entry of entries) {
        if (entry instanceof Directory) {
          getAllLogFiles(entry, collected);
        } else if (entry instanceof File) {
          collected.push(entry);
        }
      }
    } catch (error) {
      console.log(
        'Failed to scan:',
        directory.uri,
        error
      );
    }

    return collected;
  };

  const loadFiles = useCallback(async () => {
    setLoading(true);

    try {
      if (!LOG_DIR.exists) {
        setFiles([]);
        return;
      }

      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      // DFS only once
      const allFiles = getAllLogFiles(LOG_DIR);

      const validFiles: File[] = [];

      for (const file of allFiles) {
        const modified =
          file.modificationTime ?? 0;

        // delete files older than 7 days
        if (now - modified > sevenDays) {
          try {
            file.delete();
          } catch { }
          continue;
        }

        validFiles.push(file);
      }

      validFiles.sort(
        (a, b) =>
          (b.modificationTime ?? 0) -
          (a.modificationTime ?? 0)
      );

      setFiles(validFiles);
    } catch (error) {
      Alert.alert(
        'Failed to load logs',
        String(error)
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSelectedFiles = async () => {
    try {
      if (selectedFiles.length === 0) {
        Alert.alert(
          'Select at least one file'
        );
        return;
      }

      Alert.alert(
        'Delete Logs',
        `Delete ${selectedFiles.length} selected files?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // console.log('Deleting files:', selectedFiles);

                for (const uri of selectedFiles) {
                  const file = files.find(
                    (f) => f.uri === uri
                  );

                  // console.log('Deleting:', file?.uri);

                  if (file?.exists) {
                    file.delete();
                  }
                }

                // console.log('Delete completed');

                setSelectedFiles([]);
                await loadFiles();
              } catch (e) {
                // console.log('Delete error:', e);
                Alert.alert('Delete failed', String(e));
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Delete failed',
        String(error)
      );
    }
  };

  const toggleSelection = (uri: string) => {
    setSelectedFiles((prev) =>
      prev.includes(uri)
        ? prev.filter((u) => u !== uri)
        : [...prev, uri]
    );
  };

  const selectAll = () => {
    setSelectedFiles(
      files.map((f) => f.uri)
    );
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const shareSelectedFiles = async () => {
    try {
      if (selectedFiles.length === 0) {
        Alert.alert(
          'Select at least one file'
        );
        return;
      }

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(
          'Sharing not available'
        );
        return;
      }

      const selected = files.filter((file) =>
        selectedFiles.includes(file.uri)
      );

      if (selected.length === 1) {
        await Sharing.shareAsync(
          selected[0].uri
        );
        return;
      }

      let combined = '';
      for (const file of selected) {
        combined += `\n\n========== ${file.name} ==========\n\n`;

        const content = await file.text();

        try {
          const parsed = JSON.parse(content);

          combined += JSON.stringify(
            parsed,
            null,
            2
          );
        } catch {
          // Not valid JSON, use raw text
          combined += content;
        }

        combined += '\n';
      }

      const exportFile = new File(
        LOG_DIR,
        `shared-logs-${Date.now()}.txt`
      );

      if (!exportFile.exists) {
        exportFile.create();
      }

      exportFile.write(combined);

      await Sharing.shareAsync(
        exportFile.uri
      );
    } catch (error) {
      Alert.alert(
        'Share failed',
        String(error)
      );
    }
  };

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const openFile = useCallback(
    async (file: File) => {
      try {
        if (!file.exists) {
          Alert.alert('File not found');
          return;
        }

        if (
          !(await Sharing.isAvailableAsync())
        ) {
          Alert.alert(
            file.name,
            (await file.text()).slice(0, 10000)
          );
          return;
        }

        await Sharing.shareAsync(file.uri);
      } catch (error) {
        Alert.alert(
          'Failed to open file',
          String(error)
        );
      }
    },
    []
  );
  const deleteLogsFolder = async () => {
    try {
      if (LOG_DIR.exists) {
        await LOG_DIR.delete?.(); // deletes folder + everything inside
      }

      setSelectedFiles([]);
      await loadFiles();
    } catch (e) {
      Alert.alert('Delete failed', String(e));
    }
  };

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

  const renderItem = ({
    item,
  }: {
    item: File;
  }) => {
    const selected =
      selectedFiles.includes(item.uri);

    return (
      <Pressable
        onPress={() =>
          toggleSelection(item.uri)
        }
        onLongPress={() =>
          void Sharing.shareAsync(item.uri)
        }
        style={[
          styles.item,
          selected &&
          styles.selectedItem,
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.itemText}>
            {item.name}
          </Text>

          <Text style={styles.dateText}>
            {item.modificationTime
              ? new Date(
                item.modificationTime
              ).toLocaleString()
              : 'Unknown'}
          </Text>
        </View>

        {selected && (
          <Text style={styles.check}>
            ✓
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          App Logs ({files.length})
        </Text>

        <View
          style={{
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <Pressable
            style={styles.actionButton}
            onPress={selectAll}
          >
            <Text style={styles.actionText}>
              All
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={clearSelection}
          >
            <Text style={styles.actionText}>
              Clear
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: '#DC2626' }]}
            onPress={deleteLogsFolder}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              Delete All
            </Text>
          </Pressable>

          <Pressable
            style={styles.exportButton}
            onPress={() =>
              void shareSelectedFiles()
            }
          >
            <Text style={styles.exportText}>
              Share
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.uri}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '700' },
  list: { paddingTop: 12 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  itemText: { fontSize: 14 },
  selectedItem: {
    backgroundColor: '#DBEAFE',
  },

  check: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563EB',
  },

  dateText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },

  actionText: {
    fontWeight: '600',
  },

  exportButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  exportText: {
    color: '#fff',
    fontWeight: '700',
  },
});
