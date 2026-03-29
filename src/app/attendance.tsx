import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function AttendanceScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(239, 108, 0, 0.08)',
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.75,
  },
});
