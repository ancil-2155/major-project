import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { getAssignmentById, closeAssignment } from '../services/assignments/assignmentService';
import { getAllSubmissions } from '../services/assignments/submissionService';
import { Assignment, AssignmentSubmission } from '../types/assignment';

// ═══════════════════════════════════════════════════
// ASSIGNMENT SUBMISSIONS SCREEN
// ═══════════════════════════════════════════════════

const SUBMISSION_STATUS_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  submitted: { bg: '#0c4a6e', text: '#38bdf8', border: '#0369a1', label: 'SUBMITTED' },
  late: { bg: '#451a03', text: '#fdba74', border: '#78350f', label: 'LATE' },
  reviewed: { bg: '#064e3b', text: '#34d399', border: '#065f46', label: 'REVIEWED' },
  resubmit_required: { bg: '#450a0a', text: '#fca5a5', border: '#7f1d1d', label: 'RESUBMIT' },
};

const AssignmentSubmissionsScreen = ({ navigation, route }: any) => {
  const { assignmentId } = route.params;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  // ── Load data ──
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const [assignmentData, submissionsData] = await Promise.all([
        getAssignmentById(assignmentId),
        getAllSubmissions(assignmentId),
      ]);

      if (!assignmentData) {
        setError('Assignment not found.');
        setLoading(false);
        return;
      }

      setAssignment(assignmentData);
      setSubmissions(submissionsData);
    } catch (err: any) {
      console.error('Load submissions error:', err);
      setError(err?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assignmentId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  // ── Close Assignment ──
  const handleCloseAssignment = () => {
    Alert.alert(
      '⚠️ Close Assignment',
      'Are you sure you want to close this assignment? Students will no longer be able to submit.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            setClosing(true);
            try {
              await closeAssignment(assignmentId);
              Alert.alert('✅ Done', 'Assignment has been closed.');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to close assignment.');
            } finally {
              setClosing(false);
            }
          },
        },
      ]
    );
  };

  // ── Counts ──
  const totalSubmitted = submissions.length;
  const reviewedCount = submissions.filter(s => s.status === 'reviewed').length;
  const pendingCount = submissions.filter(s => s.status === 'submitted' || s.status === 'late').length;

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

  const formatDueDate = (dueDate: any): string => {
    try {
      const date = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  // ── Render submission card ──
  const renderSubmissionCard = ({ item }: { item: AssignmentSubmission }) => {
    const statusConfig = SUBMISSION_STATUS_COLORS[item.status] || SUBMISSION_STATUS_COLORS.submitted;

    return (
      <TouchableOpacity
        style={styles.subCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ReviewSubmission', {
          assignmentId,
          studentId: item.studentId,
        })}
      >
        <View style={styles.subCardHeader}>
          <View style={styles.subCardLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(item.studentName || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.subCardInfo}>
              <Text style={styles.subCardName} numberOfLines={1}>{item.studentName}</Text>
              {item.rollNo ? (
                <Text style={styles.subCardRoll}>Roll: {item.rollNo}</Text>
              ) : null}
            </View>
          </View>
          <View style={[styles.subStatusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
            <Text style={[styles.subStatusText, { color: statusConfig.text }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.subCardFooter}>
          <Text style={styles.subCardTime}>🕐 {formatTime(item.submittedAt)}</Text>
          {item.marksObtained !== undefined && item.marksObtained !== null && (
            <Text style={styles.subCardMarks}>📊 {item.marksObtained} marks</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ── Main render ──
  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading submissions...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Submissions</Text>
        </LinearGradient>
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* ── Gradient Header ── */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>📝 {assignment?.title || 'Submissions'}</Text>
        <Text style={styles.headerSubtitle}>
          {assignment?.subject} · Due: {formatDueDate(assignment?.dueDate)}
        </Text>
      </LinearGradient>

      {/* ── Summary Bar ── */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{totalSubmitted}</Text>
          <Text style={styles.summaryLabel}>Submitted</Text>
        </View>
        <View style={[styles.summaryDivider]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: '#34d399' }]}>{reviewedCount}</Text>
          <Text style={styles.summaryLabel}>Reviewed</Text>
        </View>
        <View style={[styles.summaryDivider]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: '#fdba74' }]}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      {/* ── Assignment Status / Close Button ── */}
      {assignment?.status === 'active' && (
        <View style={styles.closeRow}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleCloseAssignment}
            disabled={closing}
            activeOpacity={0.8}
          >
            {closing ? (
              <ActivityIndicator color="#fca5a5" size="small" />
            ) : (
              <Text style={styles.closeBtnText}>🔒 Close Assignment</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {assignment?.status === 'closed' && (
        <View style={styles.closedBanner}>
          <Text style={styles.closedBannerText}>🔒 This assignment is closed</Text>
        </View>
      )}

      {/* ── Submissions List ── */}
      {submissions.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No Submissions Yet</Text>
          <Text style={styles.emptySubtitle}>Students haven't submitted any work for this assignment.</Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={item => item.submissionId || item.studentId}
          renderItem={renderSubmissionCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#0ea5e9"
              colors={['#0ea5e9']}
            />
          }
        />
      )}
    </View>
  );
};

export default AssignmentSubmissionsScreen;

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

  // Summary Bar
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { fontSize: 24, fontWeight: '800', color: '#38bdf8' },
  summaryLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#334155' },

  // Close button
  closeRow: { paddingHorizontal: 16, marginTop: 12 },
  closeBtn: {
    backgroundColor: '#450a0a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  closeBtnText: { color: '#fca5a5', fontSize: 14, fontWeight: '700' },

  closedBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  closedBannerText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },

  // Center states
  centerBox: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40,
  },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { color: '#fca5a5', fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#0ea5e9', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginBottom: 6 },
  emptySubtitle: { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // List
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30 },

  // Submission Card
  subCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  subCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 10,
  },
  subCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  avatarCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#0c4a6e',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#0369a1',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#38bdf8' },
  subCardInfo: { flex: 1 },
  subCardName: { fontSize: 15, fontWeight: '700', color: '#f8fafc' },
  subCardRoll: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  subStatusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, marginLeft: 8,
  },
  subStatusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  subCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
  },
  subCardTime: { fontSize: 12, color: '#64748b' },
  subCardMarks: { fontSize: 12, color: '#34d399', fontWeight: '600' },
});
