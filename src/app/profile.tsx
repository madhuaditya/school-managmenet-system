import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AddressLookupField from '@/components/forms/AddressLookupField';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth.store';

interface ProfileForm {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const surfaceBg = isDark ? '#0B1220' : '#F9FAFB';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const mutedColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#D1D5DB';
  const primaryButtonBg = isDark ? '#2563EB' : theme.tint;
  const secondaryButtonBg = isDark ? 'rgba(37, 99, 235, 0.14)' : 'transparent';
  const logoutButtonBg = isDark ? 'rgba(217, 48, 37, 0.14)' : 'transparent';

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('');
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProfile();
      const data = response.data;

      if (!data) {
        Alert.alert('Error', response.msg || 'Failed to load profile');
        return;
      }

      setProfileImage(data.image || '');
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        address: (data as unknown as { address?: string }).address || '',
        city: (data as unknown as { city?: string }).city || '',
        state: (data as unknown as { state?: string }).state || '',
        pinCode: (data as unknown as { pinCode?: string }).pinCode || '',
      });

      // Keep store user in sync for header avatar/name updates.
      useAuthStore.setState((prev) => ({
        ...prev,
        user: prev.user
          ? {
              ...prev.user,
              name: data.name || prev.user.name,
              phone: data.phone || prev.user.phone,
              image: data.image || prev.user.image,
            }
          : prev.user,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load profile';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    const trimmedName = form.name.trim();
    const trimmedPhone = form.phone.trim();
    const trimmedAddress = form.address.trim();
    const trimmedCity = form.city.trim();
    const trimmedState = form.state.trim();
    const trimmedPinCode = form.pinCode.trim();

    if (trimmedName.length < 3) {
      Alert.alert('Validation', 'Name must be at least 3 characters.');
      return;
    }
    if (trimmedPhone && !/^\d{10}$/.test(trimmedPhone)) {
      Alert.alert('Validation', 'Phone must be exactly 10 digits.');
      return;
    }
    if (trimmedAddress && trimmedAddress.length < 5) {
      Alert.alert('Validation', 'Address must be at least 5 characters.');
      return;
    }
    if (trimmedCity && trimmedCity.length < 2) {
      Alert.alert('Validation', 'City must be at least 2 characters.');
      return;
    }
    if (trimmedState && trimmedState.length < 2) {
      Alert.alert('Validation', 'State must be at least 2 characters.');
      return;
    }
    if (trimmedPinCode && !/^\d{6}$/.test(trimmedPinCode)) {
      Alert.alert('Validation', 'Pin code must be exactly 6 digits.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
        city: trimmedCity,
        state: trimmedState,
        pinCode: trimmedPinCode,
      };

      const response = await apiService.updateProfile(payload);
      if (!response.success) {
        Alert.alert('Error', response.msg || 'Failed to update profile');
        return;
      }

      const updated = response.data;
      if (updated) {
        setProfileImage(updated.image || '');
        setForm((prev) => ({
          ...prev,
          name: updated.name || '',
          phone: updated.phone || '',
          address: (updated as unknown as { address?: string }).address || '',
          city: (updated as unknown as { city?: string }).city || '',
          state: (updated as unknown as { state?: string }).state || '',
          pinCode: (updated as unknown as { pinCode?: string }).pinCode || '',
        }));
      }

      useAuthStore.setState((prev) => ({
        ...prev,
        user: prev.user
          ? {
              ...prev.user,
              name: updated?.name || trimmedName,
              phone: updated?.phone || trimmedPhone,
              image: updated?.image || prev.user.image,
            }
          : prev.user,
      }));

      Alert.alert('Success', response.msg || 'Profile updated successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleSelectProfileImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow gallery access to update profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const selected = result.assets[0];
      if (!selected?.uri) {
        Alert.alert('Error', 'Could not read selected image.');
        return;
      }

      setUploadingImage(true);
      const uploadResponse = await apiService.uploadProfileImage({
        uri: selected.uri,
        fileName: selected.fileName || `profile-${Date.now()}.jpg`,
        mimeType: selected.mimeType || 'image/jpeg',
      });

      if (!uploadResponse.success) {
        Alert.alert('Error', uploadResponse.msg || 'Failed to upload image');
        return;
      }

      const imageUrl = uploadResponse.data?.image || '';
      if (!imageUrl) {
        Alert.alert('Error', 'Image uploaded but URL was not returned.');
        return;
      }

      setProfileImage(imageUrl);
      useAuthStore.setState((prev) => ({
        ...prev,
        user: prev.user ? { ...prev.user, image: imageUrl } : prev.user,
      }));

      Alert.alert('Success', 'Profile image updated successfully.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      Alert.alert('Error', message);
    } finally {
      setUploadingImage(false);
    }
  };

  const avatarInitial = (form.name?.trim()?.charAt(0) || user?.name?.trim()?.charAt(0) || 'U').toUpperCase();

  if (loading) {
    return (
      <ThemedView style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  return (
      <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: theme.tint }]}>
              <ThemedText style={styles.avatarText}>{avatarInitial}</ThemedText>
            </View>
          )}

          <TouchableOpacity
            style={[styles.changePhotoBtn, { borderColor: theme.tint, backgroundColor: isDark ? 'rgba(37, 99, 235, 0.14)' : 'transparent' }]}
            disabled={uploadingImage}
            onPress={handleSelectProfileImage}>
            {uploadingImage ? (
              <ActivityIndicator size="small" color={theme.tint} />
            ) : (
              <ThemedText style={[styles.changePhotoText, { color: theme.tint }]}>Change Photo</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.fieldWrap}>
          <ThemedText style={styles.label}>Name</ThemedText>
          <TextInput
            value={form.name}
            onChangeText={(v) => updateField('name', v)}
            style={[styles.input, { borderColor, backgroundColor: surfaceBg, color: textColor }]}
            placeholder="Enter name"
            placeholderTextColor={mutedColor}
          />
        </View>

        <View style={styles.fieldWrap}>
          <ThemedText style={styles.label}>Phone</ThemedText>
          <TextInput
            value={form.phone}
            onChangeText={(v) => updateField('phone', v)}
            style={[styles.input, { borderColor, backgroundColor: surfaceBg, color: textColor }]}
            placeholder="Enter phone"
            keyboardType="phone-pad"
            placeholderTextColor={mutedColor}
          />
        </View>

        <ThemedView style={styles.addressSection}>
          <ThemedText style={styles.sectionLabel}>Address</ThemedText>
          <AddressLookupField
            address={form.address}
            setAddress={(value) => updateField('address', value)}
            pincode={form.pinCode}
            setPincode={(value) => updateField('pinCode', value)}
            city={form.city}
            setCity={(value) => updateField('city', value)}
            state={form.state}
            setState={(value) => updateField('state', value)}
          />
        </ThemedView>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: saving ? (isDark ? '#475569' : theme.tabIconDefault) : primaryButtonBg }]}
          disabled={saving}
          onPress={handleUpdate}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={styles.actionText}>Update Profile</ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: theme.tint, backgroundColor: secondaryButtonBg }]}
          onPress={() => {
            if (user?._id) {
              router.push({ pathname: '/attdence-detail/[id]', params: { id: user._id } });
            }
          }}>
          <ThemedText style={[styles.secondaryBtnText, { color: theme.tint }]}>My Attendance</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: '#d93025', backgroundColor: logoutButtonBg }]}
          onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 6,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 36,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: {
    fontWeight: '700',
    fontSize: 13,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  fieldWrap: {
    marginBottom: 12,
  },
  addressSection: {
    marginBottom: 12,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 5,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 0,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  actionBtn: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginTop: 10,
  },
  actionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  logoutBtn: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  secondaryBtn: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  logoutText: {
    color: '#d93025',
    fontSize: 15,
    fontWeight: '700',
  },
});
