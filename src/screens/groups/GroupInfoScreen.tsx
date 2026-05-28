import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  TextInput,
  SafeAreaView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useAppTheme } from '../../theme/appTheme';

const { width } = Dimensions.get('window');

const GroupInfoScreen = ({ route, navigation }: any) => {
  const { groupId } = route.params;
  const { colors, isDark } = useAppTheme();

  const [groupData, setGroupData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [addStudentModalVisible, setAddStudentModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const groupDoc = await firestore().collection('classGroups').doc(groupId).get();

      if (!groupDoc.exists) {
        Alert.alert('Error', 'Group not found');
        navigation.goBack();
        return;
      }

      const data = groupDoc.data();
      setGroupData(data);

      const user = auth().currentUser;
      if (user && data?.createdBy === user.uid) {
        setIsCreator(true);
      }

      // Fetch members
      const membersSnapshot = await firestore()
        .collection('classGroups')
        .doc(groupId)
        .collection('members')
        .get();

      const membersList = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching group data:', error);
      Alert.alert('Error', 'Failed to load group information');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStudents = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Search by email, enrollment number, or name
      const usersSnapshot = await firestore().collection('users')
        .where('role', '==', 'student')
        .limit(20)
        .get();

      const filtered = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
        .filter(user => {
          const q = query.toLowerCase();
          const email = (user.email || '').toLowerCase();
          const name = (user.name || '').toLowerCase();
          const enrollment = (user.enrollmentNumber || '').toLowerCase();

          return email.includes(q) || name.includes(q) || enrollment.includes(q);
        })
        .filter(user => !members.some(m => m.id === user.id)) // Exclude already added members
        .slice(0, 10);

      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search students');
    } finally {
      setSearching(false);
    }
  };

  const handleAddStudent = async (studentId: string, studentName: string) => {
    try {
      // Add to members subcollection
      await firestore()
        .collection('classGroups')
        .doc(groupId)
        .collection('members')
        .doc(studentId)
        .set({
          userId: studentId,
          name: studentName,
          role: 'student',
          joinedAt: firestore.FieldValue.serverTimestamp(),
          addedBy: currentUserId,
        });

      // Update member count
      await firestore()
        .collection('classGroups')
        .doc(groupId)
        .update({
          memberCount: firestore.FieldValue.increment(1),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      Alert.alert('Success', `${studentName} added to group!`);
      setAddStudentModalVisible(false);
      setSearchQuery('');
      setSearchResults([]);
      fetchGroupData();
    } catch (error) {
      console.error('Error adding student:', error);
      Alert.alert('Error', 'Failed to add student');
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove from members subcollection
              await firestore()
                .collection('classGroups')
                .doc(groupId)
                .collection('members')
                .doc(memberId)
                .delete();

              // Decrease member count
              await firestore()
                .collection('classGroups')
                .doc(groupId)
                .update({
                  memberCount: firestore.FieldValue.increment(-1),
                  updatedAt: firestore.FieldValue.serverTimestamp(),
                });

              Alert.alert('Success', 'Member removed from group');
              fetchGroupData();
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleExitGroup = () => {
    if (isCreator && members.length > 1) {
      Alert.alert(
        'Exit Group',
        'You are the creator. If you exit, the group may be deleted if no other teachers remain. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: exitGroup,
          },
        ]
      );
    } else {
      Alert.alert(
        'Exit Group',
        'Are you sure you want to leave this group?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: exitGroup,
          },
        ]
      );
    }
  };

  const exitGroup = async () => {
    try {
      // Remove self from members
      await firestore()
        .collection('classGroups')
        .doc(groupId)
        .collection('members')
        .doc(currentUserId)
        .delete();

      // Decrease member count
      await firestore()
        .collection('classGroups')
        .doc(groupId)
        .update({
          memberCount: firestore.FieldValue.increment(-1),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      Alert.alert('Success', 'You have left the group');
      navigation.popToTop();
    } catch (error) {
      console.error('Error exiting group:', error);
      Alert.alert('Error', 'Failed to exit group');
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to permanently delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete group document (Firestore rules should handle cleanup)
              await firestore().collection('classGroups').doc(groupId).delete();

              Alert.alert('Success', 'Group deleted');
              navigation.popToTop();
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', 'Failed to delete group');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.headerButton, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Group Info</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
        {/* Group Header Card */}
        <View style={[styles.groupHeaderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View
            style={[
              styles.groupAvatar,
              { backgroundColor: colors.primary + '20' },
            ]}
          >
            <Text style={styles.groupAvatarText}>
              {groupData?.groupName?.charAt(0).toUpperCase() || 'G'}
            </Text>
          </View>

          <Text style={[styles.groupName, { color: colors.text }]}>
            {groupData?.groupName}
          </Text>

          {groupData?.description && (
            <Text style={[styles.groupDescription, { color: colors.textSecondary }]}>
              {groupData.description}
            </Text>
          )}
        </View>

        {/* Stats Section */}
        <View style={[styles.statsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Members</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {members.length}
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Created</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {groupData?.createdAt
                ? new Date(groupData.createdAt.toDate()).toLocaleDateString()
                : 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Creator Info */}
        <View style={[styles.infoSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Created by</Text>
          <Text style={[styles.creatorName, { color: colors.textSecondary }]}>
            {groupData?.createdByName || 'Unknown'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {isCreator && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
              onPress={() => setAddStudentModalVisible(true)}
            >
              <Text style={[styles.buttonText, { color: colors.primary }]}>+ Add Student</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={handleExitGroup}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Leave Group</Text>
          </TouchableOpacity>

          {isCreator && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#FF3B30' + '20', borderColor: '#FF3B30' }]}
              onPress={handleDeleteGroup}
            >
              <Text style={[styles.buttonText, { color: '#FF3B30' }]}>Delete Group</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Members List */}
        <View style={[styles.membersSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Members ({members.length})</Text>

          {members.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No members yet</Text>
          ) : (
            members.map((member, index) => (
              <View key={member.id} style={[styles.memberItem, index < members.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                <View style={[styles.memberAvatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
                    {member.name?.charAt(0).toUpperCase() || 'M'}
                  </Text>
                </View>

                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                  <Text style={[styles.memberRole, { color: colors.textSecondary }]}>
                    {member.role}
                  </Text>
                </View>

                {isCreator && member.id !== currentUserId && (
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(member.id, member.name)}
                    style={styles.removeButton}
                  >
                    <Text style={{ color: '#FF3B30' }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Student Modal */}
      <Modal
        visible={addStudentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddStudentModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setAddStudentModalVisible(false)}>
              <Text style={[styles.modalCloseButton, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Student</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Search Input */}
          <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Search by email, name, or enrollment..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                handleSearchStudents(text);
              }}
            />
          </View>

          {/* Search Results */}
          {searching ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.searchResultItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.resultAvatar, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.resultAvatarText, { color: colors.primary }]}>
                      {item.name?.charAt(0).toUpperCase() || 'S'}
                    </Text>
                  </View>

                  <View style={styles.resultInfo}>
                    <Text style={[styles.resultName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.resultEmail, { color: colors.textSecondary }]}>
                      {item.email}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleAddStudent(item.id, item.name)}
                  >
                    <Text style={{ color: '#fff', fontSize: 14 }}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={{ padding: 15 }}
              ListEmptyComponent={
                searchQuery.trim() ? (
                  <Text style={[styles.emptySearchText, { color: colors.textSecondary, textAlign: 'center', marginTop: 20 }]}>
                    No students found
                  </Text>
                ) : (
                  <Text style={[styles.emptySearchText, { color: colors.textSecondary, textAlign: 'center', marginTop: 20 }]}>
                    Start typing to search
                  </Text>
                )
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  headerButton: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    flex: 1,
    padding: 15,
  },
  groupHeaderCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupAvatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  groupName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  infoSection: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  creatorName: {
    fontSize: 16,
  },
  actionSection: {
    marginBottom: 20,
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  membersSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
    marginBottom: 30,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
  },
  removeButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 15,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    fontSize: 24,
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    padding: 15,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultEmail: {
    fontSize: 12,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emptySearchText: {
    fontSize: 14,
  },
});

export default GroupInfoScreen;
