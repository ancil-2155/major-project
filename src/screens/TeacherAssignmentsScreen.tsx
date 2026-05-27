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
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import { getTeacherAssignments } from '../services/assignments/assignmentService';
import { Assignment, AssignmentStatus } from '../types/assignment';

// ═══════════════════════════════════════════════════
// TEACHER ASSIGNMENTS SCREEN
// ═══════════════════════════════════════════════════

type TabFilter = 'all' | AssignmentStatus;

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: '#064e3b', text: '#34d399', border: '#065f46' },
  closed: { bg: '#450a0a', text: '#fca5a5', border: '#7f1d1d' },
  draft: { bg: '#1e293b', text: '#94a3b8', border: '#475569' },
};

const TAB_OPTIONS: { key: TabFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'closed', label: 'Closed' },
  { key: 'draft', label: 'Draft' },
];

const TeacherAssignmentsScreen = ({ navigation }: any) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load assignments ──
  const loadAssignments = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const currentUser = auth().currentUser;
      if (!currentUser) {
        setError('Not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      const data = await getTeacherAssignments(currentUser.uid);
      setAssignments(data);
      if (activeTab === 'all') {
        setFilteredAssignments(data);
      } else {
        setFilteredAssignments(data.filter(a => a.status === activeTab));
      }
    } catch (err: any) {
      console.error('Load assignments error:', err);
      const message = String(err?.message || '');
      if (
        err?.code === 'firestore/failed-precondition' ||
        message.toLowerCase().includes('requires an index')
      ) {
        setError('Assignments are loading. Please try again in a moment.');
      } else {
        setError('Failed to load assignments.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadAssignments();
    }, [loadAssignments])
  );

  // ── Filter logic ──
  const applyFilter = (tab: TabFilter, data?: Assignment[]) => {
    const source = data || assignments;
    if (tab === 'all') {
      setFilteredAssignments(source);
    } else {
      setFilteredAssignments(source.filter(a => a.status === tab));
    }
  };

  const handleTabChange = (tab: TabFilter) => {
    setActiveTab(tab);
    applyFilter(tab);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAssignments(true);
  };

  // ── Format due date ──
  const formatDueDate = (dueDate: any): string => {
    try {
      const date = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  // ── Render assignment card ──
  const renderAssignmentCard = ({ item }: { item: Assignment }) => {
    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.draft;
    const deptDisplay = item.educationLevel === 'school'
      ? `🏫 School · ${item.classLevel || ''}`
      : `🎓 ${item.departmentCode || item.department || 'BTech'}`;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('AssignmentSubmissions', { assignmentId: item.assignmentId })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg, borderColor: statusColor.border }]}>
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardInfoRow}>
            <Text style={styles.cardInfoLabel}>📘 Subject</Text>
            <Text style={styles.cardInfoValue} numberOfLines={1}>{item.subject}</Text>
          </View>
          <View style={styles.cardInfoRow}>
            <Text style={styles.cardInfoLabel}>🏛️ Level</Text>
            <Text style={styles.cardInfoValue} numberOfLines={1}>{deptDisplay}</Text>
          </View>
          <View style={styles.cardInfoRow}>
            <Text style={styles.cardInfoLabel}>📅 Due</Text>
            <Text style={styles.cardInfoValue}>{formatDueDate(item.dueDate)}</Text>
          </View>
          {item.totalMarks !== undefined && item.totalMarks !== null && (
            <View style={styles.cardInfoRow}>
              <Text style={styles.cardInfoLabel}>📊 Marks</Text>
              <Text style={styles.cardInfoValue}>{item.totalMarks}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ── Main render ──
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* ── Gradient Header ── */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📋 My Assignments</Text>
        <Text style={styles.headerSubtitle}>Manage your class assignments</Text>
      </LinearGradient>

      {/* ── Tab Filters ── */}
      <View style={styles.tabContainer}>
        {TAB_OPTIONS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => handleTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadAssignments()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredAssignments.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No Assignments Found</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'all'
              ? 'Create your first assignment using the button below.'
              : `No ${activeTab} assignments found.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAssignments}
          keyExtractor={item => item.assignmentId}
          renderItem={renderAssignmentCard}
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

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CreateAssignment')}
      >
        <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.fabGradient}>
          <Text style={styles.fabIcon}>＋</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default TeacherAssignmentsScreen;

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
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#f8fafc', letterSpacing: 0.5 },
  headerSubtitle: { color: '#94a3b8', marginTop: 4, fontSize: 14, fontWeight: '500' },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabBtnActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  tabText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#ffffff', fontWeight: '700' },

  // Center states
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { color: '#fca5a5', fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginBottom: 6 },
  emptySubtitle: { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // List
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#f8fafc' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  cardBody: { padding: 16, gap: 8 },
  cardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardInfoLabel: { fontSize: 13, color: '#64748b', width: 90 },
  cardInfoValue: { fontSize: 13, color: '#cbd5e1', fontWeight: '500', flex: 1 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: { fontSize: 28, color: '#ffffff', fontWeight: '700' },
});
