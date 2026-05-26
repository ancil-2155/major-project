import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { getStudentPublishedResults } from '../services/results/resultService';
import LinearGradient from 'react-native-linear-gradient';

const ViewResultsScreen = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      const user = auth().currentUser;
      if (!user) return;
      const data = await getStudentPublishedResults(user.uid);
      
      // Sort by latest published
      data.sort((a, b) => {
        const dateA = a.publishedAt?.toDate()?.getTime() || 0;
        const dateB = b.publishedAt?.toDate()?.getTime() || 0;
        return dateB - dateA;
      });

      setResults(data);
      setLoading(false);
    };

    fetchResults();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading your results...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Results</Text>

      <FlatList
        data={results}
        keyExtractor={(item) => item.resultId}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No published results found.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isPass = item.percentage >= 40;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.subject}>{item.subject}</Text>
                <View style={[styles.badge, isPass ? styles.badgePass : styles.badgeFail]}>
                  <Text style={[styles.badgeText, isPass ? styles.badgeTextPass : styles.badgeTextFail]}>
                    {isPass ? 'PASS' : 'FAIL'}
                  </Text>
                </View>
              </View>

              <Text style={styles.examType}>{item.examType || 'Exam'} • Semester {item.semester || '-'}</Text>
              
              <View style={styles.marksBox}>
                <View style={styles.markItem}>
                  <Text style={styles.markLabel}>Score</Text>
                  <Text style={styles.markValue}>{item.marksObtained} / {item.totalMarks}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.markItem}>
                  <Text style={styles.markLabel}>Percentage</Text>
                  <Text style={styles.markValue}>{item.percentage}%</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.markItem}>
                  <Text style={styles.markLabel}>Grade</Text>
                  <Text style={[styles.markValue, { color: '#4F46E5' }]}>{item.grade || '—'}</Text>
                </View>
              </View>
              
              <View style={styles.footer}>
                <Text style={styles.footerText}>Teacher: {item.teacherName}</Text>
                <Text style={styles.footerText}>
                  {item.publishedAt?.toDate() ? item.publishedAt.toDate().toLocaleDateString() : '—'}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

export default ViewResultsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1F2937' },
  
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subject: { fontSize: 18, fontWeight: 'bold', color: '#111827', flex: 1 },
  examType: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 16 },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgePass: { backgroundColor: '#D1FAE5' },
  badgeFail: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  badgeTextPass: { color: '#065F46' },
  badgeTextFail: { color: '#991B1B' },
  
  marksBox: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  markItem: { alignItems: 'center', flex: 1 },
  markLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  markValue: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  divider: { width: 1, height: '100%', backgroundColor: '#E5E7EB' },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  footerText: { fontSize: 12, color: '#9CA3AF' },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#6B7280', fontSize: 16 },
});