import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ABOUT_CONTENT, BRAND } from '../src/constants/siteContent';

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: theme.background, borderColor: theme.icon }]}>
          <ThemedText type="title">About Us</ThemedText>
          <ThemedText style={styles.lead}>
            {BRAND.name} is designed to simplify everyday school operations while keeping data handling practical,
            responsible, and transparent.
          </ThemedText>
        </View>

        <View style={styles.grid}>
          <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.icon }]}>
            <ThemedText type="defaultSemiBold">How We Handle Data</ThemedText>
            <ThemedText style={styles.text}>{ABOUT_CONTENT.dataHandling}</ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.icon }]}>
            <ThemedText type="defaultSemiBold">Our Goal</ThemedText>
            <ThemedText style={styles.text}>{ABOUT_CONTENT.goal}</ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.icon }]}>
            <ThemedText type="defaultSemiBold">School Efficiency Impact</ThemedText>
            <ThemedText style={styles.text}>{ABOUT_CONTENT.efficiency}</ThemedText>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.icon }]}>
          <ThemedText type="defaultSemiBold">Data Security Policy</ThemedText>
          <View style={styles.bulletList}>
            {ABOUT_CONTENT.securityPolicy.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: theme.tint }]} />
                <ThemedText style={styles.bulletText}>{item}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  content: {
    gap: 16,
    paddingBottom: 24,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  grid: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  bulletList: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});