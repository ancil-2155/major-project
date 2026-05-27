import React, { useMemo } from 'react';
import { FlatList, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import AppBackButton from '../../components/common/AppBackButton';

const SubjectAttendanceDetailsScreen = ({ route, navigation }: any) => {
  const {
    subject,
    teacherName,
    percentage,
    present,
    absent,
    total,
    records = [],
  } = route.params || {};

  const sortedRecords = useMemo(
    () =>
      [...records].sort((a, b) => {
        const aMs = Number(a?.markedAtMs || 0);
        const bMs = Number(b?.markedAtMs || 0);
        return bMs - aMs;
      }),
    [records],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.header}>
        <AppBackButton navigation={navigation} fallbackRoute="StudentAttendance" style={styles.backBtn} />
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{subject || 'Subject'}</Text>
          <Text style={styles.subtitle}>Teacher: {teacherName || 'Teacher'}</Text>
        </View>
      </View>

      <FlatList
        data={sortedRecords}
        keyExtractor={(item, index) => `${item?.sessionId || 'session'}-${index}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Attendance</Text>
            <Text style={styles.summaryValue}>{percentage || 0}%</Text>
            <Text style={styles.summaryMeta}>
              Present {present || 0} / Total {total || 0} / Absent {absent || 0}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Records Found</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isPresent = String(item?.status).toLowerCase() === 'present';
          return (
            <View style={styles.recordCard}>
              <View style={styles.row}>
                <Text style={styles.dateText}>{item?.date || '-'}</Text>
                <Text style={[styles.status, { color: isPresent ? '#059669' : '#DC2626' }]}>
                  {isPresent ? 'Present' : 'Absent'}
                </Text>
              </View>
              <Text style={styles.metaText}>Teacher: {item?.teacherName || 'Teacher'}</Text>
              <Text style={styles.metaText}>Method: {item?.method === 'face_auto' ? 'Face Auto' : 'Manual'}</Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
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
  title: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  subtitle: { color: '#CBD5E1', marginTop: 2, fontSize: 13 },
  listContent: { padding: 16, paddingBottom: 28 },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
  },
  summaryLabel: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  summaryValue: { color: '#4F46E5', fontSize: 32, fontWeight: '800', marginTop: 4 },
  summaryMeta: { color: '#475569', marginTop: 8, fontSize: 12, fontWeight: '600' },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  status: { fontSize: 12, fontWeight: '700' },
  metaText: { color: '#64748B', marginTop: 5, fontSize: 12 },
  emptyCard: {
    marginTop: 20,
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
});

export default SubjectAttendanceDetailsScreen;

