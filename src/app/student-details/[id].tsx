import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator, View, Pressable } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface StudentProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  studentId?: string;
  rollNumber?: string | number;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  fatherName?: string;
  motherName?: string;
  fatherPhone?: string;
  motherPhone?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  parentContact?: string; // fallback if specific parent phone is not available
  class?: { _id: string; name: string };
  createdAt?: string;
}

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const formatDate = (value?: string) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  useEffect(() => {
    if (id) {
      fetchStudentDetails();
    }
  }, [id]);

  useEffect(() => {
    if (student) {
      navigation.setOptions({
        title: student.name,
      });
    }
  }, [student, navigation]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getStudentById(id as string);
      if (response.success && response.data) {
        setStudent(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch student details');
    } finally {
      setLoading(false);
    }
  };

  const InfoSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <ThemedView style={styles.sectionContent}>{children}</ThemedView>
    </ThemedView>
  );

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <View style={styles.infoRow}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.value}>{value || 'N/A'}</ThemedText>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.error}>Error: {error}</ThemedText>
      </ThemedView>
    );
  }

  if (!student) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Student not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      {/* Personal Information Section */}
      <InfoSection title="📋 Personal Information">
        <InfoRow label="Name" value={student.name} />
        <InfoRow label="Email" value={student.email} />
        <InfoRow label="Phone" value={student.phone} />
        <InfoRow label="Gender" value={student.gender} />
        <InfoRow label="Date of Birth" value={formatDate(student.dateOfBirth)} />
      </InfoSection>

      {/* Academic Information Section */}
      <InfoSection title="🎓 Academic Information">
        <InfoRow label="Student Id" value={student.studentId} />
        <InfoRow
          label="Roll Number"
          value={student.rollNumber != null ? String(student.rollNumber) : undefined}
        />
        <InfoRow label="Class" value={student.class?.name} />
      </InfoSection>

      {/* Address Information Section */}
      {student.address && (
        <InfoSection title="📍 Address">
          <InfoRow label="Address" value={student.address} />
           {student.city && <InfoRow label="City" value={student.city} />}
          {student.state && <InfoRow label="State" value={student.state} />}
          {student.pinCode && <InfoRow label="Pin Code" value={student.pinCode} />}
        </InfoSection>

      )}

      {/* Parent Information Section */}
      {(student.fatherName || student.motherName) && (
        <InfoSection title="👨‍👩‍👧 Parent Information">
          {student.fatherName && (
            <>
              <InfoRow label="Father Name" value={student.fatherName} />
              <InfoRow label="Father Phone" value={student.fatherPhone || student.parentContact} />
            </>
          )}
          {student.motherName && (
            <>
              <InfoRow label="Mother Name" value={student.motherName} />
              <InfoRow label="Mother Phone" value={student.motherPhone || student.parentContact} />
            </>
          )}
        </InfoSection>
      )}

      {/* Account Information Section */}
      <InfoSection title="🔐 Account Information">
        <InfoRow
          label="Member Since"
          value={
            student.createdAt
              ? new Date(student.createdAt).toLocaleDateString()
              : 'N/A'
          }
        />
      </InfoSection>

      <ThemedView style={styles.actionWrap}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.tint }]}
          onPress={() => {
            if (id) {
              router.push({
                pathname: '/attdence-detail/[id]',
                params: { id: String(id) },
              });
            }
          }}>
          <ThemedText style={styles.actionButtonText}>View Monthly Attendance</ThemedText>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.performanceButton]}
          onPress={() => {
            if (id) {
              router.push({
                pathname: '/performance/[id]',
                params: { id: String(id) },
              });
            }
          }}>
          <ThemedText style={styles.actionButtonText}>Show Performance</ThemedText>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },
  section: {
    marginTop: 10,
    borderRadius: 14,
    padding: 16,
    backgroundColor: 'rgba(127, 127, 127, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(127, 127, 127, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionContent: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(127, 127, 127, 0.1)',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
    flex: 1,
    paddingRight: 10,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    lineHeight: 20,
  },
  error: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 20,
  },
  actionWrap: {
    marginTop: 12,
    marginBottom: 6,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
  },
  performanceButton: {
    backgroundColor: '#0f766e',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
