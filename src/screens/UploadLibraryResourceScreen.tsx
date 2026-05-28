import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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
import storage from '@react-native-firebase/storage';
import { pick, types } from '@react-native-documents/picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { uploadLibraryResource } from '../services/library/libraryService';
import { LibraryResourceType, EducationLevel } from '../types/library';
import {
  getEducationLevels,
  getSchoolClasses,
  getBtechDepartments,
  getBtechYears,
  getValidSemestersForYear,
} from '../services/academic/academicConfigService';
import { loadSubjectsFromFirestoreOrDefault } from '../services/academic/subjectCatalogService';
import { SubjectOption } from '../types/academic';

const UploadLibraryResourceScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>('btech');
  const [resourceType, setResourceType] = useState<LibraryResourceType>('pdf');
  
  const [department, setDepartment] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [yearNumber, setYearNumber] = useState<number | null>(null);
  const [semesterNumber, setSemesterNumber] = useState<number | null>(null);
  const [classLevel, setClassLevel] = useState('');

  const [availableSubjects, setAvailableSubjects] = useState<SubjectOption[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  const btechDepts = getBtechDepartments();
  const btechYears = getBtechYears();
  const validSemesters = getValidSemestersForYear(yearNumber);
  const schoolClasses = getSchoolClasses();

  React.useEffect(() => {
    const loadSubjects = async () => {
      setIsLoadingSubjects(true);
      setSubject('');
      try {
        const subjects = await loadSubjectsFromFirestoreOrDefault({
          educationLevel: educationLevel as any,
          departmentCode: departmentCode || undefined,
          classLevel: classLevel || undefined,
          yearNumber: yearNumber || undefined,
          semesterNumber: semesterNumber || undefined,
          subject: '',
        });
        setAvailableSubjects(subjects);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingSubjects(false);
      }
    };
    if (educationLevel) {
      loadSubjects();
    }
  }, [educationLevel, departmentCode, classLevel, yearNumber, semesterNumber]);

  const [externalLink, setExternalLink] = useState('');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);

  const handlePickFile = async () => {
    try {
      const res = await pick({
        type: [types.pdf, types.images, types.plainText],
        allowMultiSelection: false,
        copyTo: 'cachesDirectory',
      });
      const file = res[0];
      if (file && file.uri) {
        setFileUri(file.uri);
        setFileName(file.name || 'document.pdf');
        setFileSize(file.size || null);
        setMimeType(file.type || 'application/pdf');
        
        if (file.type?.includes('image')) setResourceType('image');
        else if (file.type?.includes('pdf')) setResourceType('pdf');
        else setResourceType('other');
      }
    } catch (err) {
      // User cancelled or error
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !subject.trim()) {
      Alert.alert('Missing Fields', 'Title and Subject are required.');
      return;
    }
    if (resourceType === 'link' && !externalLink.trim()) {
      Alert.alert('Missing Link', 'Please provide an external link.');
      return;
    }
    if (resourceType !== 'link' && !fileUri) {
      Alert.alert('Missing File', 'Please attach a file.');
      return;
    }

    setUploading(true);
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('Not logged in');

      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();

      let finalFileUrl: string | null = null;
      let finalFilePath: string | null = null;

      if (resourceType !== 'link' && fileUri && fileName) {
        finalFilePath = `libraryResources/${educationLevel}/${subject}/${Date.now()}_${fileName}`;
        const ref = storage().ref(finalFilePath);
        
        if (Platform.OS === 'android' && fileUri.startsWith('content://')) {
          const base64Data = await ReactNativeBlobUtil.fs.readFile(fileUri, 'base64');
          await ref.putString(base64Data, 'base64');
        } else {
          await ref.putFile(fileUri);
        }
        finalFileUrl = await ref.getDownloadURL();
      }

      await uploadLibraryResource({
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        resourceType,
        educationLevel,
        department: educationLevel === 'btech' ? department : null,
        departmentCode: educationLevel === 'btech' ? departmentCode : null,
        yearNumber: educationLevel === 'btech' && yearNumber ? yearNumber : null,
        semesterNumber: educationLevel === 'btech' && semesterNumber ? semesterNumber : null,
        classLevel: educationLevel === 'school' ? classLevel : null,
        externalLink: resourceType === 'link' ? externalLink.trim() : null,
        fileUrl: finalFileUrl,
        filePath: finalFilePath,
        fileName: fileName,
        fileSize: fileSize,
        mimeType: mimeType,
        uploadedBy: user.uid,
        uploadedByName: userData?.name || 'Teacher',
        uploadedByRole: 'teacher',
        uploaderPhotoUrl: userData?.profilePhotoUrl || null,
      });

      Alert.alert('Success', 'Resource uploaded to E-Library!');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'An error occurred.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload Resource</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 60 }}>
        
        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} placeholder="e.g. Chapter 1 Notes" placeholderTextColor="#64748b" value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Brief description..." placeholderTextColor="#64748b" multiline value={description} onChangeText={setDescription} />

        <Text style={styles.label}>Education Level</Text>
        <View style={styles.row}>
          {(['btech', 'school', 'all'] as EducationLevel[]).map(lvl => (
            <TouchableOpacity key={lvl} style={[styles.chip, educationLevel === lvl && styles.chipActive]} onPress={() => setEducationLevel(lvl)}>
              <Text style={[styles.chipText, educationLevel === lvl && styles.chipTextActive]}>{lvl.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {educationLevel === 'btech' && (
          <>
            <Text style={styles.label}>Department</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowDeptModal(true)}>
              <Text style={[styles.dropdownBtnText, !departmentCode && styles.placeholderText]}>{department || 'Select Department'}</Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Year</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8}}>
                  {btechYears.map(y => (
                    <TouchableOpacity key={y.number} style={[styles.chip, yearNumber === y.number && styles.chipActive]} onPress={() => setYearNumber(y.number)}>
                      <Text style={[styles.chipText, yearNumber === y.number && styles.chipTextActive]}>{y.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {yearNumber ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>Semester</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8}}>
                  {validSemesters.map(s => (
                    <TouchableOpacity key={s.number} style={[styles.chip, semesterNumber === s.number && styles.chipActive]} onPress={() => setSemesterNumber(s.number)}>
                      <Text style={[styles.chipText, semesterNumber === s.number && styles.chipTextActive]}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </>
        )}

        {educationLevel === 'school' && (
          <>
            <Text style={styles.label}>Class Level</Text>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowClassModal(true)}>
              <Text style={[styles.dropdownBtnText, !classLevel && styles.placeholderText]}>{classLevel || 'Select Class'}</Text>
            </TouchableOpacity>
          </>
        )}

        {educationLevel !== 'all' && (
          <>
            <Text style={styles.label}>Subject *</Text>
            {isLoadingSubjects ? (
              <ActivityIndicator color="#0ea5e9" size="small" style={{ alignSelf: 'flex-start', marginVertical: 12 }} />
            ) : (
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowSubjectModal(true)}>
                <Text style={[styles.dropdownBtnText, !subject && styles.placeholderText]}>{subject || 'Select Subject'}</Text>
              </TouchableOpacity>
            )}
          </>
        )}



        <Text style={styles.label}>Resource Type</Text>
        <View style={styles.rowWrap}>
          {(['pdf', 'notes', 'video', 'link', 'book', 'image'] as LibraryResourceType[]).map(type => (
            <TouchableOpacity key={type} style={[styles.chip, resourceType === type && styles.chipActive]} onPress={() => setResourceType(type)}>
              <Text style={[styles.chipText, resourceType === type && styles.chipTextActive]}>{type.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {resourceType === 'link' ? (
          <>
            <Text style={styles.label}>External Link URL *</Text>
            <TextInput style={styles.input} placeholder="https://..." placeholderTextColor="#64748b" value={externalLink} onChangeText={setExternalLink} />
          </>
        ) : (
          <>
            <Text style={styles.label}>Attachment *</Text>
            <TouchableOpacity style={styles.fileBox} onPress={handlePickFile}>
              <Text style={styles.fileIcon}>📎</Text>
              <Text style={styles.fileText} numberOfLines={1}>{fileName || 'Tap to select file'}</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={[styles.submitBtn, uploading && { opacity: 0.7 }]} onPress={handleUpload} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Upload Resource</Text>}
        </TouchableOpacity>

      </ScrollView>

      {/* Select Subject Modal */}
      <Modal visible={showSubjectModal} transparent animationType="slide" onRequestClose={() => setShowSubjectModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Subject</Text>
            <ScrollView style={{ padding: 16 }}>
              {availableSubjects.map((item) => (
                <TouchableOpacity key={item.id} style={styles.modalItem} onPress={() => { setSubject(item.name); setShowSubjectModal(false); }}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowSubjectModal(false)}><Text style={{ color: '#94a3b8' }}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Select Dept Modal */}
      <Modal visible={showDeptModal} transparent animationType="slide" onRequestClose={() => setShowDeptModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Department</Text>
            <ScrollView style={{ padding: 16 }}>
              {btechDepts.map((item) => (
                <TouchableOpacity key={item.code} style={styles.modalItem} onPress={() => { setDepartment(item.name); setDepartmentCode(item.code); setShowDeptModal(false); }}>
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDeptModal(false)}><Text style={{ color: '#94a3b8' }}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Select Class Modal */}
      <Modal visible={showClassModal} transparent animationType="slide" onRequestClose={() => setShowClassModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Class</Text>
            <ScrollView style={{ padding: 16 }}>
              {schoolClasses.map((item) => (
                <TouchableOpacity key={item.level} style={styles.modalItem} onPress={() => { setClassLevel(item.level); setShowClassModal(false); }}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowClassModal(false)}><Text style={{ color: '#94a3b8' }}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default UploadLibraryResourceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 22 },
  backIcon: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  
  formContainer: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#cbd5e1', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#f8fafc',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  row: { flexDirection: 'row', alignItems: 'center' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: { backgroundColor: 'rgba(56,189,248,0.15)', borderColor: '#38bdf8' },
  chipText: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold' },
  chipTextActive: { color: '#38bdf8' },
  
  fileBox: {
    backgroundColor: 'rgba(56,189,248,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  fileIcon: { fontSize: 24, marginRight: 12 },
  fileText: { color: '#38bdf8', fontSize: 15, fontWeight: '600', flex: 1 },
  
  submitBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  dropdownBtn: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dropdownBtnText: { color: '#f8fafc', fontSize: 15 },
  placeholderText: { color: '#64748b' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 20 },
  modalTitle: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold', padding: 20, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalItemText: { color: '#f8fafc', fontSize: 16 },
  modalCancel: { padding: 20, alignItems: 'center' },
});
