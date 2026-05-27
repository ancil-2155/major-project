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
import auth from '@react-native-firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppBackButton from '../../components/common/AppBackButton';
import { loadTeacherGroups } from '../../services/groups/groupService';
import { GroupListItem } from '../../types/groups';
import { useAppTheme } from '../../theme/appTheme';

type FilterType = 'all' | 'active' | 'archived';

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

const TeacherGroupsScreen = ({ navigation }: any) => {
  const { colors } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async (refresh = false) => {
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
      const data = await loadTeacherGroups(user.uid);
      setGroups(data);
    } catch (err: any) {
      console.error('loadTeacherGroups error:', err);
      setError('Unable to load groups right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups]),
  );

  const filteredGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return groups.filter(item => {
      if (filter !== 'all' && item.status !== filter) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const source = `${item.groupName} ${item.subject || ''} ${item.departmentCode || item.classLevel || ''}`.toLowerCase();
      return source.includes(needle);
    });
  }, [groups, filter, search]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#070A12' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <AppBackButton navigation={navigation} fallbackRoute="TeacherHome" style={styles.backBtn} />
        <View style={styles.headerTextWrap}>
          <Text style={[styles.title, { color: colors.text }]}>Teacher Groups</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage class and subject groups</Text>
        </View>
      </View>

      <View style={styles.controls}>
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

        <View style={styles.filterRow}>
          {(['all', 'active', 'archived'] as FilterType[]).map(item => {
            const isActive = item === filter;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setFilter(item)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? colors.primarySoft : colors.cardAlt,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={{ color: isActive ? colors.primary : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
                  {item.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={{ color: colors.danger }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchGroups()} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={item => item.groupId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGroups(true); }} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: colors.textSecondary }}>No groups found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('GroupChat', { groupId: item.groupId })}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.cardTop}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.groupName}
                </Text>
                <Text style={[styles.cardTime, { color: colors.textSecondary }]}>{formatTime(item.lastMessageAt)}</Text>
              </View>
              <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                {(item.subject || item.classLevel || item.departmentCode || item.department || 'Class Group').toUpperCase()}
              </Text>
              <Text style={[styles.cardMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.lastMessageText || 'No messages yet'}
              </Text>
              <View style={styles.cardBottom}>
                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>Members: {item.memberCount}</Text>
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

      {!loading ? (
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateGroup')}
          style={[styles.fab, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Icon name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}
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
  controls: { paddingHorizontal: 16, paddingBottom: 8 },
  searchWrap: {
    height: 42,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: { marginLeft: 8, flex: 1, fontSize: 14, paddingVertical: 8 },
  filterRow: { flexDirection: 'row', marginTop: 10 },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 6 },
  card: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', marginRight: 8 },
  cardTime: { fontSize: 11, fontWeight: '600' },
  cardMeta: { fontSize: 12, marginTop: 4 },
  cardMessage: { fontSize: 13, marginTop: 4 },
  cardBottom: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 26,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
});

export default TeacherGroupsScreen;

