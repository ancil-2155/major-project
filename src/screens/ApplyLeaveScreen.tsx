import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { getApprovedTeachersForStudent, TeacherOption } from '../services/student/teacherSelectionService';
import AppBackButton from '../components/common/AppBackButton';
import { useAppTheme } from '../theme/appTheme';

const toDateKey = (date: Date) => date.toISOString().split('T')[0];
const todayKey = toDateKey(new Date());

const formatHumanDate = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const buildMarkedRange = (startDate: string, endDate: string, primaryColor: string = '#2563EB') => {
  const marked: Record<string, any> = {};
  if (!startDate) {
    return marked;
  }

  if (!endDate || startDate === endDate) {
    marked[startDate] = {
      selected: true,
      startingDay: true,
      endingDay: true,
      color: primaryColor,
      textColor: '#FFFFFF',
    };
    return marked;
  }

  let cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  while (cursor <= end) {
    const key = toDateKey(cursor);
    const isStart = key === startDate;
    const isEnd = key === endDate;
    marked[key] = {
      selected: true,
      startingDay: isStart,
      endingDay: isEnd,
      color: primaryColor,
      textColor: '#FFFFFF',
    };
    cursor.setDate(cursor.getDate() + 1);
  }

  return marked;
};

const calculateTotalDays = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) {
    return 0;
  }
  const from = new Date(`${startDate}T00:00:00`);
  const to = new Date(`${endDate}T00:00:00`);
  const diff = Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
  return diff + 1;
};

