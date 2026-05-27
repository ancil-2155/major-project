import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import AppBackButton from '../../components/common/AppBackButton';
import { loadStudentGroups } from '../../services/groups/groupService';
import { GroupListItem } from '../../types/groups';
import { useAppTheme } from '../../theme/appTheme';

const formatTime = (value: any): string => {
  if (!value?.toDate) {
    return '';
  }
  try {
    return value.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const StudentGroupsScreen = ({ navigation }: any) => {
  const { colors } = useAppTheme();
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async (refresh = false) => {
    try {
      if (!refresh) {
        setLoading(true);
      }
      const user = auth().currentUser;
      if (!user) {
        setError('Please login again.');
        return;
      }
      setError(null);
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const profile = userDoc.data() || {};
      const data = await loadStudentGroups(profile, user.uid);
      setGroups(data);
    } catch (err: any) {
      console.error('load student groups error:', err);
      setError('Unable to load groups right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups]),
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return groups;
    }
    return groups.filter(item => {
      const value = `${item.groupName} ${item.subject || ''} ${item.createdByName || ''}`.toLowerCase();
      return value.includes(needle);
    });
  }, [groups, search]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#070A12' ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <AppBackButton navigation={navigation} fallbackRoute="StudentHome" style={styles.backBtn} />
        <View style={styles.headerTextWrap}>
          <Text style={[styles.title, { color: colors.text }]}>My Class Groups</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Teacher-created groups for your class</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchWrap, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
          <Icon name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search groups"
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={{ color: colors.danger }}>{error}</Text>
          <TouchableOpacity onPress={() => loadGroups()} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.groupId}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadGroups(true);
              }}
            />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={[styles.listHeader, { color: colors.textSecondary }]}>My Class Groups</Text>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.center}>
                <Text style={{ color: colors.textSecondary }}>No groups created for your class yet.</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('GroupChat', { groupId: item.groupId })}
              activeOpacity={0.8}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.cardTop}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.groupName}
                </Text>
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(item.lastMessageAt)}</Text>
              </View>

              <View style={styles.badgeRow}>
                {item.subject ? (
                  <View style={[styles.subjectBadge, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.subjectText, { color: colors.primary }]} numberOfLines={1}>
                      {item.subject}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.teacherText, { color: colors.textSecondary }]}>Teacher: {item.createdByName}</Text>
              <Text style={[styles.messageText, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.lastMessageText || 'No messages yet'}
              </Text>

              <View style={styles.cardBottom}>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>Members: {item.memberCount}</Text>
                {item.unreadCount ? (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22 },
  headerTextWrap: { marginLeft: 12, flex: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  searchSection: { paddingHorizontal: 16, paddingBottom: 8 },
  searchWrap: {
    height: 42,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: { marginLeft: 8, flex: 1, fontSize: 14, paddingVertical: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4 },
  listHeader: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  timeText: { fontSize: 11, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', marginTop: 6 },
  subjectBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  subjectText: { fontSize: 11, fontWeight: '700' },
  teacherText: { fontSize: 12, marginTop: 6 },
  messageText: { fontSize: 13, marginTop: 4 },
  cardBottom: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { fontSize: 12 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  retryBtn: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
});

export default StudentGroupsScreen;

