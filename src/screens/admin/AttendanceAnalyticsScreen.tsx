import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';

const AttendanceAnalyticsScreen = ({ navigation }: any) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Fetch attendance for selected date
    const unsubscribe = firestore()
      .collection('attendance')
      .where('dateKey', '==', selectedDate)
      .onSnapshot(
        snapshot => {
          if (!snapshot) return;
          const list: any[] = [];
          snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
          setRecords(list);
          setLoading(false);
        },
        error => {
          console.error(error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [selectedDate]);

  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = total - present;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E3A8A', '#312E81']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Analytics</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={styles.subtitle}>Showing data for: {selectedDate}</Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.statsContainer}>
             <View style={styles.statBox}>
               <Text style={styles.statNum}>{total}</Text>
               <Text style={styles.statLabel}>Total</Text>
             </View>
             <View style={styles.statBox}>
               <Text style={[styles.statNum, { color: '#10B981' }]}>{present}</Text>
               <Text style={styles.statLabel}>Present</Text>
             </View>
             <View style={styles.statBox}>
               <Text style={[styles.statNum, { color: '#EF4444' }]}>{absent}</Text>
               <Text style={styles.statLabel}>Absent</Text>
             </View>
          </View>

          <Text style={styles.sectionTitle}>Recent Logs</Text>
          {records.length === 0 ? (
            <Text style={styles.emptyText}>No attendance records found for this date.</Text>
          ) : (
            records.map(record => (
              <View key={record.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{record.studentName}</Text>
                  <Text style={[
                    styles.statusBadge, 
                    record.status === 'present' ? styles.statusPresent : styles.statusAbsent
                  ]}>
                    {(record.status || 'unknown').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.detail}>📚 Subject: {record.subject}</Text>
                <Text style={styles.detail}>🏢 Dept: {record.department} - Year {record.year}</Text>
                <Text style={styles.methodText}>
                  Marked via: {record.method === 'face_auto' ? 'Face Scanner 🤖' : 'Manual ✍️'}
                </Text>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

export default AttendanceAnalyticsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  backText: { color: '#fff', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: '#93C5FD', textAlign: 'center', fontSize: 14 },
  content: { padding: 20 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 20 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  statusBadge: { fontSize: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden', fontWeight: 'bold' },
  statusPresent: { backgroundColor: '#D1FAE5', color: '#059669' },
  statusAbsent: { backgroundColor: '#FEE2E2', color: '#DC2626' },
  detail: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  methodText: { fontSize: 11, color: '#9CA3AF', marginTop: 8, fontStyle: 'italic' },
});
