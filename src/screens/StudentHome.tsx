import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Image,
  Modal,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

type StudentHomeProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'StudentHome'>;
};

type FeatureScreen =
  | 'MeetingViewer'
  | 'Library'
  | 'Gallery'
  | 'TimetableMenu'
  | 'ViewResults'
  | 'TeacherGroups'
  | 'Resources'
  | 'ApplyBonafide'
  | 'StudentBonafideList'
  | 'ApplyLeave'
  | 'StudentLeaveList'
  | 'StudentAssignments';

type FeatureItem = {
  id: number;
  title: string;
  icon: string;
  gradient: [string, string];
  screen: FeatureScreen;
  badge?: number;
};

const StudentHome: React.FC<StudentHomeProps> = ({ navigation }) => {
  const [userData, setUserData] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    const doc = await firestore().collection('users').doc(uid).get();
    setUserData(doc.data());
    setLoading(false);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  };

  const features: FeatureItem[] = [
    { id: 1, title: 'Join Meeting', icon: '🎥', gradient: ['#4ECDC4', '#44A08D'], screen: 'MeetingViewer' },
    { id: 2, title: 'Library', icon: '📚', gradient: ['#667eea', '#764ba2'], screen: 'Library' },
    { id: 3, title: 'Gallery', icon: '🖼️', gradient: ['#f093fb', '#f5576c'], screen: 'Gallery' },
    { id: 4, title: 'Academic', icon: '📅', gradient: ['#4facfe', '#00f2fe'], screen: 'TimetableMenu' },
    { id: 5, title: 'Results', icon: '📊', gradient: ['#fa709a', '#fee140'], screen: 'ViewResults' },
    { id: 6, title: 'Teachers', icon: '👨‍🏫', gradient: ['#a18cd1', '#fbc2eb'], screen: 'TeacherGroups' },
    { id: 7, title: 'Resources', icon: '📎', gradient: ['#ffecd2', '#fcb69f'], screen: 'Resources' },
    

    // 🔥 NEW FEATURE
    {
      id: 8,
      title: 'My Certificates',
      icon: '📄',
      gradient: ['#22C55E', '#16A34A'],
      screen: 'StudentBonafideList',
    },
    {
  id: 11,
  title: 'Apply Leave',
  icon: '📝',
  gradient: ['#f7971e', '#ffd200'],
  screen: 'ApplyLeave',
},
{
  id: 20,
  title: 'My Leaves',
  icon: '📄',
  gradient: ['#22c55e', '#16a34a'],
  screen: 'StudentLeaveList',
},
{
  id: 30,
  title: 'Assignments',
  icon: '📝',
  gradient: ['#f59e0b', '#f97316'],
  screen: 'StudentAssignments',
}
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      <View style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* HEADER */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <LinearGradient colors={['#1F2937', '#374151']} style={styles.header}>
              <View style={styles.topBar}>
                <View>
                  <Text style={styles.welcome}>Welcome back</Text>
                  <Text style={styles.name}>{userData?.name || 'Student'} 👋</Text>
                </View>

                <TouchableOpacity onPress={() => setProfileOpen(true)}>
                  {userData?.faces?.[0] ? (
                    <Image source={{ uri: userData.faces[0] }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {userData?.name?.charAt(0) || 'S'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* FEATURES */}
          <View style={styles.grid}>
            {features.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => navigation.navigate(item.screen as any)}
              >
                <LinearGradient colors={item.gradient} style={styles.iconBox}>
                  <Text style={styles.icon}>{item.icon}</Text>
                </LinearGradient>
                <Text style={styles.title}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* BONAFIDE APPLY BUTTON */}
          <TouchableOpacity
            style={styles.bonafideBtn}
            onPress={() => navigation.navigate('ApplyBonafide')}
          >
            <Text style={styles.bonafideText}>📜 Apply Bonafide Certificate</Text>
          </TouchableOpacity>

          {/* LOGOUT */}
          <TouchableOpacity
            style={styles.logout}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* PROFILE MODAL */}
        <Modal visible={profileOpen} transparent animationType="slide">
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.name}>{userData?.name}</Text>
              <Text>{userData?.email}</Text>

              <TouchableOpacity onPress={() => setProfileOpen(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
};

export default StudentHome;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    padding: 25,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  welcome: { color: '#9CA3AF' },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },

  avatar: { width: 45, height: 45, borderRadius: 25 },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },

  card: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
  },

  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  icon: { fontSize: 28 },
  title: { fontWeight: '600' },

  bonafideBtn: {
    margin: 20,
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  bonafideText: { color: '#fff', fontWeight: 'bold' },

  logout: {
    margin: 20,
    backgroundColor: '#EF4444',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  logoutText: { color: '#fff', fontWeight: 'bold' },

  modal: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
  },
  closeText: {
    marginTop: 20,
  },
});