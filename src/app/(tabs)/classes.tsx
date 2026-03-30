import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { apiService } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/auth.store';
import { Subject } from '@/src/types';


type IdLabel = { _id: string; name: string };

interface ClassItem {
  _id: string;
  name: string;
  grade?: string;
  section?: string;
  room?: string;
  capacity?: number;
  students?: Array<{ _id: string }>;
  subjects?: Array<{ _id: string; name?: string }>;
  classTeacher?: {
    _id: string;
    user?: { _id: string; name?: string; email?: string };
  };
  studentCount?: number;
}

interface TeacherItem {
  _id: string;
  user?: { _id: string; name?: string; email?: string };
}

export default function ClassesTab() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((state) => state.user);
  const role = typeof user?.role === 'string' ? user.role : user?.role?.role;
  const isAdmin = role === 'admin';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [subjects, setSubjects] = useState<Array<{ _id: string; name?: string }>>([]);

  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [newClassSection, setNewClassSection] = useState('');
  const [newClassCapacity, setNewClassCapacity] = useState('40');
  const [newClassRoom, setNewClassRoom] = useState('R001');

  const [selectedClassForTeacher, setSelectedClassForTeacher] = useState<string | null>(null);
  const [selectedTeacherForClass, setSelectedTeacherForClass] = useState<string | null>(null);

  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectMaxMarks, setSubjectMaxMarks] = useState('100');
  const [selectedClassForSubject, setSelectedClassForSubject] = useState<string | null>(null);
  const [selectedTeacherForSubject, setSelectedTeacherForSubject] = useState<string | null>(null);

  const [selectedClassForExistingSubject, setSelectedClassForExistingSubject] = useState<string | null>(null);
  const [selectedExistingSubject, setSelectedExistingSubject] = useState<string | null>(null);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classResponse, teacherResponse , subjectResponse] = await Promise.all([
        apiService.getClasses(),
        apiService.getTeachers(),
        apiService.getAllSubjects()
      ]);

      if (!classResponse.success) {
        throw new Error(classResponse.msg || 'Failed to fetch classes');
      }
      if (!teacherResponse.success) {
        throw new Error(teacherResponse.msg || 'Failed to fetch teachers');
      }
      if (!subjectResponse.success) {
        throw new Error(subjectResponse.msg || 'Failed to fetch subjects');
      }
      setClasses((classResponse.data as ClassItem[]) || []);
      setTeachers((teacherResponse.data as TeacherItem[]) || []);
      setSubjects((subjectResponse.data as Subject[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const [classResponse, teacherResponse, subjectResponse] = await Promise.all([
        apiService.getClasses(),
        apiService.getTeachers(),
        apiService.getAllSubjects()
      ]);

      if (!classResponse.success) {
        throw new Error(classResponse.msg || 'Failed to fetch classes');
      }
      if (!teacherResponse.success) {
        throw new Error(teacherResponse.msg || 'Failed to fetch teachers');
      }
      if (!subjectResponse.success) {
        throw new Error(subjectResponse.msg || 'Failed to fetch subjects');
      }
      setClasses((classResponse.data as ClassItem[]) || []);
      setTeachers((teacherResponse.data as TeacherItem[]) || []);
      setSubjects((subjectResponse.data as Subject[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setRefreshing(false);
    }
  };

  const teacherOptions: IdLabel[] = useMemo(
    () =>
      teachers
        .map((teacher) => ({ _id: teacher._id, name: teacher.user?.name || 'Unnamed teacher' }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [teachers]
  );

  const classOptions: IdLabel[] = useMemo(
    () =>
      classes
        .map((cls) => ({
          _id: cls._id,
          name: `${cls.name}${cls.section ? ` (${cls.section})` : ''}`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [classes]
  );

  const subjectOptions: IdLabel[] = useMemo(() => {
    const map = new Map<string, string>();

     subjects.forEach((subject) => {
        if (subject._id && subject.name) {
          map.set(subject._id, subject.name);
        }
      });
    return Array.from(map.entries()).map(([id, name]) => ({ _id: id, name }));
  }, [subjects]);

  const createClass = async () => {
    if (!newClassName.trim() || !newClassGrade.trim() || !newClassSection.trim()) {
      Alert.alert('Missing fields', 'Name, Grade and Section are required.');
      return; 
    }

    try {
      setSaving(true);
      const response = await apiService.createClass({
        name: newClassName.trim(),
        grade: newClassGrade.trim(),
        section: newClassSection.trim(),
        capacity: Number(newClassCapacity || '40'),
        room: newClassRoom.trim() || 'R001',
      });

      if (!response.success) {
        throw new Error(response.msg || 'Failed to create class');
      }

      setNewClassName('');
      setNewClassGrade('');
      setNewClassSection('');
      setNewClassCapacity('40');
      setNewClassRoom('R001');
      await fetchData();
      Alert.alert('Success', 'Class created successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create class');
    } finally {
      setSaving(false);
    }
  };

  const assignTeacher = async () => {
    if (!selectedClassForTeacher || !selectedTeacherForClass) {
      Alert.alert('Missing selection', 'Please select class and teacher.');
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.assignClassTeacher(selectedClassForTeacher, selectedTeacherForClass);
      if (!response.success) {
        throw new Error(response.msg || 'Failed to assign class teacher');
      }
      await fetchData();
      Alert.alert('Success', 'Teacher assigned to class.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to assign teacher');
    } finally {
      setSaving(false);
    }
  };

  const addSubjectInClass = async () => {
    if (!subjectName.trim() || !subjectCode.trim() || !selectedClassForSubject || !selectedTeacherForSubject) {
      Alert.alert('Missing fields', 'Subject name, code, class, and teacher are required.');
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.createSubject({
        name: subjectName.trim(),
        code: subjectCode.trim(),
        classId: selectedClassForSubject,
        teacherId: selectedTeacherForSubject,
        maxMarks: Number(subjectMaxMarks || '100'),
      });
      if (!response.success) {
        throw new Error(response.msg || 'Failed to create subject');
      }

      setSubjectName('');
      setSubjectCode('');
      setSubjectMaxMarks('100');
      await fetchData();
      Alert.alert('Success', 'Subject added in class.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add subject');
    } finally {
      setSaving(false);
    }
  };

  const assignExistingSubject = async () => {
    if (!selectedClassForExistingSubject || !selectedExistingSubject) {
      Alert.alert('Missing selection', 'Please select class and subject.');
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.assignSubjectToClass(
        selectedExistingSubject,
        selectedClassForExistingSubject
      );
      if (!response.success) {
        throw new Error(response.msg || 'Failed to assign subject to class');
      }
      await fetchData();
      Alert.alert('Success', 'Subject assigned to class.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to assign subject');
    } finally {
      setSaving(false);
    }
  };

  const renderPicker = (
    options: IdLabel[],
    value: string | null,
    onPick: (id: string) => void
  ) => (
    <View style={styles.chipsWrap}>
      {options.length === 0 ? (
        <ThemedText style={styles.mutedText}>No options found</ThemedText>
      ) : (
        options.map((option) => (
          <Pressable
            key={option._id}
            onPress={() => onPick(option._id)}
            style={[
              styles.chip,
              {
                borderColor: theme.icon,
                backgroundColor: value === option._id ? theme.tint : theme.background,
              },
            ]}>
            <ThemedText
              style={{
                color: value === option._id ? '#fff' : theme.text,
                fontSize: 12,
                fontWeight: '600',
              }}>
              {option.name}
            </ThemedText>
          </Pressable>
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.tint}
        />
      }>

      {error ? (
        <ThemedView style={styles.errorBox}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      ) : null}

      {isAdmin ? (
        <>
          <ThemedView style={[styles.section, { borderColor: theme.icon }]}> 
            <ThemedText type="subtitle">Add New Class</ThemedText>
            <ThemedText style={styles.inputLabel}>Class Name</ThemedText>
            <TextInput placeholder="Class Name" placeholderTextColor="#8c8c8c" style={styles.input} value={newClassName} onChangeText={setNewClassName} />
            <ThemedText style={styles.inputLabel}>Grade</ThemedText>
            <TextInput placeholder="Grade" placeholderTextColor="#8c8c8c" style={styles.input} value={newClassGrade} onChangeText={setNewClassGrade} />
            <ThemedText style={styles.inputLabel}>Section</ThemedText>
            <TextInput placeholder="Section" placeholderTextColor="#8c8c8c" style={styles.input} value={newClassSection} onChangeText={setNewClassSection} />
            <ThemedText style={styles.inputLabel}>Capacity</ThemedText>
            <TextInput placeholder="Capacity" placeholderTextColor="#8c8c8c" style={styles.input} keyboardType="numeric" value={newClassCapacity} onChangeText={setNewClassCapacity} />
            <ThemedText style={styles.inputLabel}>Room</ThemedText>
            <TextInput placeholder="Room" placeholderTextColor="#8c8c8c" style={styles.input} value={newClassRoom} onChangeText={setNewClassRoom} />
            <Pressable style={[styles.actionButton, { backgroundColor: theme.tint }]} onPress={createClass} disabled={saving}>
              <ThemedText style={styles.actionText}>{saving ? 'Saving...' : 'Create Class'}</ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={[styles.section, { borderColor: theme.icon }]}> 
            <ThemedText type="subtitle">Assign Teacher to Class</ThemedText>
            <ThemedText style={styles.label}>Select Class</ThemedText>
            {renderPicker(classOptions, selectedClassForTeacher, setSelectedClassForTeacher)}
            <ThemedText style={styles.label}>Select Teacher</ThemedText>
            {renderPicker(teacherOptions, selectedTeacherForClass, setSelectedTeacherForClass)}
            <Pressable style={[styles.actionButton, { backgroundColor: '#2e7d32' }]} onPress={assignTeacher} disabled={saving}>
              <ThemedText style={styles.actionText}>{saving ? 'Saving...' : 'Assign Teacher'}</ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={[styles.section, { borderColor: theme.icon }]}> 
            <ThemedText type="subtitle">Add Subject in Class</ThemedText>
            <ThemedText style={styles.inputLabel}>Subject Name</ThemedText>
            <TextInput placeholder="Subject Name" placeholderTextColor="#8c8c8c" style={styles.input} value={subjectName} onChangeText={setSubjectName} />
            <ThemedText style={styles.inputLabel}>Subject Code</ThemedText>
            <TextInput placeholder="Subject Code" placeholderTextColor="#8c8c8c" style={styles.input} value={subjectCode} onChangeText={setSubjectCode} />
            <ThemedText style={styles.inputLabel}>Maximum Marks</ThemedText>
            <TextInput placeholder="Max Marks" placeholderTextColor="#8c8c8c" style={styles.input} keyboardType="numeric" value={subjectMaxMarks} onChangeText={setSubjectMaxMarks} />
            <ThemedText style={styles.label}>Select Class</ThemedText>
            {renderPicker(classOptions, selectedClassForSubject, setSelectedClassForSubject)}
            <ThemedText style={styles.label}>Select Teacher</ThemedText>
            {renderPicker(teacherOptions, selectedTeacherForSubject, setSelectedTeacherForSubject)}
            <Pressable style={[styles.actionButton, { backgroundColor: '#1565c0' }]} onPress={addSubjectInClass} disabled={saving}>
              <ThemedText style={styles.actionText}>{saving ? 'Saving...' : 'Add Subject'}</ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={[styles.section, { borderColor: theme.icon }]}> 
            <ThemedText type="subtitle">Assign Existing Subject to Class</ThemedText>
            <ThemedText style={styles.label}>Select Subject</ThemedText>
            {renderPicker(subjectOptions, selectedExistingSubject, setSelectedExistingSubject)}
            <ThemedText style={styles.label}>Select Class</ThemedText>
            {renderPicker(classOptions, selectedClassForExistingSubject, setSelectedClassForExistingSubject)}
            <Pressable style={[styles.actionButton, { backgroundColor: '#6a1b9a' }]} onPress={assignExistingSubject} disabled={saving}>
              <ThemedText style={styles.actionText}>{saving ? 'Saving...' : 'Assign Subject'}</ThemedText>
            </Pressable>
          </ThemedView>
        </>
      ) : null}

      <ThemedView style={[styles.section, { borderColor: theme.icon }]}> 
        <ThemedText type="subtitle">All Classes</ThemedText>
        {classes.length === 0 ? (
          <ThemedText style={styles.mutedText}>No classes found</ThemedText>
        ) : (
          <FlatList
            data={classes}
            horizontal={true}
            keyExtractor={(cls) => cls._id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.classListContainer}
            renderItem={({ item: cls }) => (
              <Pressable
                onPress={() => router.push(`/class-details/${cls._id}`)}
                style={[styles.classCard, { borderColor: theme.icon, backgroundColor: theme.background }]}>
                <ThemedText type="defaultSemiBold">{cls.name}{cls.section ? ` (${cls.section})` : ''}</ThemedText>
                <ThemedText style={styles.mutedText}>Grade: {cls.grade || 'N/A'} | Room: {cls.room || 'N/A'}</ThemedText>
                <ThemedText style={styles.mutedText}>Students: {cls.studentCount || 0}</ThemedText>
                <ThemedText style={styles.mutedText}>
                  Teacher: {cls.classTeacher?.user?.name || 'Not assigned'}
                </ThemedText>
                <ThemedText style={styles.mutedText}>
                  Subjects: {(cls.subjects || []).map((s) => s.name).filter(Boolean).join(', ') || 'None'}
                </ThemedText>
              </Pressable>
            )}
          />
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    marginTop: 6,
    opacity: 0.75,
    marginBottom: 4,
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#c9c9c9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111',
    backgroundColor: '#fff',
    fontSize: 14,
  },
  actionButton: {
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.8,
    marginTop: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.8,
    marginTop: 4,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  classListContainer: {
    paddingRight: 16,
    gap: 10,
  },
  classCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    width: 280,
    minWidth: 280,
    gap: 4,
  },
  mutedText: {
    fontSize: 12,
    opacity: 0.75,
  },
  errorBox: {
    borderRadius: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
  },
  errorText: {
    color: '#ff6b6b',
  },
});
