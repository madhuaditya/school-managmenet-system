import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CONTACT_DETAILS } from '../src/constants/siteContent';

const APP_COLORS = {
  text: '#303841',
  accent: '#76ABAE',
  cta: '#FF5722',
  background: '#F5F5F5',
  border: '#E6E6E6',
};

export default function ContactScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitContact = async () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const message = form.message.trim();

    if (name.length < 2) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Validation', 'Enter a valid email address.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert('Validation', 'Enter a valid 10-digit mobile number.');
      return;
    }
    if (message.length < 12) {
      Alert.alert('Validation', 'Message should be at least 12 characters.');
      return;
    }

    try {
      setLoading(true);
      setResultMessage('');
      setIsError(false);

      const response = await apiService.submitPublicContact({
        name,
        email,
        phone,
        message,
        type: 'contact',
      });

      setResultMessage(response.msg || 'Your contact request has been submitted successfully.');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to submit contact request. Please try again.';
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
            Contact Us
          </ThemedText>

          <ThemedText style={styles.heroDescription}>
            Questions about onboarding, partnerships, support, or product
            feedback? We'd be happy to help and usually respond within
            1–2 business days.
          </ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>
            Reach Us
          </ThemedText>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Email</ThemedText>
            <ThemedText style={styles.infoValue}>
              {CONTACT_DETAILS.email}
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Phone</ThemedText>
            <ThemedText style={styles.infoValue}>
              {CONTACT_DETAILS.phone}
            </ThemedText>
          </View>

          <View
            style={[
              styles.infoRow,
              {
                borderBottomWidth: 0,
                paddingBottom: 0,
              },
            ]}>
            <ThemedText style={styles.infoLabel}>Address</ThemedText>
            <ThemedText style={styles.infoValue}>
              {CONTACT_DETAILS.address}
            </ThemedText>
          </View>
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>
            Send a Message
          </ThemedText>

          <ThemedText style={styles.sectionSubtitle}>
            Tell us how we can help.
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
            <ThemedText style={styles.label}>Phone</ThemedText>
            <TextInput
              value={form.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="10-digit mobile number"
              placeholderTextColor="#9AA0A6"
              keyboardType="phone-pad"
              maxLength={10}
              style={[styles.input, { borderColor: theme.icon, color: theme.text }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Message</ThemedText>
            <TextInput
              value={form.message}
              onChangeText={(value) => updateField('message', value)}
              placeholder="How can we help?"
              placeholderTextColor="#9AA0A6"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[styles.textArea, { borderColor: theme.icon, color: theme.text }]}
            />
          </View>

          <TouchableOpacity
            onPress={submitContact}
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
                Submit Request
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
    color: '#5F6670',
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
    marginBottom: 12,
  },

  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },

  infoLabel: {
    fontSize: 12,
    color: '#7A7A7A',
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 14,
    color: '#303841',
    fontWeight: '500',
  },

  field: {
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
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
    minHeight: 110,
    fontSize: 14,
    color: '#303841',
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