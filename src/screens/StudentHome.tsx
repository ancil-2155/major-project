import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getProfilePhotoUrl } from '../services/firebase/storageSafeService';
import { subscribeActiveNoticesForUser } from '../services/notice/noticeService';
import { useAppTheme } from '../theme/appTheme';
import { useTranslation } from '../hooks/useTranslation';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import FeatureGrid from '../components/dashboard/FeatureGrid';
import { studentFeatures } from '../config/dashboardFeatures';
import { dashboardTheme } from '../theme/dashboardTheme';

type StudentHomeProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'StudentHome'>;
};

const StudentHome: React.FC<StudentHomeProps> = ({ navigation }) => {
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [unreadNotices, setUnreadNotices] = useState(0);

  const numColumns = width < 360 ? 1 : 2;
  const cardWidth =
    (width -
      dashboardTheme.spacing.screenPadding * 2 -
      dashboardTheme.spacing.cardGap * (numColumns - 1)) /
    numColumns;

  const safeTranslate = useCallback(
    (key: string, fallback: string) => {
      const value = t(key);
      if (!value || value === key) {
        return fallback;
      }
      return value;
    },
    [t],
  );

  const loadDashboard = useCallback(async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
      const data = userDoc.data();
      setUserData(data);
      const safePhoto = await getProfilePhotoUrl(data);
      setProfilePhotoUrl(safePhoto);
    } catch (error) {
      console.log('Student dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!userData) {
      return;
    }
    const unsubscribe = subscribeActiveNoticesForUser(
      userData,
      'student',
      (_notices, count) => setUnreadNotices(count),
    );
    return () => unsubscribe();
  }, [userData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const featureItems = useMemo(() => {
    const noticesCard = {
      id: 'notices',
      titleKey: 'dashboard.notices',
      subtitleKey: 'dashboard.noticesSubtitle',
      titleFallback: 'Notices',
      subtitleFallback: 'Admin announcements',
      iconName: 'notifications-outline',
      route: 'StudentNotices' as const,
      color: '#6366F1',
      badgeCount: unreadNotices,
    };

    return [...studentFeatures, noticesCard].map(item => ({
      id: item.id,
      title: safeTranslate(item.titleKey, item.titleFallback),
      subtitle: safeTranslate(item.subtitleKey, item.subtitleFallback),
      iconName: item.iconName,
      color: item.color,
      badgeCount: item.badgeCount,
      route: item.route,
    }));
  }, [safeTranslate, unreadNotices]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.headerStart} />
      <DashboardHeader
        role="student"
        userName={userData?.name || 'Student'}
        subtitle={safeTranslate('dashboard.welcome', 'Welcome back')}
        profilePhotoUrl={profilePhotoUrl}
        onProfilePress={() => navigation.navigate('StudentProfile')}
        onSettingsPress={() => navigation.navigate('StudentSettings')}
      />

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {safeTranslate('dashboard.studentTitle', 'Student Dashboard')}
          </Text>
          <Text style={[styles.sectionMeta, { color: colors.textSecondary }]}>
            {featureItems.length}
          </Text>
        </View>

        <FeatureGrid
          data={featureItems}
          numColumns={numColumns}
          cardWidth={cardWidth}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onPressItem={item => navigation.navigate(item.route as any)}
          contentBottomPadding={48}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: dashboardTheme.spacing.screenPadding,
    paddingTop: 16,
  },
  sectionHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: dashboardTheme.typography.dashboardTitle,
    fontWeight: '800',
  },
  sectionMeta: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default StudentHome;
