import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BRAND } from '../src/constants/siteContent';

export default function FeedbackScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', rating: '', message: '' });

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitFeedback = async () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const rating = form.rating.trim();
    const message = form.message.trim();

    if (name.length < 2) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Validation', 'Enter a valid email address.');
      return;
    }
    if (!rating) {
      Alert.alert('Validation', 'Please select a rating.');
      return;
    }
    if (message.length < 10) {
      Alert.alert('Validation', 'Feedback should be at least 10 characters.');
      return;
    }

    try {
      setLoading(true);
      setResultMessage('');
      setIsError(false);

      const response = await apiService.submitPublicFeedback({
        name,
        email,
        rating,
        message,
        type: 'feedback',
      });

      setResultMessage(response.msg || 'Thanks for your feedback.');
      setForm({ name: '', email: '', rating: '', message: '' });
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.';
      setIsError(true);
      setResultMessage(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.icon }]}>
          <ThemedText type="title">Feedback Form</ThemedText>
          <ThemedText style={styles.text}>Share your experience and suggestions to help us improve.</ThemedText>
          <ThemedText style={styles.smallNote}>We use feedback to improve {BRAND.name} for schools and staff.</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.icon }]}>
          <View style={styles.field}>
            <ThemedText style={styles.label}>Name</ThemedText>
            <TextInput
              value={form.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder="Your name"
              placeholderTextColor={theme.icon}
              style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              value={form.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="you@example.com"
              placeholderTextColor={theme.icon}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Rating</ThemedText>
            <View style={styles.ratingRow}>
              {[
                ['5', '5 - Excellent'],
                ['4', '4 - Very Good'],
                ['3', '3 - Good'],
                ['2', '2 - Fair'],
                ['1', '1 - Needs Improvement'],
              ].map(([value, label]) => {
                const selected = form.rating === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => updateField('rating', value)}
                    style={[
                      styles.ratingPill,
                      {
                        borderColor: selected ? theme.tint : theme.icon,
                        backgroundColor: selected ? `${theme.tint}15` : 'transparent',
                      },
                    ]}>
                    <ThemedText style={[styles.ratingText, { color: selected ? theme.tint : theme.text }]}>
                      {label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Feedback Message</ThemedText>
            <TextInput
              value={form.message}
              onChangeText={(value) => updateField('message', value)}
              placeholder="Tell us what worked well or what should improve"
              placeholderTextColor={theme.icon}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={[styles.textArea, { borderColor: theme.icon, color: theme.text }]}
            />
          </View>

          <TouchableOpacity
            onPress={submitFeedback}
            disabled={loading}
            style={[styles.button, { backgroundColor: theme.tint, opacity: loading ? 0.75 : 1 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Submit Feedback</ThemedText>}
          </TouchableOpacity>

          {resultMessage ? (
            <ThemedText style={[styles.resultText, { color: isError ? '#DC2626' : '#059669' }]}>
              {resultMessage}
            </ThemedText>
          ) : null}
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
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 128,
    fontSize: 14,
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  resultText: {
    fontSize: 13,
    lineHeight: 18,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  smallNote: {
    fontSize: 13,
    lineHeight: 18,
  },
});