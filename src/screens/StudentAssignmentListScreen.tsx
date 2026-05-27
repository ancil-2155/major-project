import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Assignment, AssignmentSubmission } from '../types/assignment';
import { getStudentAssignments } from '../services/assignments/assignmentService';
import { getMySubmission } from '../services/assignments/submissionService';
import AppBackButton from '../components/common/AppBackButton';

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════

const parseNumberFromField = (value: any): number | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const digits = value.match(/\d+/);
    if (digits) return parseInt(digits[0], 10);
  }
  return undefined;
};

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
// TYPES
// ═══════════════════════════════════════════════════

interface AssignmentWithStatus extends Assignment {
  submission: AssignmentSubmission | null;
}

// ═══════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════

const StudentAssignmentListScreen = ({ navigation }: any) => {
  const [assignments, setAssignments] = useState<AssignmentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const user = auth().currentUser;
      if (!user) {
        setError('You must be logged in to view assignments.');
        setLoading(false);
        return;
      }

      // Load student profile
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      if (!userData) {
        setError('Student profile not found.');
        setLoading(false);
        return;
      }

      // Build student profile for query
      const yearNumber = parseNumberFromField(userData.year || userData.yearNumber);
      const semesterNumber = parseNumberFromField(userData.semester || userData.semesterNumber);

      const studentProfile = {
        educationLevel: userData.educationLevel || 'btech',
        departmentCode: userData.departmentCode || userData.department || '',
        department: userData.department || userData.departmentCode || '',
        yearNumber,
        semesterNumber,
        year: userData.year,
        semester: userData.semester,
        classLevel: userData.classLevel || userData.class || '',
      };

      // Fetch assignments matching profile
      const assignmentList = await getStudentAssignments(studentProfile);

      // Check submission status for each assignment
      const assignmentsWithStatus: AssignmentWithStatus[] = await Promise.all(
        assignmentList.map(async (assignment) => {
          let submission: AssignmentSubmission | null = null;
          try {
            submission = await getMySubmission(assignment.assignmentId, user.uid);
          } catch (e) {
            console.log('Error checking submission for', assignment.assignmentId, e);
          }
          return { ...assignment, submission };
        })
      );

      // Sort by due date descending
      assignmentsWithStatus.sort((a, b) => {
        const dateA = a.dueDate && (a.dueDate as any).toDate ? (a.dueDate as any).toDate().getTime() : 0;
        const dateB = b.dueDate && (b.dueDate as any).toDate ? (b.dueDate as any).toDate().getTime() : 0;
        return dateB - dateA;
      });

      setAssignments(assignmentsWithStatus);
    } catch (err: any) {
      console.log('Error loading assignments:', err);
      const message = String(err?.message || '');
      if (
        err?.code === 'firestore/failed-precondition' ||
        message.toLowerCase().includes('requires an index')
      ) {
        setError('Assignments are loading. Please try again in a moment.');
      } else {
        setError('Failed to load assignments. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAssignments(true);
  };

  // ─── Status Badge ───
  const getStatusInfo = (item: AssignmentWithStatus) => {
    const overdue = isDueDatePassed(item.dueDate);

    if (item.submission) {
      const status = item.submission.status;
      if (status === 'reviewed') return { label: 'Reviewed', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' };
      if (status === 'resubmit_required') return { label: 'Resubmit', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
      if (status === 'late') return { label: 'Late', color: '#fb923c', bg: 'rgba(251,146,60,0.15)' };
      return { label: 'Submitted', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
    }

    if (overdue) return { label: 'Overdue', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
    return { label: 'Not Submitted', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
  };

  // ─── Render Card ───
  const renderItem = ({ item }: { item: AssignmentWithStatus }) => {
    const statusInfo = getStatusInfo(item);
    const overdue = isDueDatePassed(item.dueDate) && !item.submission;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('AssignmentDetails', { assignmentId: item.assignmentId })}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardEmoji}>📝</Text>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        {/* Subject & Teacher */}
        <View style={styles.cardInfoRow}>
          <Text style={styles.cardInfoLabel}>📚</Text>
          <Text style={styles.cardInfoValue}>{item.subject || 'No Subject'}</Text>
        </View>
        <View style={styles.cardInfoRow}>
          <Text style={styles.cardInfoLabel}>👨‍🏫</Text>
          <Text style={styles.cardInfoValue}>{item.teacherName || 'Unknown Teacher'}</Text>
        </View>

        {/* Bottom Row: Due Date & Marks */}
        <View style={styles.cardFooter}>
          <View style={styles.dueDateContainer}>
            <Text style={styles.cardInfoLabel}>📅</Text>
            <Text style={[styles.dueDateText, overdue && styles.overdueText]}>
              {overdue ? 'Overdue · ' : 'Due: '}{formatDate(item.dueDate)}
            </Text>
          </View>
          {item.totalMarks !== undefined && item.totalMarks !== null && (
            <View style={styles.marksContainer}>
              <Text style={styles.marksText}>🏆 {item.totalMarks} marks</Text>
            </View>
          )}
        </View>

        {/* Reviewed marks preview */}
        {item.submission?.status === 'reviewed' && item.submission.marksObtained !== undefined && (
          <View style={styles.reviewedBar}>
            <Text style={styles.reviewedBarText}>
              ✅ Scored {item.submission.marksObtained}{item.totalMarks ? `/${item.totalMarks}` : ''} marks
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ─── Loading State ───
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading assignments...</Text>
      </View>
    );
  }

  // ─── Error State ───
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadAssignments()}>
          <Text style={styles.retryButtonText}>🔄  Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          <AppBackButton navigation={navigation} fallbackRoute="StudentHome" style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </AppBackButton>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>📋 My Assignments</Text>
            <Text style={styles.headerSubtitle}>{assignments.length} assignment{assignments.length !== 1 ? 's' : ''} found</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      {/* ═══ Assignment List ═══ */}
      <FlatList
        data={assignments}
        keyExtractor={(item) => item.assignmentId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0ea5e9"
            colors={['#0ea5e9']}
            progressBackgroundColor="#1e293b"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No Assignments Found</Text>
            <Text style={styles.emptyMessage}>No assignments found for your class. Pull down to refresh.</Text>
          </View>
        }
      />
    </View>
  );
};

export default StudentAssignmentListScreen;

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
  loadingText: {
    color: '#94a3b8',
    fontSize: 15,
    marginTop: 16,
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
  backIcon: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f8fafc',
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
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },

  // ─── List ───
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  // ─── Card ───
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
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
    marginBottom: 14,
  },
  cardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 10,
  },
  cardEmoji: {
    fontSize: 18,
    marginRight: 8,
    marginTop: 1,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#f8fafc',
    lineHeight: 24,
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

  // ─── Card Info ───
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 2,
  },
  cardInfoLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  cardInfoValue: {
    fontSize: 14,
    color: '#cbd5e1',
    flex: 1,
  },

  // ─── Card Footer ───
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.08)',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  overdueText: {
    color: '#ef4444',
    fontWeight: '700',
  },
  marksContainer: {
    backgroundColor: 'rgba(14,165,233,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  marksText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '600',
  },

  // ─── Reviewed Bar ───
  reviewedBar: {
    marginTop: 12,
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.15)',
  },
  reviewedBarText: {
    fontSize: 13,
    color: '#22c55e',
    fontWeight: '600',
  },

  // ─── Error ───
  errorEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryButtonText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // ─── Empty ───
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 21,
  },
});
