import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { createResultDraft, saveStudentMarks, publishResult } from '../services/results/resultService';
import LinearGradient from 'react-native-linear-gradient';

const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'MECH', 'CIVIL'];
const YEARS = ['1', '2', '3', '4'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

const UploadResultScreen = ({ navigation }: any) => {
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState('1');
  const [semester, setSemester] = useState('1');
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('Internal');
  const [totalMarksGlobal, setTotalMarksGlobal] = useState('100');

  const [students, setStudents] = useState<any[]>([]);
  const [marksData, setMarksData] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(false);
  const [resultBatchId, setResultBatchId] = useState<string | null>(null);

  const fetchStudents = async () => {
    if (!subject.trim()) {
      Alert.alert('Required', 'Please enter a subject name first.');
      return;
    }
    
    setLoading(true);
    try {
      const snap = await firestore()
        .collection('users')
        .where('role', '==', 'student')
        .where('department', '==', department)
        .where('year', '==', year)
        .get();

      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(list);

      // Initialize marks
      const initialMarks: Record<string, string> = {};
      list.forEach(s => {
        initialMarks[s.id] = '';
      });
      setMarksData(initialMarks);

      // Create draft batch
      const user = auth().currentUser;
      const teacherDoc = await firestore().collection('users').doc(user?.uid).get();
      const teacherName = teacherDoc.data()?.name || 'Teacher';

      const batchId = await createResultDraft({
        teacherId: user!.uid,
        teacherName,
        department,
        year,
        semester,
        subject,
        examType,
        totalMarks: Number(totalMarksGlobal) || 100,
        status: 'draft',
      });
      
      setResultBatchId(batchId);

    } catch (err: any) {
      Alert.alert('Error', 'Failed to load students: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!resultBatchId) return;
    
    setLoading(true);
    try {
      const marksPayload = students.map(s => ({
        studentId: s.id,
        studentName: s.name || 'Unknown',
        rollNo: s.rollNo || '',
        marksObtained: Number(marksData[s.id]) || 0,
        totalMarks: Number(totalMarksGlobal) || 100,
        percentage: 0, // Calculated in service
      }));

      await saveStudentMarks(resultBatchId, marksPayload);
      Alert.alert('Success', 'Draft saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = () => {
    if (!resultBatchId) return;

    Alert.alert(
      'Publish Results',
      'Are you sure? This will make the results visible to students immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Save latest marks first
              const marksPayload = students.map(s => ({
                studentId: s.id,
                studentName: s.name || 'Unknown',
                rollNo: s.rollNo || '',
                marksObtained: Number(marksData[s.id]) || 0,
                totalMarks: Number(totalMarksGlobal) || 100,
                percentage: 0,
              }));
              await saveStudentMarks(resultBatchId, marksPayload);
              
              // Publish
              await publishResult(resultBatchId);
              Alert.alert('Published! ✅', 'Results are now live.');
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setLoading(false);
            }
          },
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Upload Results</Text>
          <View style={{ width: 60 }} />
        </View>
      </LinearGradient>

      {students.length === 0 ? (
        <ScrollView style={styles.setupContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>1. Class Details</Text>
          
          <Text style={styles.label}>Department</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {DEPARTMENTS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, department === d && styles.chipActive]}
                onPress={() => setDepartment(d)}
              >
                <Text style={[styles.chipText, department === d && styles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {YEARS.map(y => (
              <TouchableOpacity
                key={y}
                style={[styles.chip, year === y && styles.chipActive]}
                onPress={() => setYear(y)}
              >
                <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Semester</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {SEMESTERS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, semester === s && styles.chipActive]}
                onPress={() => setSemester(s)}
              >
                <Text style={[styles.chipText, semester === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>2. Exam Details</Text>

          <Text style={styles.label}>Subject Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Data Structures"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.label}>Exam Type</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Midterm, Final, Unit Test"
            value={examType}
            onChangeText={setExamType}
          />

          <Text style={styles.label}>Max Total Marks</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={totalMarksGlobal}
            onChangeText={setTotalMarksGlobal}
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={fetchStudents} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Load Students →</Text>}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <View style={styles.marksContainer}>
          <View style={styles.infoBar}>
            <Text style={styles.infoText}>
              {subject} • {department} Year {year} • Max: {totalMarksGlobal}
            </Text>
            <TouchableOpacity onPress={() => setStudents([])}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.studentsList} keyboardShouldPersistTaps="handled">
            {students.map((student, index) => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentIndex}>{index + 1}.</Text>
                  <View>
                    <Text style={styles.studentName}>{student.name || 'Unknown'}</Text>
                    <Text style={styles.studentRoll}>Roll: {student.rollNo || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.marksInputWrapper}>
                  <TextInput
                    style={styles.marksInput}
                    keyboardType="number-pad"
                    placeholder="Marks"
                    placeholderTextColor="#9CA3AF"
                    value={marksData[student.id]}
                    onChangeText={(val) => setMarksData(prev => ({ ...prev, [student.id]: val }))}
                  />
                  <Text style={styles.marksSlash}>/ {totalMarksGlobal}</Text>
                </View>
              </View>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={styles.actionFooter}>
            <TouchableOpacity style={styles.draftBtn} onPress={handleSaveDraft} disabled={loading}>
              <Text style={styles.draftBtnText}>Save Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} disabled={loading}>
              <Text style={styles.publishBtnText}>Publish Live</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default UploadResultScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingTop: 50, paddingBottom: 15, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  backText: { color: '#fff', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  
  setupContainer: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginTop: 10, marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
  chipScroll: { flexDirection: 'row', marginBottom: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E5E7EB', marginRight: 10, borderWidth: 1, borderColor: '#D1D5DB' },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#4B5563', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, backgroundColor: '#fff', fontSize: 15, color: '#1F2937', marginBottom: 20 },
  primaryBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  marksContainer: { flex: 1 },
  infoBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#DBEAFE', padding: 12, paddingHorizontal: 20 },
  infoText: { color: '#1D4ED8', fontWeight: 'bold', fontSize: 13 },
  resetText: { color: '#DC2626', fontWeight: 'bold', fontSize: 13 },
  
  studentsList: { padding: 15 },
  studentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 1 },
  studentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  studentIndex: { fontSize: 15, fontWeight: 'bold', color: '#6B7280', marginRight: 10, width: 25 },
  studentName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  studentRoll: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  
  marksInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 10 },
  marksInput: { width: 50, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#1F2937', paddingVertical: 8 },
  marksSlash: { fontSize: 14, color: '#6B7280', fontWeight: 'bold' },

  actionFooter: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 10 },
  draftBtn: { flex: 1, backgroundColor: '#F3F4F6', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB' },
  draftBtnText: { color: '#4B5563', fontWeight: 'bold', fontSize: 15 },
  publishBtn: { flex: 1, backgroundColor: '#10B981', padding: 15, borderRadius: 10, alignItems: 'center' },
  publishBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});