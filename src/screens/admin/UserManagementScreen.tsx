import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';
import { User, UserRole } from '../../types/user';
import { suspendUser, reactivateUser } from '../../services/admin/userManagementService';

const Roles = ['all', 'student', 'teacher', 'parent', 'admin'];

const UserManagementScreen = ({ navigation }: any) => {
  const [activeRole, setActiveRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUserUid = auth().currentUser?.uid;

  useEffect(() => {
    // Basic fetch; a real app might paginate this
    const unsubscribe = firestore()
      .collection('users')
      .onSnapshot(
        snapshot => {
          if (!snapshot) return;
          const list: User[] = [];
          snapshot.forEach(doc => list.push({ uid: doc.id, ...doc.data() } as User));
          setUsers(list);
          setLoading(false);
        },
        error => {
          console.error(error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => {
    if (activeRole !== 'all' && u.role !== activeRole) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (u.name || '').toLowerCase().includes(q);
      const emailMatch = (u.email || '').toLowerCase().includes(q);
      if (!nameMatch && !emailMatch) return false;
    }
    return true;
  });

  const handleSuspend = (user: User) => {
    if (user.uid === currentUserUid) {
      Alert.alert('Error', 'You cannot suspend your own account.');
      return;
    }
    if (user.role === 'admin') {
      Alert.alert('Error', 'You cannot suspend another administrator.');
      return;
    }

    Alert.alert('Suspend User', `Suspend ${user.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Suspend',
        style: 'destructive',
        onPress: async () => {
          try {
            await suspendUser(user.uid, user.role);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleReactivate = (user: User) => {
    Alert.alert('Reactivate User', `Reactivate ${user.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reactivate',
        onPress: async () => {
          try {
            await reactivateUser(user.uid, user.role);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E3A8A', '#312E81']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>User Management</Text>
          <View style={{ width: 60 }} />
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rolesScroll}>
          {Roles.map(role => (
            <TouchableOpacity
              key={role}
              style={[styles.roleTab, activeRole === role && styles.activeRoleTab]}
              onPress={() => setActiveRole(role)}
            >
              <Text style={[styles.roleTabText, activeRole === role && styles.activeRoleTabText]}>
                {role.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={styles.listContainer}>
          {filteredUsers.length === 0 ? (
            <Text style={styles.emptyText}>No users found.</Text>
          ) : (
            filteredUsers.map(user => (
              <View key={user.uid} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{user.name || 'Unknown User'}</Text>
                  <Text style={[
                    styles.statusBadge, 
                    user.status === 'suspended' ? styles.statusSuspended : styles.statusActive
                  ]}>
                    {user.status || 'active'}
                  </Text>
                </View>
                <Text style={styles.detail}>📧 {user.email || 'No email'}</Text>
                <Text style={styles.detail}>👤 Role: {user.role || 'unknown'}</Text>

                <View style={styles.actions}>
                  {user.status === 'suspended' ? (
                    <TouchableOpacity style={[styles.btn, styles.reactivateBtn]} onPress={() => handleReactivate(user)}>
                      <Text style={styles.btnText}>Reactivate</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.btn, styles.suspendBtn, (user.uid === currentUserUid || user.role === 'admin') && styles.disabledBtn]} 
                      onPress={() => handleSuspend(user)}
                    >
                      <Text style={styles.btnText}>Suspend</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

export default UserManagementScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingTop: 50, paddingBottom: 10, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  backText: { color: '#fff', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  searchInput: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 15 },
  rolesScroll: { paddingHorizontal: 15, marginBottom: 10 },
  roleTab: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 10 },
  activeRoleTab: { backgroundColor: '#fff' },
  roleTabText: { color: '#E0E7FF', fontWeight: '600', fontSize: 12 },
  activeRoleTabText: { color: '#1E3A8A', fontWeight: 'bold' },
  listContainer: { padding: 20 },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40, fontSize: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  statusBadge: { fontSize: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden', fontWeight: 'bold' },
  statusActive: { backgroundColor: '#D1FAE5', color: '#059669' },
  statusSuspended: { backgroundColor: '#FEE2E2', color: '#DC2626' },
  detail: { fontSize: 14, color: '#4B5563', marginBottom: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  btn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  suspendBtn: { backgroundColor: '#EF4444' },
  reactivateBtn: { backgroundColor: '#10B981' },
  disabledBtn: { backgroundColor: '#9CA3AF' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
