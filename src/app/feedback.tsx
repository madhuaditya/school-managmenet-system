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
        <View style={styles.card}>
          <ThemedText style={styles.heroTitle}>
            Feedback
          </ThemedText>

          <ThemedText style={styles.heroDescription}>
            Help us improve your experience by sharing feedback,
            suggestions, or ideas.
          </ThemedText>

          <ThemedText style={styles.smallNote}>
            Every submission is reviewed by our team and helps shape
            future improvements to {BRAND.name}.
          </ThemedText>
        </View>

       <View style={styles.card}>
        <ThemedText style={styles.sectionTitle}>
          Share Your Experience
        </ThemedText>

        <ThemedText style={styles.sectionSubtitle}>
          Your feedback helps us build a better product.
        </ThemedText>
          <View style={styles.field}>
            <ThemedText style={styles.label}>Name</ThemedText>
            <TextInput
              value={form.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder="Your name"
              placeholderTextColor="#9AA0A6"
              style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              value={form.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="you@example.com"
              placeholderTextColor="#9AA0A6"
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
            />
          </View>

         <View style={styles.field}>
          <ThemedText style={styles.label}>
            Overall Rating
          </ThemedText>

          <View style={styles.ratingRow}>
            {[
              ['5', 'Excellent'],
              ['4', 'Very Good'],
              ['3', 'Good'],
              ['2', 'Fair'],
              ['1', 'Needs Work'],
            ].map(([value, label]) => {
              const selected = form.rating === value;

              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => updateField('rating', value)}
                  style={[
                    styles.ratingCard,
                    selected && styles.selectedRatingCard,
                  ]}>
                  <ThemedText
                    style={[
                      styles.ratingText,
                      selected && styles.selectedRatingText,
                    ]}>
                    {value} ★ {label}
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
              placeholderTextColor="#9AA0A6"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={[styles.textArea, { borderColor: theme.icon, color: theme.text }]}
            />
          </View>

         <TouchableOpacity
          onPress={submitFeedback}
          disabled={loading}
          style={[
            styles.button,
            {
              opacity: loading ? 0.75 : 1,
            },
          ]}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.buttonText}>
              Submit Feedback
            </ThemedText>
          )}
        </TouchableOpacity>

          {resultMessage ? (
            <ThemedText
              style={[
                styles.resultText,
                {
                  color: isError ? '#D14343' : '#76ABAE',
                },
              ]}>
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
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  content: {
    paddingBottom: 32,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
  },

  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#303841',
    marginBottom: 6,
  },

  heroDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#606975',
  },

  smallNote: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8A8A8A',
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#303841',
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 13,
    color: '#7A7A7A',
    marginBottom: 14,
  },

  field: {
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
    marginBottom: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#303841',
  },

  textArea: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 120,
    fontSize: 14,
    color: '#303841',
  },

  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  ratingCard: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  selectedRatingCard: {
    borderColor: '#76ABAE',
    backgroundColor: '#76ABAE15',
  },

  ratingText: {
    fontSize: 12,
    color: '#303841',
    fontWeight: '500',
  },

  selectedRatingText: {
    color: '#76ABAE',
    fontWeight: '600',
  },

  button: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  resultText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
});