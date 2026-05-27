import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { Assignment, AssignmentSubmission } from '../types/assignment';
import { getAssignmentById } from '../services/assignments/assignmentService';
import {
  getMySubmission,
  submitAssignment,
  uploadSubmissionFile,
} from '../services/assignments/submissionService';
import AppBackButton from '../components/common/AppBackButton';

type SelectedAttachment = {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: 'document' | 'image' | 'video';
};

const MAX_DOC_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const SubmitAssignmentScreen = ({ route, navigation }: any) => {
  const { assignmentId } = route.params;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [attachment, setAttachment] = useState<SelectedAttachment | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const user = auth().currentUser;
        if (!user) {
          throw new Error('Not logged in');
        }

        const assignmentData = await getAssignmentById(assignmentId);
        setAssignment(assignmentData);

        const subData = await getMySubmission(assignmentId, user.uid);
        if (subData) {
          setSubmission(subData);
          if (subData.status === 'resubmit_required') {
            setAnswerText(subData.answerText || '');
          } else {
            Alert.alert('Info', 'Assignment already submitted.');
            navigation.goBack();
          }
        }
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to load details.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [assignmentId, navigation]);

  const ensureLimit = (sizeBytes: number, kind: 'document' | 'image' | 'video') => {
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
      ensureLimit(sizeBytes, 'document');

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
        if (!asset?.uri) return;

        const sizeBytes = Number(asset.fileSize || 0);
        try {
          ensureLimit(sizeBytes, 'image');
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
        if (!asset?.uri) return;

        const sizeBytes = Number(asset.fileSize || 0);
        try {
          ensureLimit(sizeBytes, 'video');
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

  const handleSubmit = async () => {
    if (!answerText.trim() && !attachment) {
      Alert.alert('Wait', 'Please provide an answer or attach a file.');
      return;
    }

    Alert.alert('Confirm Submission', 'Are you sure you want to submit this assignment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: async () => {
          try {
            setSubmitting(true);
            const user = auth().currentUser;
            if (!user) {
              throw new Error('Not logged in');
            }

            const userDoc = await firestore().collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            if (!userData) {
              throw new Error('User profile not found');
            }

            let uploaded: Awaited<ReturnType<typeof uploadSubmissionFile>> | null = null;
            if (attachment) {
              uploaded = await uploadSubmissionFile(assignmentId, user.uid, {
                uri: attachment.uri,
                name: attachment.name,
                mimeType: attachment.mimeType,
                sizeBytes: attachment.sizeBytes,
              });
            }

            const dueValue: any = assignment?.dueDate;
            const dueDate = dueValue?.toDate ? dueValue.toDate() : dueValue ? new Date(dueValue) : null;
            const isLate = dueDate ? new Date() > dueDate : false;

            await submitAssignment(assignmentId, user.uid, {
              studentName: userData.name || userData.fullName || 'Student',
              rollNo: userData.rollNo || userData.admissionNo,
              email: user.email || '',
              answerText: answerText.trim(),
              fileUrl: uploaded?.fileUrl,
              filePublicId: uploaded?.filePublicId,
              fileResourceType: uploaded?.fileResourceType,
              filePath: uploaded?.filePath,
              fileName: uploaded?.fileName,
              fileType: uploaded?.fileType,
              fileSize: uploaded?.fileSize,
              cloudinaryFormat: uploaded?.cloudinaryFormat,
              originalFilename: uploaded?.originalFilename,
              width: uploaded?.width,
              height: uploaded?.height,
              duration: uploaded?.duration,
              isLate,
            });

            Alert.alert('Success', 'Assignment submitted successfully!');
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to submit assignment.');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <AppBackButton navigation={navigation} fallbackRoute="StudentAssignments" style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Submit Assignment</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <Text style={styles.assignmentTitle}>{assignment?.title}</Text>
        <Text style={styles.instructionText}>Provide your answer below or attach a file.</Text>

        {submission?.status === 'resubmit_required' && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>Resubmission requested by teacher.</Text>
          </View>
        )}

        <Text style={styles.label}>Your Answer</Text>
        <TextInput
          style={styles.inputArea}
          placeholder="Type your answer here..."
          placeholderTextColor="#64748b"
          multiline
          textAlignVertical="top"
          value={answerText}
          onChangeText={setAnswerText}
        />

        <Text style={styles.label}>Attachment</Text>
        <TouchableOpacity style={styles.attachButton} onPress={handlePickAttachment}>
          <Text style={styles.attachButtonText}>{attachment ? 'Change Attachment' : 'Add Attachment'}</Text>
        </TouchableOpacity>

        {attachment && (
          <View style={styles.fileBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName} numberOfLines={1}>
                {attachment.name}
              </Text>
              <Text style={styles.fileMeta} numberOfLines={1}>
                {attachment.mimeType} · {(attachment.sizeBytes / (1024 * 1024)).toFixed(2)} MB
              </Text>
            </View>
            <TouchableOpacity onPress={() => setAttachment(null)}>
              <Text style={styles.removeFile}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Now</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(148,163,184,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  scrollContent: { flex: 1 },
  scrollContentContainer: { padding: 20, paddingBottom: 40 },
  assignmentTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 15,
    color: '#94a3b8',
    marginBottom: 24,
  },
  warningBox: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    marginBottom: 20,
  },
  warningText: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#cbd5e1',
    marginBottom: 10,
  },
  inputArea: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#f8fafc',
    fontSize: 16,
    height: 150,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    marginBottom: 24,
  },
  attachButton: {
    backgroundColor: 'rgba(56,189,248,0.15)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
  },
  attachButtonText: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  fileName: {
    color: '#f8fafc',
    marginRight: 10,
    fontWeight: '600',
  },
  fileMeta: {
    color: '#94a3b8',
    marginTop: 2,
    fontSize: 12,
  },
  removeFile: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#64748b',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SubmitAssignmentScreen;
