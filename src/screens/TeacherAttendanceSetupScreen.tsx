import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { loadEnrolledStudentsForAttendance } from '../services/attendance/classEmbeddingService';
import { AttendanceClassConfig, EducationLevel, ClassLoadResult, SubjectOption } from '../types/academic';
import {
  getEducationLevels,
  getSchoolClasses,
  getBtechDepartments,
  getBtechYears,
  getValidSemestersForYear,
} from '../services/academic/academicConfigService';
import { loadSubjectsFromFirestoreOrDefault } from '../services/academic/subjectCatalogService';

const TeacherAttendanceSetupScreen = ({ navigation }: any) => {
  // ── State ──
  const [educationLevel, setEducationLevel] = useState<EducationLevel | null>(null);
  
  // BTech state
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [yearNumber, setYearNumber] = useState<number | null>(null);
  const [semesterNumber, setSemesterNumber] = useState<number | null>(null);
  
  // School state
  const [classLevel, setClassLevel] = useState('');
  const [className, setClassName] = useState('');
  
  // Subject state
  const [availableSubjects, setAvailableSubjects] = useState<SubjectOption[]>([]);
  const [subject, setSubject] = useState('');
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadResult, setLoadResult] = useState<ClassLoadResult | null>(null);

  // ── Options ──
  const educationLevels = getEducationLevels();
  const schoolClasses = getSchoolClasses();
  const btechDepts = getBtechDepartments();
  const btechYears = getBtechYears();
  const validSemesters = getValidSemestersForYear(yearNumber);

  // ── Effects ──
  useEffect(() => {
    // Reload subjects whenever config changes
    if (educationLevel) {
      loadSubjects();
    }
  }, [educationLevel, departmentCode, yearNumber, semesterNumber, classLevel]);

  const loadSubjects = async () => {
    setIsLoadingSubjects(true);
    setSubject(''); // Reset selected subject
    const config: AttendanceClassConfig = {
      educationLevel: educationLevel as EducationLevel,
      departmentCode: departmentCode || undefined,
      department: departmentName || undefined,
      classLevel: classLevel || undefined,
      className: className || undefined,
      yearNumber: yearNumber || undefined,
      semesterNumber: semesterNumber || undefined,
      subject: '', // not needed for loading catalog
    };
    try {
      const subjects = await loadSubjectsFromFirestoreOrDefault(config);
      setAvailableSubjects(subjects);
    } catch (error: any) {
      console.error('Subject Load Error:', error);
      Alert.alert('Load Subjects Error', error instanceof Error ? error.message : String(error));
    }
    setIsLoadingSubjects(false);
  };

  const handleLoadClass = async () => {
    if (!educationLevel) {
      Alert.alert('Missing', 'Please select Education Type.');
      return;
    }

    if (!subject) {
      Alert.alert('Missing', 'Please select a Subject. If no subjects exist, contact Admin.');
      return;
    }

    if (educationLevel === 'btech' && (!departmentCode || !yearNumber || !semesterNumber)) {
      Alert.alert('Missing', 'Please select Department, Year, and Semester.');
      return;
    }

    if (educationLevel === 'school' && !classLevel) {
      Alert.alert('Missing', 'Please select a Class.');
      return;
    }

    setIsLoading(true);
    setLoadResult(null);

    try {
      const config: AttendanceClassConfig = {
        educationLevel,
        departmentCode: departmentCode || undefined,
        department: departmentName || undefined,
        classLevel: classLevel || undefined,
        className: className || undefined,
        yearNumber: yearNumber || undefined,
        semesterNumber: semesterNumber || undefined,
        subject,
      };

      const result = await loadEnrolledStudentsForAttendance(config);
      setLoadResult(result);
    } catch (error: any) {
      console.error('Load Class Error:', error);
      Alert.alert('Load Class Error', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartScanning = async () => {
    if (!loadResult || loadResult.validEmbeddings.length === 0) return;

    const currentUser = auth().currentUser;
    let teacherName = 'Teacher';
    if (currentUser) {
      const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
      if (userDoc.exists) {
        teacherName = userDoc.data()?.name || 'Teacher';
      }
    }

    const filter = {
      department: departmentCode || classLevel || '',
      year: yearNumber ? String(yearNumber) : classLevel || '',
      semester: semesterNumber ? String(semesterNumber) : '',
      subject,
      section: '', // Removed from config
    };

    navigation.replace('TeacherLiveAttendance', {
      filter,
      students: loadResult.students,
      validEmbeddings: loadResult.validEmbeddings,
      classConfig: {
        educationLevel,
        departmentCode: departmentCode || null,
        department: departmentName || null,
        classLevel: classLevel || null,
        className: className || null,
        yearNumber: yearNumber || null,
        semesterNumber: semesterNumber || null,
        subject,
      },
      teacherId: currentUser?.uid || 'unknown',
      teacherName,
    });
  };

  // ── UI Components ──
  const ChipSelector = ({
    label,
    options,
    selectedValue,
    onSelect,
    keyExtractor,
    labelExtractor,
  }: {
    label: string;
    options: any[];
    selectedValue: string | number | null;
    onSelect: (item: any) => void;
    keyExtractor: (item: any) => string;
    labelExtractor: (item: any) => string;
  }) => {
    if (!options || options.length === 0) return null;
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{label}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {options.map(item => {
            const key = keyExtractor(item);
            const isSelected = String(selectedValue) === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {labelExtractor(item)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <LinearGradient colors={['#1e1e1e', '#121212']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Setup</Text>
        <Text style={styles.headerSubtitle}>Premium Dark Mode</Text>
      </LinearGradient>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40, padding: 20 }}>
        
        {/* ── Step 1: Education Level ── */}
        <Text style={styles.sectionTitle}>Education Type</Text>
        <View style={styles.levelRow}>
          {educationLevels.map(lvl => (
            <TouchableOpacity
              key={lvl.value}
              style={[styles.levelCard, educationLevel === lvl.value && styles.levelCardActive]}
              onPress={() => {
                setEducationLevel(lvl.value);
                setLoadResult(null);
                setDepartmentCode('');
                setDepartmentName('');
                setClassLevel('');
                setClassName('');
                setYearNumber(null);
                setSemesterNumber(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.levelIcon}>{lvl.icon}</Text>
              <Text style={[styles.levelLabel, educationLevel === lvl.value && styles.levelLabelActive]}>{lvl.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Step 2: Class Config ── */}
        {educationLevel === 'school' && (
          <View style={styles.cardGroup}>
            <ChipSelector
              label="Select Class"
              options={schoolClasses}
              selectedValue={classLevel}
              onSelect={(item) => { setClassLevel(item.level); setClassName(item.name); setLoadResult(null); }}
              keyExtractor={(item) => item.level}
              labelExtractor={(item) => item.name}
            />
          </View>
        )}

        {educationLevel === 'btech' && (
          <View style={styles.cardGroup}>
            <ChipSelector
              label="Department"
              options={btechDepts}
              selectedValue={departmentCode}
              onSelect={(item) => { setDepartmentCode(item.code); setDepartmentName(item.name); setLoadResult(null); }}
              keyExtractor={(item) => item.code}
              labelExtractor={(item) => item.label}
            />
            <ChipSelector
              label="Year"
              options={btechYears}
              selectedValue={yearNumber ? String(yearNumber) : ''}
              onSelect={(item) => { 
                setYearNumber(item.number); 
                setSemesterNumber(null); // Reset semester when year changes
                setLoadResult(null); 
              }}
              keyExtractor={(item) => String(item.number)}
              labelExtractor={(item) => item.label}
            />
            {yearNumber && (
              <ChipSelector
                label="Semester"
                options={validSemesters}
                selectedValue={semesterNumber ? String(semesterNumber) : ''}
                onSelect={(item) => { setSemesterNumber(item.number); setLoadResult(null); }}
                keyExtractor={(item) => String(item.number)}
                labelExtractor={(item) => item.label}
              />
            )}
          </View>
        )}

        {/* ── Step 3: Subject ── */}
        {educationLevel && (
          <View style={styles.cardGroup}>
            {isLoadingSubjects ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#0ea5e9" size="small" />
                <Text style={styles.loadingText}>Loading subjects catalog...</Text>
              </View>
            ) : availableSubjects.length > 0 ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Select Subject</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowSubjectModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownButtonText, !subject && styles.placeholderText]}>
                    {subject || 'Tap to select a subject...'}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>No subjects configured for this selection.</Text>
                <Text style={styles.errorSub}>Please contact Admin to configure academicSubjects in Firestore.</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Load Class Button ── */}
        {educationLevel && (
          <TouchableOpacity
            style={[styles.loadButton, isLoading && styles.loadButtonDisabled]}
            onPress={handleLoadClass}
            disabled={isLoading || !subject}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loadButtonText}>Analyze Class Enrollments</Text>
            )}
          </TouchableOpacity>
        )}

        {/* ── Diagnostics & Results Display ── */}
        {loadResult && (
          <View style={styles.resultContainer}>
            {loadResult.diagnostics.totalClassMatched === 0 ? (
              <View style={styles.diagnosticCard}>
                <Text style={styles.diagIcon}>🔍</Text>
                <Text style={styles.diagTitle}>No matching student profiles found.</Text>
                <Text style={styles.diagSub}>Check the department, year, and semester filters. Zero student profiles exist with this configuration.</Text>
              </View>
            ) : loadResult.validEmbeddings.length === 0 ? (
              <View style={styles.diagnosticCardOrange}>
                <Text style={styles.diagIcon}>⚠️</Text>
                <Text style={styles.diagTitle}>No valid enrolled face embeddings found for this class.</Text>
                <Text style={styles.diagSub}>Matched {loadResult.students.length} profiles. Ask students listed below to re-enroll their face.</Text>
              </View>
            ) : (
              <View style={styles.successCard}>
                <View style={styles.successRow}>
                  <Text style={styles.successIcon}>✅</Text>
                  <View>
                    <Text style={styles.successTitle}>Ready for Scanning</Text>
                    <Text style={styles.successSub}>{loadResult.validEmbeddings.length} valid face embeddings loaded</Text>
                  </View>
                </View>
                
                {loadResult.missingEmbeddings.length > 0 && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>⚠️ {loadResult.missingEmbeddings.length} students need face enrollment repair.</Text>
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleStartScanning}
                  activeOpacity={0.9}
                >
                  <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.startGradient}>
                    <Text style={styles.startText}>Start Live Scanning 📸</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.summaryGrid}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Total Students</Text>
                <Text style={styles.summaryValue}>{loadResult.students.length}</Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Valid Embeddings</Text>
                <Text style={styles.summaryValue}>{loadResult.validEmbeddings.length}</Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Missing</Text>
                <Text style={styles.summaryValue}>{loadResult.missingEmbeddings.length}</Text>
              </View>
            </View>

            {loadResult.missingEmbeddings.length > 0 && (
              <View style={styles.missingList}>
                <Text style={styles.missingTitle}>Missing Face Enrollment</Text>
                {loadResult.missingEmbeddings.slice(0, 20).map(student => (
                  <View key={student.uid} style={styles.missingRow}>
                    <Text style={styles.missingName}>{student.name}</Text>
                    <Text style={styles.missingReason}>{student.reason}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* DEV DIAGNOSTICS (Always visible for clarity) */}
            <View style={styles.debugBox}>
              <Text style={styles.debugTitle}>System Diagnostics:</Text>
              <Text style={styles.debugText}>Profiles Scanned: {loadResult.diagnostics.totalUserDocsScanned}</Text>
              <Text style={styles.debugText}>Class Matches: {loadResult.diagnostics.totalClassMatched}</Text>
              <Text style={styles.debugText}>Enrollment Flag = True: {loadResult.diagnostics.totalWithEnrollmentFlag}</Text>
              <Text style={styles.debugText}>Valid Embeddings Loaded: {loadResult.validEmbeddings.length}</Text>
              <Text style={styles.debugText}>Selected Filters: {JSON.stringify(loadResult.diagnostics.selectedFilters)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Subject Modal ── */}
      <Modal
        visible={showSubjectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subject</Text>
              <TouchableOpacity onPress={() => setShowSubjectModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {availableSubjects.map((item) => {
                const isSelected = subject === item.name;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => {
                      setSubject(item.name);
                      setLoadResult(null);
                      setShowSubjectModal(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                      {item.name}
                    </Text>
                    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TeacherAttendanceSetupScreen;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#0f172a' }, // Dark navy/gray bg
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  backIcon: { fontSize: 20, color: '#f8fafc' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#f8fafc', letterSpacing: 0.5 },
  headerSubtitle: { color: '#94a3b8', marginTop: 4, fontSize: 14, fontWeight: '500' },
  container: { flex: 1 },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1
  },

  levelRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  levelCard: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 16, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  levelCardActive: { borderColor: '#0ea5e9', backgroundColor: '#0c4a6e' },
  levelIcon: { fontSize: 32, marginBottom: 8 },
  levelLabel: { fontSize: 13, fontWeight: '600', color: '#cbd5e1' },
  levelLabelActive: { color: '#38bdf8' },

  cardGroup: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 12 },
  chipRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155',
  },
  chipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  chipText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#ffffff', fontWeight: '700' },

  loadingBox: { padding: 16, alignItems: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 8, fontSize: 13 },
  errorBox: { padding: 16, backgroundColor: '#450a0a', borderRadius: 12, borderWidth: 1, borderColor: '#7f1d1d' },
  errorText: { color: '#fca5a5', fontWeight: '700', fontSize: 14 },
  errorSub: { color: '#fecaca', fontSize: 12, marginTop: 4 },

  loadButton: {
    backgroundColor: '#0ea5e9', paddingVertical: 18, borderRadius: 16,
    alignItems: 'center', elevation: 3, shadowColor: '#0ea5e9', shadowOpacity: 0.3, shadowRadius: 8,
  },
  loadButtonDisabled: { opacity: 0.5 },
  loadButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  resultContainer: { marginTop: 24 },
  diagnosticCard: {
    backgroundColor: '#1e293b', borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: '#475569', alignItems: 'center'
  },
  diagnosticCardOrange: {
    backgroundColor: '#451a03', borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: '#78350f', alignItems: 'center'
  },
  diagIcon: { fontSize: 40, marginBottom: 12 },
  diagTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginBottom: 8, textAlign: 'center' },
  diagSub: { fontSize: 14, color: '#cbd5e1', textAlign: 'center', lineHeight: 20 },

  successCard: {
    backgroundColor: '#1e293b', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#0ea5e9'
  },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  successIcon: { fontSize: 32 },
  successTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  successSub: { fontSize: 14, color: '#38bdf8' },
  warningBox: { marginTop: 16, backgroundColor: '#451a03', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#78350f' },
  warningText: { color: '#fdba74', fontSize: 13, fontWeight: '500' },
  summaryGrid: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  summaryCell: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
  },
  summaryLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  summaryValue: { color: '#f8fafc', fontSize: 20, fontWeight: '800', marginTop: 4 },
  missingList: {
    marginTop: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
  },
  missingTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '800', marginBottom: 10 },
  missingRow: {
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  missingName: { color: '#e2e8f0', fontSize: 13, fontWeight: '700' },
  missingReason: { color: '#fdba74', fontSize: 12, marginTop: 3 },
  
  startButton: { marginTop: 20, borderRadius: 12, overflow: 'hidden' },
  startGradient: { paddingVertical: 18, alignItems: 'center' },
  startText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  debugBox: {
    marginTop: 20, backgroundColor: '#020617', borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: '#334155',
  },
  debugTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' },
  debugText: { fontSize: 11, color: '#cbd5e1', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 4 },

  // Dropdown Styles
  dropdownButton: {
    backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155',
    padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  dropdownButtonText: { color: '#f8fafc', fontSize: 15, fontWeight: '500', flex: 1 },
  placeholderText: { color: '#64748b' },
  dropdownIcon: { color: '#94a3b8', fontSize: 14 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '70%', paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155'
  },
  modalTitle: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  closeBtnText: { color: '#94a3b8', fontSize: 20, fontWeight: 'bold' },
  modalList: { padding: 10 },
  modalItem: {
    padding: 16, borderRadius: 12, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  modalItemActive: { backgroundColor: '#0c4a6e' },
  modalItemText: { color: '#cbd5e1', fontSize: 15, fontWeight: '500' },
  modalItemTextActive: { color: '#38bdf8', fontWeight: 'bold' },
  checkIcon: { color: '#38bdf8', fontSize: 16, fontWeight: 'bold' },
});
