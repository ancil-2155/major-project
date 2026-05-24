import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';

const AdminAttendanceScreen = () => {
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState('1');
  const [semester, setSemester] = useState('1');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showSemPicker, setShowSemPicker] = useState(false);

  const departments = ['CSE', 'ECE', 'ME', 'CIVIL'];
  const years = ['1', '2', '3', '4'];
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  useEffect(() => {
    fetchAttendance();
  }, [department, year, semester]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      // Assuming 'attendance' collection stores daily/course records
      // This query can be expanded based on exact attendance structure
      const snapshot = await firestore()
        .collection('attendance')
        .where('department', '==', department)
        .where('year', '==', year)
        .where('semester', '==', semester)
        .orderBy('date', 'desc')
        .get();

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecords(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
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
          <ScrollView>
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
    <View style={styles.container}>
      <LinearGradient colors={['#10B981', '#059669']} style={styles.header}>
        <Text style={styles.title}>Attendance Reports</Text>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterBox} onPress={() => setShowDeptPicker(true)}>
          <Text style={styles.filterLabel}>Dept</Text>
          <Text style={styles.filterValue}>{department}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterBox} onPress={() => setShowYearPicker(true)}>
          <Text style={styles.filterLabel}>Year</Text>
          <Text style={styles.filterValue}>{year}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterBox} onPress={() => setShowSemPicker(true)}>
          <Text style={styles.filterLabel}>Sem</Text>
          <Text style={styles.filterValue}>{semester}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={styles.recordCard}>
              <View>
                <Text style={styles.studentName}>{item.studentName}</Text>
                <Text style={styles.rollNo}>Roll: {item.rollNo}</Text>
                <Text style={styles.date}>{item.date?.toDate().toDateString()}</Text>
              </View>
              <View style={[styles.statusBadge, item.status === 'Present' ? styles.bgGreen : styles.bgRed]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No attendance records found for this selection.</Text>
          }
        />
      )}

      {renderPickerModal(showDeptPicker, setShowDeptPicker, departments, department, setDepartment, 'Department')}
      {renderPickerModal(showYearPicker, setShowYearPicker, years, year, setYear, 'Year')}
      {renderPickerModal(showSemPicker, setShowSemPicker, semesters, semester, setSemester, 'Semester')}
    </View>
  );
};

export default AdminAttendanceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingTop: 60, paddingBottom: 20, alignItems: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  filterContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 20 },
  filterBox: { backgroundColor: '#fff', padding: 12, borderRadius: 12, alignItems: 'center', flex: 1, marginHorizontal: 5, elevation: 2 },
  filterLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  filterValue: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  recordCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  rollNo: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  date: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  bgGreen: { backgroundColor: '#D1FAE5' },
  bgRed: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#111827' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#6B7280', fontSize: 16 },
  
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
