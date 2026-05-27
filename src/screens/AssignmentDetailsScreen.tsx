import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import { Assignment, AssignmentSubmission } from '../types/assignment';
import { getAssignmentById } from '../services/assignments/assignmentService';
import { getMySubmission } from '../services/assignments/submissionService';

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

const formatDate = (dateField: any): string => {
  if (!dateField) return '—';
  try {
    if (dateField.toDate) return dateField.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (dateField instanceof Date) return dateField.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return String(dateField);
  } catch {
    return '—';
  }
};

const isDueDatePassed = (dateField: any): boolean => {
  if (!dateField) return false;
  try {
    const due = dateField.toDate ? dateField.toDate() : new Date(dateField);
    return new Date() > due;
  } catch {
    return false;
  }
};

// ═══════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════

const AssignmentDetailsScreen = ({ route, navigation }: any) => {
  const { assignmentId } = route.params;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = auth().currentUser;
      if (!user) throw new Error('Not authenticated');

      const assignmentData = await getAssignmentById(assignmentId);
      if (!assignmentData) throw new Error('Assignment not found');
      
      setAssignment(assignmentData);

      const submissionData = await getMySubmission(assignmentId, user.uid);
      setSubmission(submissionData);

    } catch (err: any) {
      console.log('Error loading assignment details:', err);
      setError(err.message || 'Failed to load details.');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    // Focus listener to reload if navigating back from Submit screen
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  // ─── Status Badge ───
  const getStatusInfo = () => {
    const overdue = isDueDatePassed(assignment?.dueDate);

    if (submission) {
      const status = submission.status;
      if (status === 'reviewed') return { label: 'Reviewed', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' };
      if (status === 'resubmit_required') return { label: 'Resubmit', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
      if (status === 'late') return { label: 'Late', color: '#fb923c', bg: 'rgba(251,146,60,0.15)' };
      return { label: 'Submitted', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
    }

    if (overdue) return { label: 'Overdue', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
    return { label: 'Not Submitted', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
  };

  // ─── Loading State ───
  if (loading && !assignment) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  // ─── Error State ───
  if (error || !assignment) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorMessage}>{error || 'Assignment not found.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* ═══ Gradient Header ═══ */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Assignment Details</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        
        {/* ═══ Assignment Card ═══ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>{assignment.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          </View>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Subject:</Text>
              <Text style={styles.metaValue}>{assignment.subject}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Teacher:</Text>
              <Text style={styles.metaValue}>{assignment.teacherName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Due Date:</Text>
              <Text style={[styles.metaValue, isDueDatePassed(assignment.dueDate) && !submission && styles.overdueText]}>
                {formatDate(assignment.dueDate)}
              </Text>
            </View>
            {assignment.totalMarks !== undefined && assignment.totalMarks !== null && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Marks:</Text>
                <Text style={styles.metaValue}>{assignment.totalMarks}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{assignment.description}</Text>

          {assignment.instructions && (
            <>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <Text style={styles.description}>{assignment.instructions}</Text>
            </>
          )}

          {assignment.attachmentName && (
            <View style={styles.attachmentContainer}>
              <Text style={styles.attachmentLabel}>📎 Attached File:</Text>
              <Text style={styles.attachmentName}>{assignment.attachmentName}</Text>
            </View>
          )}
        </View>

        {/* ═══ Submission Section ═══ */}
        {submission ? (
          <View style={styles.submissionCard}>
            <Text style={styles.submissionCardTitle}>Your Submission</Text>
            <Text style={styles.submissionDate}>
              Submitted on: {formatDate(submission.submittedAt)}
            </Text>
            
            {submission.answerText && (
              <View style={styles.answerBox}>
                <Text style={styles.answerText}>{submission.answerText}</Text>
              </View>
            )}

            {submission.fileName && (
              <View style={styles.attachmentContainer}>
                <Text style={styles.attachmentLabel}>📎 Submitted File:</Text>
                <Text style={styles.attachmentName}>{submission.fileName}</Text>
              </View>
            )}

            {submission.status === 'reviewed' && (
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackTitle}>Feedback & Marks</Text>
                {submission.marksObtained !== undefined && (
                  <Text style={styles.marksText}>Score: {submission.marksObtained} {assignment.totalMarks ? `/ ${assignment.totalMarks}` : ''}</Text>
                )}
                {submission.feedback && (
                  <Text style={styles.feedbackText}>Teacher note: {submission.feedback}</Text>
                )}
              </View>
            )}
            
            {submission.status === 'resubmit_required' && (
              <>
                <View style={[styles.feedbackBox, { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' }]}>
                  <Text style={[styles.feedbackTitle, { color: '#f59e0b' }]}>Resubmission Required</Text>
                  {submission.feedback && (
                    <Text style={styles.feedbackText}>{submission.feedback}</Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={[styles.submitButton, { marginTop: 15 }]} 
                  onPress={() => navigation.navigate('SubmitAssignment', { assignmentId: assignment.assignmentId })}
                >
                  <Text style={styles.submitButtonText}>Edit Submission</Text>
                </TouchableOpacity>
              </>
            )}

          </View>
        ) : (
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={() => navigation.navigate('SubmitAssignment', { assignmentId: assignment.assignmentId })}
          >
            <Text style={styles.submitButtonText}>Submit Assignment</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
};

export default AssignmentDetailsScreen;

// ═══════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════

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
    paddingHorizontal: 30,
  },
  
  // ─── Header ───
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
  backIcon: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },

  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  // ─── Cards ───
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.08)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  metaContainer: {
    backgroundColor: 'rgba(15,23,42,0.5)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  metaLabel: {
    width: 80,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  metaValue: {
    flex: 1,
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  overdueText: {
    color: '#ef4444',
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.1)',
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 24,
    marginBottom: 20,
  },

  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56,189,248,0.1)',
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.2)',
  },
  attachmentLabel: {
    fontSize: 14,
    color: '#38bdf8',
    fontWeight: 'bold',
    marginRight: 8,
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    color: '#f8fafc',
  },

  submissionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  submissionCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 6,
  },
  submissionDate: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16,
  },
  answerBox: {
    backgroundColor: 'rgba(15,23,42,0.5)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  answerText: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
  },

  feedbackBox: {
    marginTop: 20,
    backgroundColor: 'rgba(56,189,248,0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.2)',
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 10,
  },
  marksText: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  feedbackText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },

  submitButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Error
  errorEmoji: { fontSize: 56, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
  errorMessage: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  retryButton: { backgroundColor: '#0ea5e9', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  retryButtonText: { color: '#f8fafc', fontSize: 15, fontWeight: 'bold' },
});
