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

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroAccent} />
          <ThemedText type="title" style={styles.title}>
            About Us
          </ThemedText>

          <ThemedText style={styles.lead}>
            {BRAND.name} simplifies school operations with a clean, practical, and transparent system designed for real usage.
          </ThemedText>
        </View>

        {/* GRID */}
        <View style={styles.grid}>
          <View style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              How We Handle Data
            </ThemedText>
            <ThemedText style={styles.text}>{ABOUT_CONTENT.dataHandling}</ThemedText>
          </View>

          <View style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              Our Goal
            </ThemedText>
            <ThemedText style={styles.text}>{ABOUT_CONTENT.goal}</ThemedText>
          </View>

          <View style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              School Efficiency Impact
            </ThemedText>
            <ThemedText style={styles.text}>{ABOUT_CONTENT.efficiency}</ThemedText>
          </View>
        </View>

        {/* POLICY */}
        <View style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Data Security Policy
          </ThemedText>

          <View style={styles.bulletList}>
            {ABOUT_CONTENT.securityPolicy.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
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
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
  },

  content: {
    paddingVertical: 16,
    gap: 14,
  },

  /* HERO */
  hero: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },

  heroAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 4,
    height: '100%',
    backgroundColor: '#76ABAE',
  },

  title: {
    color: '#303841',
    marginBottom: 8,
  },

  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: '#303841',
    opacity: 0.8,
  },

  /* GRID */
  grid: {
    gap: 10,
  },

  /* CARD */
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },

  cardTitle: {
    color: '#303841',
  },

  text: {
    fontSize: 13,
    lineHeight: 19,
    color: '#303841',
    opacity: 0.85,
  },

  /* BULLETS */
  bulletList: {
    gap: 10,
    marginTop: 6,
  },

  bulletRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },

  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: '#76ABAE',
  },

  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#303841',
    opacity: 0.85,
  },
});