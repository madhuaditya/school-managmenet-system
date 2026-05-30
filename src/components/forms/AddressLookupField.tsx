import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

type AddressLookupFieldProps = {
  address: string;
  setAddress?: (value: string) => void;
  pincode: string;
  setPincode?: (value: string) => void;
  city: string;
  setCity?: (value: string) => void;
  state: string;
  setState?: (value: string) => void;
  country?: string;
  setCountry?: (value: string) => void;
  disabled?: boolean;
  errors?: Partial<Record<'address' | 'pincode' | 'city' | 'state' | 'country', string>>;
  showCountry?: boolean;
};

type PostOffice = {
  City?: string;
  Name?: string;
  District?: string;
  State?: string;
  Country?: string;
  Pincode?: string;
};

type ZipPlace = {
  'place name'?: string;
  state?: string;
  'state abbreviation'?: string;
};

type ZipResponse = {
  country?: string;
  places?: ZipPlace[];
};

const DEFAULT_FIELDS = {
  address: true,
  pincode: true,
  city: true,
  state: true,
  country: false,
};

const normalizePincode = (value: string) => String(value || '').replace(/\D/g, '').slice(0, 6);

export default function AddressLookupField({
  address,
  setAddress,
  pincode,
  setPincode,
  city,
  setCity,
  state,
  setState,
  country,
  setCountry,
  disabled = false,
  errors,
  showCountry = false,
}: AddressLookupFieldProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const visibleFields = { ...DEFAULT_FIELDS, country: showCountry };

  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [offices, setOffices] = useState<PostOffice[]>([]);
  const [lastFetchedPincode, setLastFetchedPincode] = useState('');
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const selectedOffice = useMemo(
    () => offices.find((office) => office.Name === city) || null,
    [city, offices],
  );

  useEffect(() => {
    if (pincode) return;
    setOffices([]);
    setLookupError('');
    setLastFetchedPincode('');
    setCityModalVisible(false);
  }, [pincode]);

  const clearLocationFields = () => {
    setCity?.('');
    setState?.('');
    setCountry?.('');
  };

  const mapZipPlaces = (data: ZipResponse): PostOffice[] => {
    const country = data.country || 'India';
    return (data.places || []).map((place) => ({
      City: place['place name'],
      Name: place['place name'],
      District: place['place name'],
      State: place.state,
      Country: country,
      Pincode: normalizePincode(pincode),
    }));
  };

  const handlePincodeChange = (value: string) => {
    const nextValue = normalizePincode(value);
    setPincode?.(nextValue);
    setOffices([]);
    setLookupError('');
    setLastFetchedPincode('');
    clearLocationFields();
  };

  const fetchPincodeDetails = async () => {
    const nextPincode = normalizePincode(pincode);

    if (nextPincode.length !== 6) {
      setLookupError('Enter a valid 6-digit pincode first.');
      setOffices([]);
      clearLocationFields();
      return;
    }

    if (nextPincode === lastFetchedPincode && offices.length > 0) {
      setCityModalVisible(true);
      return;
    }

    try {
      setLoading(true);
      setLookupError('');

      const zipResponse = await fetch(`https://api.zippopotam.us/in/${nextPincode}`);
      if (!zipResponse.ok) {
        throw new Error('Zip lookup failed');
      }

      const zipData = (await zipResponse.json()) as ZipResponse;
      const postOffices = mapZipPlaces(zipData);

      if (!Array.isArray(postOffices) || postOffices.length === 0) {
        setOffices([]);
        setLookupError('No city found for this pincode.');
        setLastFetchedPincode(nextPincode);
        clearLocationFields();
        return;
      }

      setOffices(postOffices);
      setLastFetchedPincode(nextPincode);
      setCityModalVisible(true);
    } catch {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${nextPincode}`);
        const data = await response.json();
        const postOffices = (data?.[0]?.PostOffice || []).map((office: PostOffice) => ({
          ...office,
          City: office.District || office.Name || office.City,
        }));

        if (!Array.isArray(postOffices) || postOffices.length === 0) {
          setOffices([]);
        setLookupError('No city found for this pincode.');
          setLastFetchedPincode(nextPincode);
          clearLocationFields();
          return;
        }

        setOffices(postOffices);
        setLastFetchedPincode(nextPincode);
        setCityModalVisible(true);
      } catch {
        setOffices([]);
        setLookupError('Failed to load city details for this pincode.');
        clearLocationFields();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelection = (value: string) => {
    if (!value) {
      setCity?.('');
      return;
    }

    const office = offices.find((item) => item.Name === value);
    if (office) {
      setCity?.(office.City || office.Name || '');
      setState?.(office.State || '');
      setCountry?.(office.Country || '');
      setCityModalVisible(false);
    } else {
      setCity?.(value);
    }
  };

  return (
    <ThemedView style={styles.card}>
      {visibleFields.address ? (
        <View style={styles.field}>
          <ThemedText style={styles.label}>Address</ThemedText>
          <TextInput
            value={address}
            onChangeText={(value) => setAddress?.(value)}
            editable={!disabled}
            multiline
            placeholder="Enter address"
            placeholderTextColor={theme.icon}
            style={[
              styles.input,
              {
                borderColor: errors?.address ? '#ff6b6b' : theme.icon,
                color: theme.text,
                backgroundColor: disabled ? '#f0f0f0' : theme.background,
              },
            ]}
          />
          {errors?.address ? <ThemedText style={styles.errorText}>{errors.address}</ThemedText> : null}
        </View>
      ) : null}

      {visibleFields.pincode ? (
        <View style={styles.field}>
          <ThemedText style={styles.label}>Pin Code</ThemedText>
          <View style={styles.row}>
            <TextInput
              value={pincode}
              onChangeText={handlePincodeChange}
              editable={!disabled}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Enter 6-digit pincode"
              placeholderTextColor={theme.icon}
              style={[
                styles.input,
                styles.flexInput,
                {
                  borderColor: errors?.pincode ? '#ff6b6b' : theme.icon,
                  color: theme.text,
                  backgroundColor: disabled ? '#f0f0f0' : theme.background,
                },
              ]}
            />
            <Pressable
              onPress={fetchPincodeDetails}
              disabled={disabled || loading}
              style={[styles.fetchButton, { backgroundColor: theme.tint, opacity: disabled || loading ? 0.65 : 1 }]}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.fetchButtonText}>Fetch</ThemedText>}
            </Pressable>
          </View>
          {lookupError ? <ThemedText style={styles.errorText}>{lookupError}</ThemedText> : null}
        </View>
      ) : null}

      {visibleFields.city ? (
        <View style={styles.field}>
          <ThemedText style={styles.label}>City</ThemedText>
          <Pressable
            onPress={() => (offices.length > 0 ? setCityModalVisible(true) : undefined)}
            disabled={disabled || offices.length === 0}
            style={[
              styles.selectButton,
              {
                borderColor: errors?.city ? '#ff6b6b' : theme.icon,
                backgroundColor: disabled ? '#f0f0f0' : theme.background,
              },
            ]}
          >
            <ThemedText style={[styles.selectText, { color: city ? theme.text : theme.icon }]}>
              {city || 'Select city'}
            </ThemedText>
          </Pressable>
          {errors?.city ? <ThemedText style={styles.errorText}>{errors.city}</ThemedText> : null}

          <Modal visible={cityModalVisible} transparent animationType="slide" onRequestClose={() => setCityModalVisible(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setCityModalVisible(false)}>
              <Pressable style={[styles.modalCard, { backgroundColor: theme.background }]} onPress={() => undefined}>
                <View style={styles.modalHeader}>
                  <ThemedText type="subtitle">Select City</ThemedText>
                  <Pressable onPress={() => setCityModalVisible(false)}>
                    <ThemedText style={{ color: theme.tint }}>Close</ThemedText>
                  </Pressable>
                </View>
                {offices.length > 0 ? (
                  <FlatList
                    data={offices}
                    keyExtractor={(item, index) => `${item.Name}-${item.Pincode || index}`}
                    renderItem={({ item }) => {
                      const displayCity = item.City || item.Name || '';
                      const selected = displayCity === city;
                      return (
                        <Pressable
                          onPress={() => handleCitySelection(displayCity)}
                          style={[styles.officeItem, selected && { backgroundColor: theme.tint }]}
                        >
                          <ThemedText style={[styles.officeName, selected && styles.officeNameSelected]}>{displayCity}</ThemedText>
                          <ThemedText style={[styles.officeMeta, selected && styles.officeNameSelected]} numberOfLines={1}>
                            {item.District}, {item.State}, {item.Country}
                          </ThemedText>
                        </Pressable>
                      );
                    }}
                  />
                ) : (
                  <ThemedText style={styles.emptyText}>No post office found</ThemedText>
                )}
              </Pressable>
            </Pressable>
          </Modal>

          {selectedOffice ? (
            <ThemedText style={styles.helperText}>
              {selectedOffice.District}, {selectedOffice.State}, {selectedOffice.Country}
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      {visibleFields.state ? (
        <View style={styles.field}>
          <ThemedText style={styles.label}>State</ThemedText>
          <TextInput
            value={state}
            editable={false}
            placeholder="State will auto-fill"
            placeholderTextColor={theme.icon}
            style={[
              styles.input,
              {
                borderColor: errors?.state ? '#ff6b6b' : theme.icon,
                color: theme.text,
                backgroundColor: '#f0f0f0',
              },
            ]}
          />
          {errors?.state ? <ThemedText style={styles.errorText}>{errors.state}</ThemedText> : null}
        </View>
      ) : null}

      {visibleFields.country ? (
        <View style={styles.field}>
          <ThemedText style={styles.label}>Country</ThemedText>
          <TextInput
            value={country || ''}
            editable={false}
            placeholder="Country will auto-fill"
            placeholderTextColor={theme.icon}
            style={[
              styles.input,
              {
                borderColor: errors?.country ? '#ff6b6b' : theme.icon,
                color: theme.text,
                backgroundColor: '#f0f0f0',
              },
            ]}
          />
          {errors?.country ? <ThemedText style={styles.errorText}>{errors.country}</ThemedText> : null}
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  flexInput: {
    flex: 1,
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
    minHeight: 46,
  },
  selectButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
    justifyContent: 'center',
  },
  selectText: {
    fontSize: 14,
  },
  fetchButton: {
    minWidth: 84,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  fetchButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
  },
  helperText: {
    fontSize: 12,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(127,127,127,0.2)',
  },
  officeItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(127,127,127,0.12)',
  },
  officeName: {
    fontSize: 14,
    fontWeight: '700',
  },
  officeMeta: {
    fontSize: 11,
    opacity: 0.72,
    marginTop: 4,
  },
  officeNameSelected: {
    color: '#fff',
  },
  emptyText: {
    padding: 16,
    opacity: 0.7,
  },
});