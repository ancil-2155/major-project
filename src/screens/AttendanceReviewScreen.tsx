import React, { useMemo, useState } from 'react';
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
import { StudentProfile } from '../types/academic';
import { createAttendanceSession, submitAttendanceSession } from '../services/attendance/attendanceSessionService';

const AttendanceReviewScreen = ({ route, navigation }: any) => {
  const { filter, classConfig, students, teacherId, teacherName, initialRecords } = route.params;

  const [records, setRecords] = useState<Record<string, AttendanceRecord>>(initialRecords || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSessionId, setSubmittedSessionId] = useState<string | null>(null);

  const dateKey = useMemo(() => new Date().toISOString().split('T')[0], []);

  const buildDefaultAbsentRecord = (student: StudentProfile): AttendanceRecord => ({
    studentId: student.uid,
    studentName: student.name,
    rollNo: student.rollNo || undefined,
    department: filter.department,
    year: filter.year,
    semester: filter.semester,
    subject: filter.subject,
    date: dateKey,
    status: 'absent',
    markedBy: teacherId,
    teacherName,
    method: 'manual',
    matchScore: null,
    markedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const getRecordForStudent = (student: StudentProfile): AttendanceRecord =>
    records[student.uid] || buildDefaultAbsentRecord(student);

  const toggleStatus = (uid: string) => {
    setRecords(prev => {
      const current = prev[uid];
      if (!current) {
        return prev;
      }
      const newStatus = current.status === 'present' ? 'absent' : 'present';
      return {
        ...prev,
        [uid]: {
          ...current,
          status: newStatus,
          method: 'manual',
          matchScore: newStatus === 'present' ? current.matchScore ?? null : null,
          updatedAt: new Date(),
        },
      };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const recordArray: AttendanceRecord[] = students.map((student: StudentProfile) => {
        const existing = records[student.uid];
        if (existing) {
          return {
            ...existing,
            teacherName,
            date: existing.date || dateKey,
            markedBy: existing.markedBy || teacherId,
            method: existing.method || 'manual',
            matchScore: existing.matchScore ?? null,
          };
        }
        return buildDefaultAbsentRecord(student);
      });
      const totalStudents = recordArray.length;
      const totalPresent = recordArray.filter(r => r.status === 'present').length;
      const totalAbsent = totalStudents - totalPresent;

      // 1. Create the session document
      const sessionId = await createAttendanceSession(
        teacherId,
        teacherName,
        filter,
        totalStudents,
        classConfig
      );

      // 2. Batch write all records
      await submitAttendanceSession(
              sessionId,
              {
                teacherId,
                teacherName,
                totalPresent,
                totalAbsent,
                status: 'submitted',
              },
        recordArray
      );

      Alert.alert('Success', 'Attendance submitted successfully!');
      setSubmittedSessionId(sessionId);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit attendance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presentCount = students.filter((student: StudentProfile) => {
    const record = records[student.uid];
    return record?.status === 'present';
  }).length;

  if (submittedSessionId) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.header}>
          <Text style={styles.headerTitle}>Attendance Saved ✅</Text>
          <Text style={styles.headerSubtitle}>{filter.subject} - {filter.department} Yr {filter.year}</Text>
        </LinearGradient>

        <View style={styles.exportContainer}>
          <Text style={styles.exportTitle}>Export Options</Text>
          <Text style={styles.exportSubtitle}>Share or print this attendance session.</Text>

          <TouchableOpacity style={styles.exportBtn} onPress={async () => {
            const { exportAttendanceToCSV, shareAttendanceFile } = await import('../services/attendance/attendanceExportService');
            try {
              const path = await exportAttendanceToCSV(submittedSessionId);
              await shareAttendanceFile(path, 'text/csv');
            } catch (e: any) { Alert.alert('Export Error', e.message); }
          }}>
            <Text style={styles.exportBtnText}>📄 Export CSV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportBtn} onPress={async () => {
            const { exportAttendanceToXLSX, shareAttendanceFile } = await import('../services/attendance/attendanceExportService');
            try {
              const path = await exportAttendanceToXLSX(submittedSessionId);
              await shareAttendanceFile(path, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            } catch (e: any) { Alert.alert('Export Error', e.message); }
          }}>
            <Text style={styles.exportBtnText}>📊 Export Excel (XLSX)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportBtn} onPress={async () => {
            const { exportAttendanceToPDF, shareAttendanceFile } = await import('../services/attendance/attendanceExportService');
            try {
              const path = await exportAttendanceToPDF(submittedSessionId);
              await shareAttendanceFile(path, 'application/pdf');
            } catch (e: any) { Alert.alert('Export Error', e.message); }
          }}>
            <Text style={styles.exportBtnText}>📕 Export PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportBtn} onPress={async () => {
            const { printAttendancePDF } = await import('../services/attendance/attendanceExportService');
            try {
              await printAttendancePDF(submittedSessionId);
            } catch (e: any) { Alert.alert('Print Error', e.message); }
          }}>
            <Text style={styles.exportBtnText}>🖨️ Print Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitBtn, { marginTop: 30 }]} 
            onPress={() => navigation.navigate('TeacherHome')}
          >
            <Text style={styles.submitBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        {students.map((student: StudentProfile) => {
          const record = getRecordForStudent(student);

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
                  onPress={() => {
                    if (records[student.uid]) {
                      toggleStatus(student.uid);
                      return;
                    }
                    setRecords(prev => ({
                      ...prev,
                      [student.uid]: {
                        ...buildDefaultAbsentRecord(student),
                        status: 'present',
                        method: 'manual',
                        updatedAt: new Date(),
                      },
                    }));
                  }}
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
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backBtnText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
  
  exportContainer: { padding: 20, flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: 20 },
  exportTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  exportSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  exportBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportBtnText: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
});
