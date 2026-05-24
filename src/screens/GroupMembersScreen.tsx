import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal,
  TextInput, Alert, ActivityIndicator, LogBox, useColorScheme, Share
} from 'react-native';

LogBox.ignoreLogs(['This method is deprecated (as well as all React Native Firebase namespaced API)']);
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const GroupMembersScreen = ({ route, navigation }: any) => {
  const { groupId } = route.params;

  const systemColorScheme = useColorScheme();
  const isDarkMode = systemColorScheme === 'dark';

  const theme = isDarkMode ? {
    bg: '#0B141A',
    headerBg: '#1F2C34',
    headerText: '#E9EDEF',
    cardBg: '#111B21',
    textMain: '#E9EDEF',
    textSub: '#8696A0',
    iconColor: '#00A884',
    btnBg: '#00A884',
    btnText: '#0B141A',
    inputBg: '#2A3942',
    borderColor: '#233138',
    exitBg: '#2A1B1F',
    exitText: '#F87171'
  } : {
    bg: '#EFEAE2',
    headerBg: '#075E54',
    headerText: '#FFFFFF',
    cardBg: '#FFFFFF',
    textMain: '#111B21',
    textSub: '#667781',
    iconColor: '#075E54',
    btnBg: '#25D366',
    btnText: '#FFFFFF',
    inputBg: '#F0F2F5',
    borderColor: '#E9EDEF',
    exitBg: '#FEE2E2',
    exitText: '#DC2626'
  };

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const fetchData = async () => {
    try {
      const groupDoc = await firestore().collection('groupChats').doc(groupId).get();
      const groupData = groupDoc.data();

      if (!groupData) return;

      if (groupData.createdBy === auth().currentUser?.uid) {
        setIsCreator(true);
      }

      const memberIds = groupData.members || [];

      if (memberIds.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const usersData: any[] = [];
      for (let id of memberIds) {
        const userDoc = await firestore().collection('users').doc(id).get();
        if (userDoc.exists()) {
          usersData.push({ id, ...userDoc.data() });
        }
      }

      setMembers(usersData);
    } catch (error) {
      console.log("MEMBER ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!studentEmail.trim()) {
      Alert.alert('Error', 'Please enter a student email');
      return;
    }

    setAdding(true);
    try {
      const userQuery = await firestore().collection('users')
        .where('email', '==', studentEmail.trim())
        .get();

      if (userQuery.empty) {
        Alert.alert('Not Found', `No user found with the email: ${studentEmail.trim()}`);
        setAdding(false);
        return;
      }

      const newStudent = userQuery.docs[0];
      const newStudentId = newStudent.id;

      const isAlreadyMember = members.some(m => m.id === newStudentId);
      if (isAlreadyMember) {
        Alert.alert('Info', 'This user is already in the group.');
        setAdding(false);
        return;
      }

      await firestore().collection('groupChats').doc(groupId).update({
        members: firestore.FieldValue.arrayUnion(newStudentId)
      });

      Alert.alert('Success', 'Student added to the group!');
      setModalVisible(false);
      setStudentEmail('');
      fetchData();

    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to add student');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to completely remove ${memberName || 'this user'} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore().collection('groupChats').doc(groupId).update({
                members: firestore.FieldValue.arrayRemove(memberId)
              });
              Alert.alert('Success', 'Member removed from the group.');
              fetchData();
            } catch (e) {
              Alert.alert('Error', 'Failed to remove member.');
            }
          }
        }
      ]
    );
  };

  const handleExitGroup = () => {
    Alert.alert(
      'Exit Group',
      'Are you sure you want to completely leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Group',
          style: 'destructive',
          onPress: async () => {
            try {
              const uid = auth().currentUser?.uid;
              if (!uid) return;
              await firestore().collection('groupChats').doc(groupId).update({
                members: firestore.FieldValue.arrayRemove(uid)
              });
              Alert.alert('Exited', 'You have left the group.');
              navigation.popToTop();
            } catch (e) {
              Alert.alert('Error', 'Failed to leave the group.');
            }
          }
        }
      ]
    );
  };

  const shareGroupId = async () => {
    try {
      await Share.share({
        message: `Join our class group! Here is the Group ID: ${groupId}`
      });
    } catch (error) { }
  };

  const displayMembers = members.filter(m =>
    (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
            <Text style={{ fontSize: 22, color: theme.headerText }}>⬅️</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={[styles.headerTitle, { color: theme.headerText }]}>Group Info</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
              {members.length} {members.length === 1 ? 'participant' : 'participants'}
            </Text>
          </View>
          <TouchableOpacity onPress={shareGroupId} style={{ padding: 5 }}>
            <Text style={{ fontSize: 20 }}>🔗</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={{ padding: 15, backgroundColor: theme.bg }}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.inputBg, color: theme.textMain, borderColor: theme.borderColor }]}
          placeholder="Search participants..."
          placeholderTextColor={theme.textSub}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.iconColor} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={displayMembers}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 100 }}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
              <View style={[styles.avatar, { backgroundColor: isDarkMode ? '#1F2C34' : '#E0E7FF' }]}>
                <Text style={[styles.avatarText, { color: theme.iconColor }]}>{item.name?.charAt(0) || 'U'}</Text>
              </View>

              <View style={styles.info}>
                <Text style={[styles.memberName, { color: theme.textMain }]}>
                  {item.name || 'No Name'}
                  {item.id === auth().currentUser?.uid ? ' (You)' : ''}
                </Text>
                <Text style={[styles.memberEmail, { color: theme.textSub }]}>{item.email}</Text>
              </View>

              <View style={[styles.roleBadge, { backgroundColor: item.role === 'Teacher' ? (isDarkMode ? '#005C4B' : '#FEF08A') : (isDarkMode ? '#1F2C34' : '#D1FAE5') }]}>
                <Text style={[styles.roleText, { color: item.role === 'Teacher' && isDarkMode ? '#E9EDEF' : theme.textMain }]}>{item.role}</Text>
              </View>

              {isCreator && item.id !== auth().currentUser?.uid && (
                <TouchableOpacity onPress={() => handleRemoveMember(item.id, item.name)} style={{ marginLeft: 15, padding: 5 }}>
                  <Text style={{ fontSize: 18, color: '#EF4444' }}>❌</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListFooterComponent={
            <TouchableOpacity style={[styles.exitBtn, { backgroundColor: theme.exitBg, borderColor: theme.exitText }]} onPress={handleExitGroup}>
              <Text style={[styles.exitBtnText, { color: theme.exitText }]}>🚪 Exit Group</Text>
            </TouchableOpacity>
          }
        />
      )}

      {/* Floating Add Button for Teachers */}
      {isCreator && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: theme.btnBg }]} onPress={() => setModalVisible(true)}>
          <Text style={{ fontSize: 24, color: theme.btnText }}>➕</Text>
        </TouchableOpacity>
      )}

      {/* Add Student Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.modalTitle, { color: theme.textMain }]}>Add Student</Text>
            <Text style={[styles.modalDesc, { color: theme.textSub }]}>Enter the exact registered email address of the student.</Text>

            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.textMain, borderColor: theme.borderColor }]}
              placeholder="student@example.com"
              placeholderTextColor={theme.textSub}
              value={studentEmail}
              onChangeText={setStudentEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={[styles.cancelBtnText, { color: theme.textSub }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.btnBg }]} onPress={handleAddStudent} disabled={adding}>
                {adding ? <ActivityIndicator color={theme.btnText} size="small" /> : <Text style={[styles.addBtnText, { color: theme.btnText }]}>Add</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default GroupMembersScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 15,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  memberName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  memberEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDesc: {
    fontSize: 14,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: 10,
    marginRight: 10,
  },
  cancelBtnText: {
    fontWeight: '600',
    fontSize: 16,
  },
  addBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  addBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  exitBtn: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
  },
  exitBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});