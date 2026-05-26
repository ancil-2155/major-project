import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AttendanceRecord } from '../types/attendance';
import { ClassStudent } from '../services/attendance/faceMatchingService';
import { createAttendanceSession, submitAttendanceSession } from '../services/attendance/attendanceSessionService';

const AttendanceReviewScreen = ({ route, navigation }: any) => {
  const { filter, students, teacherId, teacherName, initialRecords } = route.params;

  const [records, setRecords] = useState<Record<string, AttendanceRecord>>(initialRecords || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize absent records for students who weren't marked present
  useEffect(() => {
    const initializedRecords = { ...initialRecords };
    let hasChanges = false;

    students.forEach((student: ClassStudent) => {
      if (!initializedRecords[student.uid]) {
        initializedRecords[student.uid] = {
          studentId: student.uid,
          studentName: student.name,
          rollNo: student.rollNo,
          department: filter.department,
          year: filter.year,
          semester: filter.semester,
          subject: filter.subject,
          status: 'absent',
          markedBy: teacherId,
          method: 'manual_teacher',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setRecords(initializedRecords);
    }
  }, [students, initialRecords, filter, teacherId]);

  const toggleStatus = (uid: string) => {
    setRecords(prev => {
      const current = prev[uid];
      const newStatus = current.status === 'present' ? 'absent' : 'present';
      return {
        ...prev,
        [uid]: {
          ...current,
          status: newStatus,
          method: 'manual_teacher', // mark that it was overridden manually
          updatedAt: new Date(),
        },
      };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const recordArray = Object.values(records);
      const totalStudents = recordArray.length;
      const totalPresent = recordArray.filter(r => r.status === 'present').length;
      const totalAbsent = totalStudents - totalPresent;

      // 1. Create the session document
      const sessionId = await createAttendanceSession(
        teacherId,
        teacherName,
        filter,
        totalStudents
      );

      // 2. Batch write all records
      await submitAttendanceSession(
        sessionId,
        {
          totalPresent,
          totalAbsent,
          status: 'submitted',
        },
        recordArray
      );

      Alert.alert('Success', 'Attendance submitted successfully!');
      navigation.navigate('TeacherHome');

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit attendance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presentCount = Object.values(records).filter(r => r.status === 'present').length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.header}>
        <Text style={styles.headerTitle}>Review Attendance</Text>
        <Text style={styles.headerSubtitle}>{filter.subject} - {filter.department} Yr {filter.year}</Text>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{students.length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Present</Text>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{presentCount}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Absent</Text>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{students.length - presentCount}</Text>
        </View>
      </View>

      <ScrollView style={styles.list}>
        {students.map((student: ClassStudent) => {
          const record = records[student.uid];
          if (!record) return null;

          const isPresent = record.status === 'present';

          return (
            <View key={student.uid} style={styles.listItem}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                {student.rollNo && <Text style={styles.rollNo}>Roll No: {student.rollNo}</Text>}
                {record.method === 'face_auto' && isPresent && (
                  <Text style={styles.autoTag}>Auto-detected</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.toggleBtn, isPresent ? styles.btnPresent : styles.btnAbsent]}
                onPress={() => toggleStatus(student.uid)}
              >
                <Text style={styles.toggleBtnText}>
                  {isPresent ? 'PRESENT' : 'ABSENT'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Attendance</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.backBtnText}>Back to Scanner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AttendanceReviewScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#DBEAFE', marginTop: 4 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: -20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginTop: 4 },
  list: { padding: 15, marginTop: 10 },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  rollNo: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  autoTag: { fontSize: 10, color: '#10B981', fontWeight: 'bold', marginTop: 4 },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  btnPresent: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#10B981' },
  btnAbsent: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#EF4444' },
  toggleBtnText: { fontWeight: 'bold', color: '#374151', fontSize: 12 },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#E5E7EB' },
  submitBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backBtn: {
    marginTop: 15,
    alignItems: 'center',
  },
  backBtnText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
});
