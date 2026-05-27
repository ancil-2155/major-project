import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppBackButton from '../components/common/AppBackButton';

const AttendanceScreen = ({ navigation }: any) => {
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState('1');
  const [semester, setSemester] = useState('1');
  const [subject, setSubject] = useState('Maths');

  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showSemPicker, setShowSemPicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  const departments = ['CSE', 'ECE', 'ME', 'CIVIL'];
  const years = ['1', '2', '3', '4'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const subjects = ['Maths', 'Data Structures', 'Networking', 'Operating Systems', 'AI', 'Machine Learning'];

  const handleStartCamera = () => {
    // Pass the selected filters to the TakeAttendance screen so it knows exactly
    // which student embeddings to download and what subject to mark them present for.
    navigation.navigate('TakeAttendance', {
      filters: {
        department,
        year,
        semester,
        subject,
      }
    });
  };

  const renderPickerModal = (
    visible: boolean,
    setVisible: Function,
    options: string[],
    selectedValue: string,
    setSelectedValue: Function,
    title: string
  ) => (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select {title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.modalOption, selectedValue === opt && styles.modalOptionActive]}
                onPress={() => {
                  setSelectedValue(opt);
                  setVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, selectedValue === opt && styles.modalTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setVisible(false)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      <ScrollView style={styles.container}>
        <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header}>
          <View style={styles.headerTop}>
            <AppBackButton navigation={navigation} fallbackRoute="StudentHome" />
            <View style={{ width: 44 }} />
          </View>
          <Text style={styles.headerTitle}>Live Attendance</Text>
          <Text style={styles.headerSubtitle}>Set up the class before starting the scanner</Text>
        </LinearGradient>

        <View style={styles.content}>
          
          <Text style={styles.sectionLabel}>Select Department</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowDeptPicker(true)}>
            <Text style={styles.dropdownText}>{department}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Select Year</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowYearPicker(true)}>
            <Text style={styles.dropdownText}>Year {year}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Select Semester</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowSemPicker(true)}>
            <Text style={styles.dropdownText}>Semester {semester}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Select Subject</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowSubjectPicker(true)}>
            <Text style={styles.dropdownText}>{subject}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startButton} onPress={handleStartCamera} activeOpacity={0.8}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.startGradient}>
              <Text style={styles.startButtonText}>📷 Start Camera Scanner</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.helperText}>
            The AI will only download face profiles for students in the selected Department and Year to ensure instant scanning speed.
          </Text>

        </View>

        {renderPickerModal(showDeptPicker, setShowDeptPicker, departments, department, setDepartment, 'Department')}
        {renderPickerModal(showYearPicker, setShowYearPicker, years, year, setYear, 'Year')}
        {renderPickerModal(showSemPicker, setShowSemPicker, semesters, semester, setSemester, 'Semester')}
        {renderPickerModal(showSubjectPicker, setShowSubjectPicker, subjects, subject, setSubject, 'Subject')}

      </ScrollView>
    </>
  );
};

export default AttendanceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 30, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, paddingTop: 60 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  headerSubtitle: { color: '#E0E7FF', textAlign: 'center', marginTop: 8 },
  content: { padding: 20, marginTop: 10 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8, marginTop: 16 },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  dropdownText: { fontSize: 16, color: '#111827', fontWeight: '500' },
  dropdownIcon: { color: '#6B7280' },
  startButton: { marginTop: 40, borderRadius: 15, overflow: 'hidden', elevation: 4 },
  startGradient: { padding: 18, alignItems: 'center' },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  helperText: { textAlign: 'center', color: '#6B7280', fontSize: 12, marginTop: 20, paddingHorizontal: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalOptionActive: { backgroundColor: '#ECFDF5' },
  modalOptionText: { fontSize: 16, textAlign: 'center', color: '#374151' },
  modalTextActive: { color: '#10B981', fontWeight: 'bold' },
  modalCloseBtn: { marginTop: 16, padding: 14, backgroundColor: '#F3F4F6', borderRadius: 12 },
  modalCloseText: { textAlign: 'center', fontWeight: 'bold', color: '#374151' },
});
