import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import AppBackButton from '../../components/common/AppBackButton';
import {
  loadStudentAttendanceSummary,
  SubjectAttendanceSummary,
} from '../../services/attendance/studentAttendanceService';

const getStatusColor = (percentage: number) => {
  if (percentage >= 75) {
    return '#10B981';
  }
  if (percentage >= 60) {
    return '#F59E0B';
  }
  return '#EF4444';
};

const StudentAttendanceScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overallPercentage, setOverallPercentage] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [subjects, setSubjects] = useState<SubjectAttendanceSummary[]>([]);

  const loadData = useCallback(async (refresh = false) => {
    try {
      if (!refresh) {
        setLoading(true);
      }
      setError(null);
      const user = auth().currentUser;
      if (!user) {
        setError('Please login again to view attendance.');
        return;
      }
      const summary = await loadStudentAttendanceSummary(user.uid);
      setOverallPercentage(summary.overallPercentage);
      setTotalClasses(summary.totalClasses);
      setPresentCount(summary.presentCount);
      setAbsentCount(summary.absentCount);
      setSubjects(summary.subjects);
    } catch (err: any) {
      console.error('Student attendance load error:', err);
      const message = String(err?.message || '');
      if (
        err?.code === 'firestore/failed-precondition' ||
        message.toLowerCase().includes('requires an index')
      ) {
        setError('Attendance is loading. Please try again in a moment.');
      } else {
        setError('Unable to load attendance right now.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const progressWidth = useMemo(() => `${Math.max(0, Math.min(100, overallPercentage))}%`, [overallPercentage]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.header}>
        <AppBackButton navigation={navigation} fallbackRoute="StudentHome" style={styles.backBtn} />
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>My Attendance</Text>
          <Text style={styles.headerSubtitle}>Subject-wise percentage</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadData()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={item => item.subject}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4F46E5"
              colors={['#4F46E5']}
            />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Overall Attendance</Text>
              <Text style={styles.summaryPercent}>{overallPercentage}%</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: progressWidth as any }]} />
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryStat}>Total: {totalClasses}</Text>
                <Text style={styles.summaryStat}>Present: {presentCount}</Text>
                <Text style={styles.summaryStat}>Absent: {absentCount}</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Attendance Records</Text>
              <Text style={styles.emptySubtitle}>Your attendance will appear after teachers submit sessions.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusColor = getStatusColor(item.percentage);
            return (
              <TouchableOpacity
                style={styles.subjectCard}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('SubjectAttendanceDetails', {
                    subject: item.subject,
                    teacherName: item.teacherName,
                    percentage: item.percentage,
                    present: item.present,
                    absent: item.absent,
                    total: item.total,
                    records: item.records,
                  })
                }
              >
                <View style={styles.subjectRow}>
                  <Text style={styles.subjectTitle}>{item.subject}</Text>
                  <View style={[styles.badge, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>{item.percentage}%</Text>
                  </View>
                </View>
                <Text style={styles.subjectMeta}>{item.present} present / {item.total} total</Text>
                <View style={styles.subjectTrack}>
                  <View
                    style={[
                      styles.subjectBar,
                      {
                        width: `${Math.max(0, Math.min(100, item.percentage))}%` as any,
                        backgroundColor: statusColor,
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerTextWrap: { marginLeft: 12, flex: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  headerSubtitle: { color: '#CBD5E1', marginTop: 2, fontSize: 13 },
  listContent: { padding: 16, paddingBottom: 32 },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  summaryPercent: { color: '#4F46E5', fontSize: 34, fontWeight: '800', marginVertical: 8 },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4F46E5',
  },
  summaryRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStat: { color: '#475569', fontSize: 12, fontWeight: '600' },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectTitle: { flex: 1, color: '#0F172A', fontSize: 15, fontWeight: '700', marginRight: 8 },
  subjectMeta: { color: '#64748B', fontSize: 12, marginTop: 6 },
  subjectTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  subjectBar: {
    height: '100%',
    borderRadius: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  emptyCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
  emptySubtitle: { color: '#64748B', fontSize: 13, marginTop: 4 },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center', marginBottom: 14 },
  retryBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
});

export default StudentAttendanceScreen;