const ApplyLeaveScreen = ({ navigation }: any) => {
  const { colors, isDark } = useAppTheme();
  const [reason, setReason] = useState('');
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherOption | null>(null);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teacherModalVisible, setTeacherModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [leaveType, setLeaveType] = useState('Sick Leave');
  const [halfDay, setHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState('First Half');
  const [userData, setUserData] = useState<any>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const user = auth().currentUser;
        if (!user) {
          return;
        }

        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const profile = userDoc.data();
        setUserData(profile);

        setLoadingTeachers(true);
        const teacherList = await getApprovedTeachersForStudent(profile);
        setTeachers(teacherList);
      } catch (error) {
        console.log('Error fetching teachers:', error);
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchInitialData();
  }, []);

  const totalDays = useMemo(() => calculateTotalDays(fromDate, toDate), [fromDate, toDate]);
  const canUseHalfDay = Boolean(fromDate && toDate && fromDate === toDate);
  const markedDates = useMemo(() => buildMarkedRange(fromDate, toDate, colors.primary), [fromDate, toDate, colors.primary]);

  const handleCalendarDayPress = (day: DateData) => {
    const selected = day.dateString;

    if (!fromDate || (fromDate && toDate)) {
      setFromDate(selected);
      setToDate('');
      return;
    }

    if (selected < fromDate) {
      setFromDate(selected);
      setToDate('');
      return;
    }

    setToDate(selected);
    if (selected !== fromDate && halfDay) {
      setHalfDay(false);
    }
  };

  const handleHalfDayToggle = () => {
    if (!canUseHalfDay) {
      Alert.alert('Half Day Rule', 'Half-day leave is allowed only for a single selected date.');
      return;
    }
    setHalfDay(prev => !prev);
  };

  const isRangeValid = Boolean(fromDate && toDate && toDate >= fromDate);
  const isSubmitEnabled = isRangeValid && reason.trim().length > 0 && Boolean(selectedTeacher);

  const submitLeave = async () => {
    const user = auth().currentUser;
    if (!user || !selectedTeacher) {
      Alert.alert('Error', 'Please select a teacher.');
      return;
    }

    if (!isRangeValid || !reason.trim()) {
      Alert.alert('Error', 'Please select a valid date range and enter reason.');
      return;
    }

    const payload = {
      studentId: user.uid,
      studentName: userData?.name || 'Unknown',
      studentEmail: userData?.email || user.email || 'Unknown',
      rollNo: userData?.rollNo || '',
      department: userData?.department || '',
      year: userData?.year || '',
      semester: userData?.semester || '',
      teacherId: selectedTeacher.uid,
      teacherName: selectedTeacher.name,
      teacherEmail: selectedTeacher.email,
      teacherDepartment: selectedTeacher.department || '',
      fromDate,
      toDate,
      totalDays,
      isHalfDay: halfDay,
      halfDaySession: halfDay ? halfDaySession : '',
      reason: reason.trim(),
      leaveType,
      status: 'pending',
      signatureAttached: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      requestedAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    try {
      await firestore().collection('leave_requests').add(payload);
      Alert.alert('Success', 'Leave applied successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      setReason('');
      setFromDate('');
      setToDate('');
      setHalfDay(false);
      setHalfDaySession('First Half');
      setLeaveType('Sick Leave');
      setSelectedTeacher(null);
    } catch (error: any) {
      Alert.alert('Error', `Failed to submit leave request: ${error.message}`);
    }
  };

  const leaveTypes = ['Sick Leave', 'Casual Leave', 'Emergency Leave', 'Study Leave', 'Other'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <AppBackButton navigation={navigation} fallbackRoute="StudentHome" />
          <View style={styles.headerSpacer} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Apply for Leave</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Choose date range and submit request</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Leave Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeContainer}>
          {leaveTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.typeButton, leaveType === type && styles.typeButtonActive]}
              onPress={() => setLeaveType(type)}
            >
              <Text style={[styles.typeText, leaveType === type && styles.typeTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.checkboxContainer} onPress={handleHalfDayToggle}>
          <View style={[styles.checkbox, halfDay && styles.checkboxChecked]}>
            {halfDay ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>Half Day Leave</Text>
        </TouchableOpacity>

        {halfDay ? (
          <View style={styles.halfDayContainer}>
            <TouchableOpacity
              style={[styles.sessionButton, halfDaySession === 'First Half' && styles.sessionActive]}
              onPress={() => setHalfDaySession('First Half')}
            >
              <Text style={styles.sessionText}>First Half</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sessionButton, halfDaySession === 'Second Half' && styles.sessionActive]}
              onPress={() => setHalfDaySession('Second Half')}
            >
              <Text style={styles.sessionText}>Second Half</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Date Range</Text>
        <TouchableOpacity style={[styles.dateCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setCalendarVisible(true)}>
          <Text style={[styles.dateCardTitle, { color: colors.text }]}>Select Date Range</Text>
          <Text style={[styles.dateLine, { color: colors.textSecondary }]}>
            From: {fromDate ? formatHumanDate(fromDate) : 'Not selected'}
          </Text>
          <Text style={[styles.dateLine, { color: colors.textSecondary }]}>To: {toDate ? formatHumanDate(toDate) : 'Not selected'}</Text>
          <Text style={[styles.totalDays, { color: colors.primary }]}>Total Days: {totalDays || 0}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Reason for Leave</Text>
        <TextInput
          placeholder="Please provide detailed reason..."
          placeholderTextColor={colors.textSecondary}
          value={reason}
          onChangeText={setReason}
          style={styles.reasonInput}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          Select Teacher {selectedTeacher ? `✓ ${selectedTeacher.name}` : ''}
        </Text>
        <TouchableOpacity
          style={styles.teacherSelector}
          onPress={() => setTeacherModalVisible(true)}
          disabled={loadingTeachers}
        >
          {loadingTeachers ? (
            <Text style={styles.placeholderText}>Loading teachers...</Text>
          ) : (
            <>
              <Text style={selectedTeacher ? styles.selectedTeacherText : styles.placeholderText}>
                {selectedTeacher ? selectedTeacher.displayName : 'Tap to select a teacher'}
              </Text>
              <Text style={styles.arrow}>▼</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, !isSubmitEnabled && styles.buttonDisabled]}
        onPress={submitLeave}
        disabled={!isSubmitEnabled}
      >
        <Text style={styles.buttonText}>Submit Leave Request</Text>
      </TouchableOpacity>

      <View style={styles.infoNote}>
        <Text style={styles.infoText}>
          Your leave request will be sent to the selected teacher for approval.
        </Text>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={teacherModalVisible}
        onRequestClose={() => setTeacherModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Teacher</Text>
              <TouchableOpacity onPress={() => setTeacherModalVisible(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={teachers}
              keyExtractor={item => item.uid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalTeacherCard,
                    selectedTeacher?.uid === item.uid && styles.modalTeacherSelected,
                  ]}
                  onPress={() => {
                    setSelectedTeacher(item);
                    setTeacherModalVisible(false);
                  }}
                >
                  <View>
                    <Text style={styles.teacherName}>{item.name}</Text>
                    <Text style={styles.teacherDept}>
                      {item.department || 'Teacher'}{' '}
                      {item.yearIncharge ? `· Year Incharge: ${item.yearIncharge}` : ''}
                    </Text>
                    <Text style={styles.teacherEmail}>{item.email}</Text>
                  </View>
                  {selectedTeacher?.uid === item.uid ? <Text style={styles.checkIcon}>✓</Text> : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No approved teachers found. Please contact admin.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={calendarVisible}
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Leave Date Range</Text>
              <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>
            <Calendar
              markingType="period"
              markedDates={markedDates}
              minDate={todayKey}
              onDayPress={handleCalendarDayPress}
              theme={{
                selectedDayBackgroundColor: '#2563EB',
                todayTextColor: '#2563EB',
                arrowColor: '#2563EB',
                textMonthFontWeight: '700',
                textDayFontWeight: '500',
              }}
            />
            <View style={styles.calendarFooter}>
              <Text style={styles.calendarHint}>
                Tap once for start date, tap again for end date.
              </Text>
              <TouchableOpacity style={styles.doneButton} onPress={() => setCalendarVisible(false)}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ApplyLeaveScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#2563EB',
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerSpacer: { width: 44 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#DBEAFE', marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  typeContainer: { flexDirection: 'row' },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeButtonActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  typeText: { color: '#6B7280', fontWeight: '500' },
  typeTextActive: { color: '#FFFFFF' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  checkmark: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  checkboxLabel: { fontSize: 16, color: '#374151' },
  halfDayContainer: { flexDirection: 'row', marginTop: 12, gap: 12 },
  sessionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessionActive: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  sessionText: { color: '#374151', fontWeight: '500' },
  dateCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  dateCardTitle: { color: '#111827', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  dateLine: { color: '#6B7280', fontSize: 14, marginBottom: 2 },
  totalDays: { marginTop: 8, color: '#2563EB', fontSize: 14, fontWeight: '700' },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    minHeight: 100,
  },
  teacherSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  placeholderText: { color: '#9CA3AF', fontSize: 14 },
  selectedTeacherText: { color: '#111827', fontSize: 14, fontWeight: '500' },
  arrow: { color: '#6B7280', fontSize: 12 },
  button: {
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
    elevation: 0,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  infoNote: {
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
  },
  infoText: { color: '#92400E', fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  calendarContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  closeButton: { fontSize: 24, color: '#6B7280' },
  modalTeacherCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTeacherSelected: { backgroundColor: '#DBEAFE' },
  teacherName: { fontSize: 16, fontWeight: '500', color: '#111827' },
  teacherDept: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  teacherEmail: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  checkIcon: { fontSize: 20, color: '#2563EB', fontWeight: '700' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#6B7280' },
  calendarFooter: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  calendarHint: { fontSize: 12, color: '#6B7280', marginBottom: 10 },
  doneButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneButtonText: { color: '#FFFFFF', fontWeight: '700' },
});
