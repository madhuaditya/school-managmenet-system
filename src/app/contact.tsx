import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CONTACT_DETAILS } from '../src/constants/siteContent';

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
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.icon }]}>
          <ThemedText type="title">Contact Us</ThemedText>
          <ThemedText style={styles.text}>
            Contact us for school onboarding, partnership discussion, and product support. You can also use the
            feedback form to help us improve.
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.icon }]}>
          <ThemedText type="defaultSemiBold">Reach Us</ThemedText>
          <ThemedText style={styles.contactText}>Email: {CONTACT_DETAILS.email}</ThemedText>
          <ThemedText style={styles.contactText}>Phone: {CONTACT_DETAILS.phone}</ThemedText>
          <ThemedText style={styles.contactText}>Address: {CONTACT_DETAILS.address}</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.icon }]}>
          <ThemedText type="defaultSemiBold">Contact Form</ThemedText>

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
            <ThemedText style={styles.label}>Phone</ThemedText>
            <TextInput
              value={form.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="10-digit mobile number"
              placeholderTextColor={theme.icon}
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
              placeholderTextColor={theme.icon}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[styles.textArea, { borderColor: theme.icon, color: theme.text }]}
            />
          </View>

          <TouchableOpacity
            onPress={submitContact}
            disabled={loading}
            style={[styles.button, { backgroundColor: theme.tint, opacity: loading ? 0.75 : 1 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Submit Contact Request</ThemedText>}
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
    minHeight: 120,
    fontSize: 14,
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
  contactText: {
    fontSize: 14,
    lineHeight: 20,
  },
});