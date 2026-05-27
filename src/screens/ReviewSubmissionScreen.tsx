import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import { getMySubmission, reviewSubmission } from '../services/assignments/submissionService';
import { AssignmentSubmission } from '../types/assignment';

// ═══════════════════════════════════════════════════
// REVIEW SUBMISSION SCREEN
// ═══════════════════════════════════════════════════

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  submitted: { bg: '#0c4a6e', text: '#38bdf8', border: '#0369a1', label: 'SUBMITTED' },
  late: { bg: '#451a03', text: '#fdba74', border: '#78350f', label: 'LATE' },
  reviewed: { bg: '#064e3b', text: '#34d399', border: '#065f46', label: 'REVIEWED' },
  resubmit_required: { bg: '#450a0a', text: '#fca5a5', border: '#7f1d1d', label: 'RESUBMIT' },
};

const ReviewSubmissionScreen = ({ navigation, route }: any) => {
  const { assignmentId, studentId } = route.params;

  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Review form
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');

  // ── Load submission ──
  const loadSubmission = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMySubmission(assignmentId, studentId);
      if (!data) {
        setError('Submission not found.');
        setLoading(false);
        return;
      }
      setSubmission(data);
      // Pre-fill if already reviewed
      if (data.marksObtained !== undefined && data.marksObtained !== null) {
        setMarks(String(data.marksObtained));
      }
      if (data.feedback) {
        setFeedback(data.feedback);
      }
    } catch (err: any) {
      console.error('Load submission error:', err);
      setError(err?.message || 'Failed to load submission.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmission();
  }, [assignmentId, studentId]);

  // ── Format time ──
  const formatTime = (ts: any): string => {
    try {
      const date = ts?.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  // ── Handle review ──
  const handleReview = async (status: 'reviewed' | 'resubmit_required') => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'Not authenticated.');
      return;
    }

    if (status === 'reviewed' && marks.trim() && isNaN(Number(marks))) {
      Alert.alert('Invalid', 'Marks must be a valid number.');
      return;
    }

    const actionLabel = status === 'reviewed' ? 'Mark as Reviewed' : 'Request Resubmission';

    Alert.alert(
      `${status === 'reviewed' ? '✅' : '🔄'} ${actionLabel}`,
      `Are you sure you want to ${actionLabel.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setSaving(true);
            try {
              await reviewSubmission(assignmentId, studentId, {
                marksObtained: marks.trim() ? Number(marks) : undefined,
                feedback: feedback.trim() || undefined,
                reviewedBy: currentUser.uid,
                status,
              });

              Alert.alert(
                '✅ Success',
                status === 'reviewed'
                  ? 'Submission has been reviewed.'
                  : 'Resubmission has been requested.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (err: any) {
              console.error('Review error:', err);
              Alert.alert('Error', err?.message || 'Failed to save review.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  // ── Open file link ──
  const handleOpenFile = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Cannot open this file link.');
    });
  };

  // ── Render ──
  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading submission...</Text>
        </View>
      </View>
    );
  }

  if (error || !submission) {
    return (
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Submission</Text>
        </LinearGradient>
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>{error || 'Submission not found.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadSubmission}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusConfig = STATUS_COLORS[submission.status] || STATUS_COLORS.submitted;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* ── Gradient Header ── */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 Review Submission</Text>
        <Text style={styles.headerSubtitle}>Grade and provide feedback</Text>
      </LinearGradient>

      {/* ── Saving Overlay ── */}
      {saving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingBox}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.savingText}>Saving review...</Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40, padding: 20 }}>

        {/* ── Student Info Card ── */}
        <View style={styles.studentCard}>
          <View style={styles.studentRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(submission.studentName || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{submission.studentName}</Text>
              {submission.rollNo ? (
                <Text style={styles.studentRoll}>Roll No: {submission.rollNo}</Text>
              ) : null}
              {submission.email ? (
                <Text style={styles.studentEmail}>{submission.email}</Text>
              ) : null}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
              <Text style={[styles.statusText, { color: statusConfig.text }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
          <View style={styles.studentMeta}>
            <Text style={styles.metaText}>🕐 Submitted: {formatTime(submission.submittedAt)}</Text>
          </View>
        </View>

        {/* ── Answer Card ── */}
        <View style={styles.cardGroup}>
          <Text style={styles.sectionTitle}>📝 Student's Answer</Text>
          {submission.answerText ? (
            <View style={styles.answerBox}>
              <Text style={styles.answerText}>{submission.answerText}</Text>
            </View>
          ) : (
            <View style={styles.noAnswerBox}>
              <Text style={styles.noAnswerText}>No text answer provided.</Text>
            </View>
          )}
        </View>

        {/* ── File Attachment ── */}
        {submission.fileUrl ? (
          <View style={styles.cardGroup}>
            <Text style={styles.sectionTitle}>📎 Attached File</Text>
            <TouchableOpacity
              style={styles.fileLink}
              onPress={() => handleOpenFile(submission.fileUrl!)}
              activeOpacity={0.7}
            >
              <Text style={styles.fileLinkIcon}>📄</Text>
              <View style={styles.fileLinkInfo}>
                <Text style={styles.fileLinkName} numberOfLines={1}>
                  {submission.fileName || 'Download File'}
                </Text>
                <Text style={styles.fileLinkHint}>Tap to open</Text>
              </View>
              <Text style={styles.fileLinkArrow}>→</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── Review Form ── */}
        <View style={styles.cardGroup}>
          <Text style={styles.sectionTitle}>⭐ Review</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Marks</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter marks (optional)"
              placeholderTextColor="#475569"
              value={marks}
              onChangeText={setMarks}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Feedback</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Provide feedback to the student (optional)"
              placeholderTextColor="#475569"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.resubmitBtn]}
            onPress={() => handleReview('resubmit_required')}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.resubmitBtnText}>🔄 Resubmit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.reviewBtn]}
            onPress={() => handleReview('reviewed')}
            disabled={saving}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#059669', '#047857']} style={styles.reviewGradient}>
              <Text style={styles.reviewBtnText}>✅ Reviewed</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default ReviewSubmissionScreen;

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
  backIcon: { fontSize: 20, color: '#f8fafc' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#f8fafc', letterSpacing: 0.5 },
  headerSubtitle: { color: '#94a3b8', marginTop: 4, fontSize: 14, fontWeight: '500' },

  container: { flex: 1 },

  // Center states
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { color: '#fca5a5', fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#0ea5e9', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Student Card
  studentCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#0c4a6e',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#0369a1',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#38bdf8' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  studentRoll: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  studentEmail: { fontSize: 12, color: '#64748b', marginTop: 1 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  studentMeta: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  metaText: { fontSize: 12, color: '#64748b' },

  // Card group
  cardGroup: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#cbd5e1', marginBottom: 14,
  },

  // Answer
  answerBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  answerText: { color: '#e2e8f0', fontSize: 14, lineHeight: 22 },
  noAnswerBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  noAnswerText: { color: '#64748b', fontSize: 13, fontStyle: 'italic' },

  // File link
  fileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    gap: 12,
  },
  fileLinkIcon: { fontSize: 28 },
  fileLinkInfo: { flex: 1 },
  fileLinkName: { color: '#38bdf8', fontSize: 14, fontWeight: '600' },
  fileLinkHint: { color: '#64748b', fontSize: 11, marginTop: 2 },
  fileLinkArrow: { fontSize: 18, color: '#38bdf8', fontWeight: '700' },

  // Form
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 10 },
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
  inputMultiline: { minHeight: 100, paddingTop: 14 },

  // Action Buttons
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  resubmitBtn: {
    backgroundColor: '#450a0a',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  resubmitBtnText: { color: '#fca5a5', fontSize: 15, fontWeight: '700' },
  reviewBtn: {},
  reviewGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  reviewBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  // Saving overlay
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
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
});
