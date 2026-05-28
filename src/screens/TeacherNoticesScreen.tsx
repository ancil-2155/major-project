import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { subscribeActiveNoticesForUser, markNoticeAsRead } from '../services/notice/noticeService';
import { Notice } from '../types/notice';
import AppBackButton from '../components/common/AppBackButton';

const TeacherNoticesScreen = ({ navigation }: any) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth().currentUser;
      if (user) {
        const doc = await firestore().collection('users').doc(user.uid).get();
        setUserData(doc.data());
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (userData) {
      const unsub = subscribeActiveNoticesForUser(userData, 'teacher', (fetchedNotices) => {
        setNotices(fetchedNotices);
        setLoading(false);
      });
      return () => unsub();
    }
  }, [userData]);

  const handleRead = async (noticeId: string) => {
    if (auth().currentUser) {
      await markNoticeAsRead(noticeId, auth().currentUser!.uid);
    }
  };

  const renderItem = ({ item }: { item: Notice }) => {
    return (
      <TouchableOpacity 
        style={[styles.card, item.priority === 'urgent' && { borderLeftColor: '#DC2626' }]} 
        onPress={() => {
          handleRead(item.noticeId);
          navigation.navigate('NoticeDetails', { noticeId: item.noticeId });
        }}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.priorityBadge, item.priority === 'urgent' && { backgroundColor: '#FEE2E2', color: '#DC2626' }]}>
            {item.priority.toUpperCase()}
          </Text>
          <Text style={styles.dateText}>
            {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'New'}
          </Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.author}>From: {item.createdByName || 'Admin'}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1E3A8A', '#312E81']} style={styles.header}>
        <View style={styles.headerTop}>
          <AppBackButton navigation={navigation} fallbackRoute="TeacherHome" />
          <Text style={styles.headerTitle}>Campus Notices</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <FlatList
        data={notices}
        keyExtractor={item => item.noticeId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="notifications-off-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No active notices</Text>
          </View>
        }
      />
    </View>
  );
};

export default TeacherNoticesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#3B82F6', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priorityBadge: { fontSize: 10, fontWeight: 'bold', color: '#3B82F6', backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  dateText: { fontSize: 12, color: '#9CA3AF' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  message: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 8 },
  author: { fontSize: 11, color: '#6B7280', fontStyle: 'italic', textAlign: 'right' },
  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#6B7280', marginTop: 12, fontSize: 16, fontWeight: '600' }
});
