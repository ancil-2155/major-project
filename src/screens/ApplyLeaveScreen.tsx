import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
  ScrollView,
  Modal,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const ApplyLeaveScreen = () => {
  const [reason, setReason] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState('Sick Leave');
  const [halfDay, setHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState('First Half');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const snapshot = await firestore()
      .collection('users')
      .where('role', '==', 'teacher')
      .get();

    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setTeachers(list);
  };

  const submitLeave = async () => {
    const user = auth().currentUser;

    if (!user || !selectedTeacher) {
      Alert.alert('Error', 'Fill all fields');
      return;
    }

    if (!fromDate || !toDate || !reason) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const userDoc = await firestore()
      .collection('users')
      .doc(user.uid)
      .get();

    const data = userDoc.data();

    await firestore().collection('leave_requests').add({
      studentId: user.uid,
      studentName: data?.name,
      rollNo: data?.rollNo,
      department: data?.department,
      year: data?.year,

      teacherId: selectedTeacher.id,
      teacherName: selectedTeacher.name,

      fromDate,
      toDate,
      reason,
      leaveType,
      halfDay,
      halfDaySession: halfDay ? halfDaySession : null,

      status: 'pending',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    Alert.alert('Success', 'Leave applied successfully');
    setReason('');
    setFromDate('');
    setToDate('');
    setLeaveType('Sick Leave');
    setHalfDay(false);
    setSelectedTeacher(null);
  };

  const leaveTypes = ['Sick Leave', 'Casual Leave', 'Emergency Leave', 'Study Leave', 'Other'];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Apply for Leave</Text>
        <Text style={styles.subtitle}>Fill in the details below</Text>
      </View>

      {/* Leave Type Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Leave Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeContainer}>
          {leaveTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                leaveType === type && styles.typeButtonActive,
              ]}
              onPress={() => setLeaveType(type)}
            >
              <Text
                style={[
                  styles.typeText,
                  leaveType === type && styles.typeTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Half Day Option */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setHalfDay(!halfDay)}
        >
          <View style={[styles.checkbox, halfDay && styles.checkboxChecked]}>
            {halfDay && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Half Day Leave</Text>
        </TouchableOpacity>

        {halfDay && (
          <View style={styles.halfDayContainer}>
            <TouchableOpacity
              style={[
                styles.sessionButton,
                halfDaySession === 'First Half' && styles.sessionActive,
              ]}
              onPress={() => setHalfDaySession('First Half')}
            >
              <Text style={styles.sessionText}>First Half</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sessionButton,
                halfDaySession === 'Second Half' && styles.sessionActive,
              ]}
              onPress={() => setHalfDaySession('Second Half')}
            >
              <Text style={styles.sessionText}>Second Half</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Date Inputs */}
      <View style={styles.section}>
        <Text style={styles.label}>Date Range</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>From</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={fromDate}
              onChangeText={setFromDate}
              style={styles.dateInput}
            />
          </View>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>To</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={toDate}
              onChangeText={setToDate}
              style={styles.dateInput}
            />
          </View>
        </View>
      </View>

      {/* Reason Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Reason for Leave</Text>
        <TextInput
          placeholder="Please provide detailed reason..."
          placeholderTextColor="#9CA3AF"
          value={reason}
          onChangeText={setReason}
          style={styles.reasonInput}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Teacher Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>
          Select Teacher {selectedTeacher && `✓ ${selectedTeacher.name}`}
        </Text>
        
        <TouchableOpacity 
          style={styles.teacherSelector}
          onPress={() => setModalVisible(true)}
        >
          <Text style={selectedTeacher ? styles.selectedTeacherText : styles.placeholderText}>
            {selectedTeacher ? selectedTeacher.name : 'Tap to select a teacher'}
          </Text>
          <Text style={styles.arrow}>▼</Text>
        </TouchableOpacity>

        {/* Teacher Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Teacher</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={teachers}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalTeacherCard,
                      selectedTeacher?.id === item.id && styles.modalTeacherSelected,
                    ]}
                    onPress={() => {
                      setSelectedTeacher(item);
                      setModalVisible(false);
                    }}
                  >
                    <View>
                      <Text style={styles.teacherName}>{item.name}</Text>
                      <Text style={styles.teacherDept}>{item.department || 'Teacher'}</Text>
                    </View>
                    {selectedTeacher?.id === item.id && (
                      <Text style={styles.checkIcon}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No teachers found</Text>
                }
              />
            </View>
          </View>
        </Modal>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.button} onPress={submitLeave}>
        <Text style={styles.buttonText}>Submit Leave Request</Text>
      </TouchableOpacity>

      {/* Info Note */}
      <View style={styles.infoNote}>
        <Text style={styles.infoText}>
          ⓘ Your leave request will be sent to the selected teacher for approval
        </Text>
      </View>
    </ScrollView>
  );
};

export default ApplyLeaveScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#2563EB',
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#DBEAFE',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
  },
  halfDayContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  sessionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessionActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  sessionText: {
    color: '#374151',
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },
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
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  selectedTeacherText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  arrow: {
    color: '#6B7280',
    fontSize: 12,
  },
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalTeacherCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTeacherSelected: {
    backgroundColor: '#DBEAFE',
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  teacherDept: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkIcon: {
    fontSize: 20,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    padding: 40,
    color: '#6B7280',
  },
  button: {
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  infoNote: {
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
  },
  infoText: {
    color: '#92400E',
    fontSize: 12,
  },
});