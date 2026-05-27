import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Calendar, DateData } from 'react-native-calendars';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { createAssignment, uploadAssignmentAttachment } from '../services/assignments/assignmentService';
import { getEducationLevels, getSchoolClasses, getBtechDepartments, getBtechYears, getValidSemestersForYear } from '../services/academic/academicConfigService';
import { loadSubjectsFromFirestoreOrDefault } from '../services/academic/subjectCatalogService';
import { AttendanceClassConfig, EducationLevel, SubjectOption } from '../types/academic';
import { AssignmentStatus } from '../types/assignment';
import AppBackButton from '../components/common/AppBackButton';

// ═══════════════════════════════════════════════════
// CREATE ASSIGNMENT SCREEN
// ═══════════════════════════════════════════════════

const CreateAssignmentScreen = ({ navigation }: any) => {
  const toDateKey = (date: Date) => date.toISOString().split('T')[0];
  const todayKey = toDateKey(new Date());
  const formatReadableDate = (dateKey: string) =>
    new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  const MAX_DOC_BYTES = 50 * 1024 * 1024;
  const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
  const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

  type SelectedAttachment = {
    uri: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    kind: 'document' | 'image' | 'video';
  };
  // ── Form State ──
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueDateModalVisible, setDueDateModalVisible] = useState(false);
  const [totalMarks, setTotalMarks] = useState('');

  // ── Academic Config State ──
  const [educationLevel, setEducationLevel] = useState<EducationLevel | null>(null);
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [yearNumber, setYearNumber] = useState<number | null>(null);
  const [semesterNumber, setSemesterNumber] = useState<number | null>(null);
  const [classLevel, setClassLevel] = useState('');
  const [className, setClassName] = useState('');

  // ── Subject State ──
  const [availableSubjects, setAvailableSubjects] = useState<SubjectOption[]>([]);
  const [subject, setSubject] = useState('');
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  // ── Attachment State ──
  const [attachment, setAttachment] = useState<SelectedAttachment | null>(null);

  // ── UI State ──
  const [saving, setSaving] = useState(false);
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);

  // ── Options ──
  const educationLevels = getEducationLevels();
  const schoolClasses = getSchoolClasses();
  const btechDepts = getBtechDepartments();
  const btechYears = getBtechYears();
  const validSemesters = getValidSemestersForYear(yearNumber);

  // ── Load Subjects on Config Change ──
  useEffect(() => {
    if (!educationLevel) {
      setAvailableSubjects([]);
      setSubject('');
      return;
    }

    const loadSubjects = async () => {
      setIsLoadingSubjects(true);
      setSubject('');
      const config: AttendanceClassConfig = {
        educationLevel: educationLevel as EducationLevel,
        departmentCode: departmentCode || undefined,
        department: departmentName || undefined,
        classLevel: classLevel || undefined,
        className: className || undefined,
        yearNumber: yearNumber || undefined,
        semesterNumber: semesterNumber || undefined,
        subject: '',
      };
      try {
        const subjects = await loadSubjectsFromFirestoreOrDefault(config);
        setAvailableSubjects(subjects);
      } catch (error: any) {
        console.error('Subject Load Error:', error);
      }
      setIsLoadingSubjects(false);
    };

    loadSubjects();
  }, [educationLevel, departmentCode, departmentName, classLevel, className, yearNumber, semesterNumber]);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const user = auth().currentUser;
        if (!user) {
          setIsTeacher(false);
          return;
        }
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const role = String(userDoc.data()?.role || '').toLowerCase();
        setIsTeacher(role === 'teacher' || role === 'admin');
      } catch {
        setIsTeacher(false);
      }
    };
    loadRole();
  }, []);

  // ── Pick File ──
  const ensureFileLimit = (sizeBytes: number, kind: 'document' | 'image' | 'video') => {
    if (kind === 'document' && sizeBytes > MAX_DOC_BYTES) {
      throw new Error('Document exceeds 50MB limit.');
    }
    if (kind === 'image' && sizeBytes > MAX_IMAGE_BYTES) {
      throw new Error('Image exceeds 15MB limit.');
    }
    if (kind === 'video' && sizeBytes > MAX_VIDEO_BYTES) {
      throw new Error('Video exceeds 100MB limit.');
    }
  };

  const pickDocument = async () => {
    try {
      const files = await pick({
        allowMultiSelection: false,
        copyTo: 'cachesDirectory',
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ],
      });
      const file = files[0];
      const sizeBytes = Number(file.size || 0);
      ensureFileLimit(sizeBytes, 'document');
      setAttachment({
        uri: file.uri,
        name: file.name || 'document',
        mimeType: file.type || 'application/octet-stream',
        sizeBytes,
        kind: 'document',
      });
    } catch (error: any) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      Alert.alert('Attachment Error', error?.message || 'Failed to pick document.');
    }
  };

  const pickImage = () => {
    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 1 },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Attachment Error', response.errorMessage || 'Failed to pick image.');
          return;
        }
        const asset = response.assets?.[0];
        if (!asset?.uri) {
          return;
        }
        const sizeBytes = Number(asset.fileSize || 0);
        try {
          ensureFileLimit(sizeBytes, 'image');
        } catch (error: any) {
          Alert.alert('Attachment Error', error.message);
          return;
        }
        setAttachment({
          uri: asset.uri,
          name: asset.fileName || 'image.jpg',
          mimeType: asset.type || 'image/jpeg',
          sizeBytes,
          kind: 'image',
        });
      },
    );
  };

  const pickVideo = () => {
    launchImageLibrary(
      { mediaType: 'video', selectionLimit: 1 },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Attachment Error', response.errorMessage || 'Failed to pick video.');
          return;
        }
        const asset = response.assets?.[0];
        if (!asset?.uri) {
          return;
        }
        const sizeBytes = Number(asset.fileSize || 0);
        try {
          ensureFileLimit(sizeBytes, 'video');
        } catch (error: any) {
          Alert.alert('Attachment Error', error.message);
          return;
        }
        setAttachment({
          uri: asset.uri,
          name: asset.fileName || 'video.mp4',
          mimeType: asset.type || 'video/mp4',
          sizeBytes,
          kind: 'video',
        });
      },
    );
  };

  const handlePickAttachment = () => {
    Alert.alert('Select Attachment Type', 'Choose a source', [
      { text: 'Pick Document/PDF', onPress: pickDocument },
      { text: 'Pick Image', onPress: pickImage },
      { text: 'Pick Video', onPress: pickVideo },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
  };

  const handleSelectDueDate = (day: DateData) => {
    setDueDate(day.dateString);
    setDueDateModalVisible(false);
  };

  // ── Validate ──
  const validate = (): boolean => {
    if (isTeacher === false) { Alert.alert('Access Denied', 'Students cannot create assignments.'); return false; }
    if (!title.trim()) { Alert.alert('Missing', 'Please enter a title.'); return false; }
    if (!description.trim()) { Alert.alert('Missing', 'Please enter a description.'); return false; }
    if (!educationLevel) { Alert.alert('Missing', 'Please select Education Type.'); return false; }
    if (educationLevel === 'btech' && !departmentCode) { Alert.alert('Missing', 'Please select a Department.'); return false; }
    if (educationLevel === 'btech' && !yearNumber) { Alert.alert('Missing', 'Please select a Year.'); return false; }
    if (educationLevel === 'btech' && !semesterNumber) { Alert.alert('Missing', 'Please select a Semester.'); return false; }
    if (educationLevel === 'school' && !classLevel) { Alert.alert('Missing', 'Please select a Class.'); return false; }
    if (!subject) { Alert.alert('Missing', 'Please select a Subject.'); return false; }
    if (!dueDate.trim()) { Alert.alert('Missing', 'Please select a due date.'); return false; }
    if (dueDate < todayKey) { Alert.alert('Invalid', 'Due date cannot be in the past.'); return false; }
    return true;
  };

  // ── Save ──
  const handleSave = async (status: AssignmentStatus) => {
    if (!validate()) return;
    setSaving(true);

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'Not authenticated.');
        setSaving(false);
        return;
      }

      // Get teacher name from Firestore
      let teacherName = 'Teacher';
      try {
        const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
          teacherName = userDoc.data()?.name || 'Teacher';
        }
      } catch { /* fallback to 'Teacher' */ }

      let attachmentPayload: Awaited<ReturnType<typeof uploadAssignmentAttachment>> | null = null;
      if (attachment) {
        const tempId = firestore().collection('assignments').doc().id;
        attachmentPayload = await uploadAssignmentAttachment(tempId, {
          uri: attachment.uri,
          name: attachment.name,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
        });
      }

      const parsedDueDate = new Date(dueDate.trim() + 'T23:59:59');

      const assignmentData: any = {
        teacherId: currentUser.uid,
        teacherName,
        title: title.trim(),
        description: description.trim(),
        educationLevel,
        subject,
        dueDate: firestore.Timestamp.fromDate(parsedDueDate),
        status,
      };

      if (instructions.trim()) {
        assignmentData.instructions = instructions.trim();
      }
      if (educationLevel === 'btech') {
        assignmentData.departmentCode = departmentCode;
        assignmentData.department = departmentName;
        assignmentData.yearNumber = yearNumber;
        assignmentData.semesterNumber = semesterNumber;
      }
      if (educationLevel === 'school') {
        assignmentData.classLevel = classLevel;
      }
      if (totalMarks.trim()) {
        assignmentData.totalMarks = Number(totalMarks);
      }
      if (attachmentPayload) {
        assignmentData.attachmentUrl = attachmentPayload.attachmentUrl;
        assignmentData.attachmentPublicId = attachmentPayload.attachmentPublicId;
        assignmentData.attachmentResourceType = attachmentPayload.attachmentResourceType;
        assignmentData.attachmentName = attachmentPayload.attachmentName;
        assignmentData.attachmentMimeType = attachmentPayload.attachmentMimeType;
        assignmentData.attachmentSize = attachmentPayload.attachmentSize;
        assignmentData.cloudinaryPublicId = attachmentPayload.attachmentPublicId;
        assignmentData.cloudinarySecureUrl = attachmentPayload.attachmentUrl;
        assignmentData.cloudinaryResourceType = attachmentPayload.attachmentResourceType;
        assignmentData.cloudinaryFormat = attachmentPayload.cloudinaryFormat;
        assignmentData.bytes = attachmentPayload.attachmentSize;
        assignmentData.originalFilename = attachmentPayload.originalFilename;
        assignmentData.width = attachmentPayload.width;
        assignmentData.height = attachmentPayload.height;
        assignmentData.duration = attachmentPayload.duration;
      }

      await createAssignment(assignmentData);

      Alert.alert(
        '✅ Success',
        status === 'draft' ? 'Assignment saved as draft!' : 'Assignment published successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      console.error('Save assignment error:', err);
      const message = String(err?.message || '').toLowerCase();
      if (message.includes('upload') || message.includes('cloudinary') || message.includes('object-not-found')) {
        Alert.alert('Upload Failed', 'Attachment upload failed. Please try again. Your form data is still saved on this screen.');
      } else {
        Alert.alert('Error', 'Failed to save assignment. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Chip Selector Component ──
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

  // ── Render ──
  if (isTeacher === null) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!isTeacher) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
          Access Denied
        </Text>
        <Text style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 16 }}>
          Students can view and submit assignments, but cannot create assignments.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: '#0ea5e9', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* ── Gradient Header ── */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <AppBackButton navigation={navigation} fallbackRoute="TeacherAssignments" style={styles.backBtn} />
        <Text style={styles.headerTitle}>✏️ Create Assignment</Text>
        <Text style={styles.headerSubtitle}>Fill in the details below</Text>
      </LinearGradient>

      {/* ── Saving Overlay ── */}
      {saving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingBox}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.savingText}>Saving assignment...</Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40, padding: 20 }}>

        {/* ── Title ── */}
        <View style={styles.cardGroup}>
          <Text style={styles.sectionTitle}>Assignment Details</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter assignment title"
              placeholderTextColor="#475569"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />
          </View>

          {/* ── Description ── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Enter assignment description"
              placeholderTextColor="#475569"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* ── Instructions ── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Instructions (Optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Any special instructions for students"
              placeholderTextColor="#475569"
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* ── Education Level ── */}
        <Text style={styles.sectionTitle}>Class Configuration</Text>
        <View style={styles.levelRow}>
          {educationLevels.map(lvl => (
            <TouchableOpacity
              key={lvl.value}
              style={[styles.levelCard, educationLevel === lvl.value && styles.levelCardActive]}
              onPress={() => {
                setEducationLevel(lvl.value);
                setDepartmentCode('');
                setDepartmentName('');
                setClassLevel('');
                setClassName('');
                setYearNumber(null);
                setSemesterNumber(null);
                setSubject('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.levelIcon}>{lvl.icon}</Text>
              <Text style={[styles.levelLabel, educationLevel === lvl.value && styles.levelLabelActive]}>
                {lvl.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── School Config ── */}
        {educationLevel === 'school' && (
          <View style={styles.cardGroup}>
            <ChipSelector
              label="Select Class *"
              options={schoolClasses}
              selectedValue={classLevel}
              onSelect={(item) => { setClassLevel(item.level); setClassName(item.name); }}
              keyExtractor={(item) => item.level}
              labelExtractor={(item) => item.name}
            />
          </View>
        )}

        {/* ── BTech Config ── */}
        {educationLevel === 'btech' && (
          <View style={styles.cardGroup}>
            <ChipSelector
              label="Department *"
              options={btechDepts}
              selectedValue={departmentCode}
              onSelect={(item) => { setDepartmentCode(item.code); setDepartmentName(item.name); }}
              keyExtractor={(item) => item.code}
              labelExtractor={(item) => item.label}
            />
            <ChipSelector
              label="Year *"
              options={btechYears}
              selectedValue={yearNumber ? String(yearNumber) : ''}
              onSelect={(item) => {
                setYearNumber(item.number);
                setSemesterNumber(null);
              }}
              keyExtractor={(item) => String(item.number)}
              labelExtractor={(item) => item.label}
            />
            {yearNumber && (
              <ChipSelector
                label="Semester *"
                options={validSemesters}
                selectedValue={semesterNumber ? String(semesterNumber) : ''}
                onSelect={(item) => { setSemesterNumber(item.number); }}
                keyExtractor={(item) => String(item.number)}
                labelExtractor={(item) => item.label}
              />
            )}
          </View>
        )}

        {/* ── Subject ── */}
        {educationLevel && (
          <View style={styles.cardGroup}>
            {isLoadingSubjects ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#0ea5e9" size="small" />
                <Text style={styles.loadingText}>Loading subjects...</Text>
              </View>
            ) : availableSubjects.length > 0 ? (
              <ChipSelector
                label="Select Subject *"
                options={availableSubjects}
                selectedValue={subject}
                onSelect={(item: SubjectOption) => { setSubject(item.name); }}
                keyExtractor={(item) => item.id}
                labelExtractor={(item) => item.name}
              />
            ) : (
              <View style={styles.emptySubjects}>
                <Text style={styles.emptySubjectsText}>📭 No subjects available for this configuration.</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Due Date & Marks ── */}
        <View style={styles.cardGroup}>
          <Text style={styles.sectionTitleInner}>Schedule & Marks</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Due Date *</Text>
            <TouchableOpacity
              style={styles.dateSelectButton}
              activeOpacity={0.8}
              onPress={() => setDueDateModalVisible(true)}
            >
              <Text style={[styles.dateSelectText, !dueDate && styles.dateSelectPlaceholder]}>
                {dueDate ? formatReadableDate(dueDate) : 'Select due date'}
              </Text>
              <Text style={styles.dateSelectIcon}>📅</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Total Marks (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 100"
              placeholderTextColor="#475569"
              value={totalMarks}
              onChangeText={setTotalMarks}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
        </View>

        {/* ── Attachment ── */}
        <View style={styles.cardGroup}>
          <Text style={styles.sectionTitleInner}>📎 Attachment</Text>
          {attachment ? (
            <View style={styles.attachmentPreview}>
              <View style={{ flex: 1 }}>
                <Text style={styles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
                <Text style={styles.attachmentMeta} numberOfLines={1}>
                  {attachment.mimeType} · {(attachment.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                </Text>
              </View>
              <TouchableOpacity style={styles.removeAttachBtn} onPress={handleRemoveAttachment}>
                <Text style={styles.removeAttachText}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.pickFileBtn} onPress={handlePickAttachment} activeOpacity={0.7}>
              <Text style={styles.pickFileIcon}>📁</Text>
              <Text style={styles.pickFileText}>Add Attachment</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.draftBtn]}
            onPress={() => handleSave('draft')}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.draftBtnText}>📝 Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.publishBtn]}
            onPress={() => handleSave('active')}
            disabled={saving}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.publishGradient}>
              <Text style={styles.publishBtnText}>🚀 Publish</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={dueDateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDueDateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalTitle}>Select Due Date</Text>
              <TouchableOpacity onPress={() => setDueDateModalVisible(false)}>
                <Text style={styles.calendarModalClose}>×</Text>
              </TouchableOpacity>
            </View>
            <Calendar
              minDate={todayKey}
              markedDates={
                dueDate
                  ? {
                      [dueDate]: {
                        selected: true,
                        selectedColor: '#0ea5e9',
                        selectedTextColor: '#FFFFFF',
                      },
                    }
                  : {}
              }
              onDayPress={handleSelectDueDate}
              theme={{
                selectedDayBackgroundColor: '#0ea5e9',
                todayTextColor: '#0ea5e9',
                arrowColor: '#0ea5e9',
                textMonthFontWeight: '700',
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CreateAssignmentScreen;

// ═══════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#0f172a' },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
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
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#f8fafc', letterSpacing: 0.5 },
  headerSubtitle: { color: '#94a3b8', marginTop: 4, fontSize: 14, fontWeight: '500' },

  container: { flex: 1 },

  // Section
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: '#94a3b8', marginBottom: 16,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  sectionTitleInner: {
    fontSize: 14, fontWeight: '700', color: '#cbd5e1', marginBottom: 16,
  },

  // Education Level
  levelRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  levelCard: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 16, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  levelCardActive: { borderColor: '#0ea5e9', backgroundColor: '#0c4a6e' },
  levelIcon: { fontSize: 32, marginBottom: 8 },
  levelLabel: { fontSize: 13, fontWeight: '600', color: '#cbd5e1' },
  levelLabelActive: { color: '#38bdf8' },

  // Card group
  cardGroup: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 10 },

  // Chips
  chipRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155',
  },
  chipActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  chipText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#ffffff', fontWeight: '700' },

  // Inputs
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f8fafc',
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 90,
    paddingTop: 14,
  },
  dateSelectButton: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSelectText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '500',
  },
  dateSelectPlaceholder: {
    color: '#475569',
  },
  dateSelectIcon: {
    fontSize: 18,
  },

  // Loading
  loadingBox: { padding: 16, alignItems: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 8, fontSize: 13 },

  // Empty subjects
  emptySubjects: {
    padding: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  emptySubjectsText: { color: '#94a3b8', fontSize: 13 },

  // Attachment
  pickFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    paddingVertical: 20,
  },
  pickFileIcon: { fontSize: 24 },
  pickFileText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  attachmentName: { color: '#38bdf8', fontSize: 13, fontWeight: '600', flex: 1 },
  attachmentMeta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  removeAttachBtn: { marginLeft: 12 },
  removeAttachText: { color: '#fca5a5', fontSize: 13, fontWeight: '700' },

  // Action Buttons
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  draftBtn: {
    backgroundColor: '#334155',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  draftBtnText: { color: '#cbd5e1', fontSize: 15, fontWeight: '700' },
  publishBtn: {},
  publishGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  publishBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  // Saving overlay
  savingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  savingBox: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  savingText: { color: '#f8fafc', marginTop: 16, fontSize: 15, fontWeight: '600' },

  // Due Date Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  calendarModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 16,
  },
  calendarModalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  calendarModalClose: {
    fontSize: 26,
    color: '#6B7280',
    lineHeight: 26,
  },
});
