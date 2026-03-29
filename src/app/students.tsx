import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function StudentsScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <ThemedText type="title">Students</ThemedText>
        <ThemedText style={styles.subtitle}>Student management screen.</ThemedText>
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
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.75,
  },
});
