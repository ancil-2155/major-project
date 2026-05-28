import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  BackHandler,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { fetchDashboardStats, DashboardStats } from '../../services/admin/attendanceAnalyticsService';
import { logAdminAction } from '../../services/admin/auditLogService';
import { useAppTheme } from '../../theme/appTheme';

const { width } = Dimensions.get('window');

const AdminHomeScreen = ({ navigation }: any) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    const data = await fetchDashboardStats();
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Back Button Intercept — RN 0.73+ uses subscription.remove() not removeEventListener()
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Exit ACAMS?', 'Are you sure you want to exit the app?', [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove(); // ✅ correct RN 0.73+ API
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logAdminAction('admin_logout');
          await auth().signOut();
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          );
        },
      },
    ]);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.headerStart} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.headerStart, colors.headerEnd]} style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Admin Panel</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Manage your institution</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* STATS OVERVIEW */}
          <Text style={styles.sectionTitle}>Overview</Text>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            stats && (
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{stats.totalStudents}</Text>
                  <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{stats.totalTeachers}</Text>
                  <Text style={styles.statLabel}>Teachers</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: colors.warning }]}>{stats.pendingTeachers}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>
            )
          )}

          {/* MANAGEMENT GRID */}
          <Text style={styles.sectionTitle}>Management</Text>
          <View style={styles.grid}>
            {[
              { icon: 'shield-checkmark-outline', label: 'Approvals', screen: 'TeacherApprovals', desc: 'Approve new teachers' },
              { icon: 'people-outline', label: 'Users', screen: 'UserManagement', desc: 'Manage all accounts' },
              { icon: 'bar-chart-outline', label: 'Attendance', screen: 'AttendanceAnalytics', desc: 'View daily reports' },
              { icon: 'megaphone-outline', label: 'Notices', screen: 'NoticeManager', desc: 'Send announcements' },
              { icon: 'images-outline', label: 'Gallery', screen: 'GalleryManagement', desc: 'Moderate gallery posts' },
              { icon: 'school-outline', label: 'Classes', screen: 'ClassManager', desc: 'Manage subjects and depts' },
              { icon: 'settings-outline', label: 'Settings', screen: 'AdminSettings', desc: 'App configuration' },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.gridCard}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.8}
              >
                <View style={styles.gridIconWrap}>
                  <Icon name={item.icon} size={24} color={colors.primary} />
                </View>
                <Text style={styles.gridTitle}>{item.label}</Text>
                <Text style={styles.gridDesc}>{item.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </View>
      </ScrollView>
    </>
  );
};

export default AdminHomeScreen;

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  subtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.22 : 0.1,
    shadowRadius: 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  statNum: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - 60) / 2,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.18 : 0.05,
    shadowRadius: 4,
  },
  gridIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  gridDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
