import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../theme/appTheme';
import { markNoticeAsRead } from '../services/notice/noticeService';

const { width } = Dimensions.get('window');

const NoticeDetailsScreen = ({ route, navigation }: any) => {
  const { noticeId } = route.params;
  const { colors, isDark } = useAppTheme();

  const [notice, setNotice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRead, setIsRead] = useState(false);

  useEffect(() => {
    fetchNotice();
    markAsRead();
  }, [noticeId]);

  const fetchNotice = async () => {
    try {
      const docSnap = await firestore().collection('notices').doc(noticeId).get();
      if (docSnap.exists) {
        setNotice(docSnap.data());
      } else {
        Alert.alert('Error', 'Notice not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching notice:', error);
      Alert.alert('Error', 'Failed to load notice');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    const user = auth().currentUser;
    if (user && noticeId) {
      try {
        await markNoticeAsRead(noticeId, user.uid);
        setIsRead(true);
      } catch (error) {
        console.error('Error marking notice as read:', error);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!notice) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
        >
          <Icon name="chevron-back" size={24} color={colors.text} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notice</Text>
        </TouchableOpacity>
        <View style={styles.centerContent}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Notice not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getPriorityBadgeColor = () => {
    switch (notice.priority) {
      case 'urgent':
        return '#DC2626';
      case 'important':
        return '#F97316';
      default:
        return colors.primary;
    }
  };

  const getPriorityBgColor = () => {
    switch (notice.priority) {
      case 'urgent':
        return '#FEE2E2';
      case 'important':
        return '#FFEDD5';
      default:
        return colors.primary + '20';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notice Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Priority Badge */}
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.priorityBadge,
              {
                backgroundColor: getPriorityBgColor(),
              },
            ]}
          >
            <Icon
              name={notice.priority === 'urgent' ? 'alert-circle' : 'information-circle'}
              size={16}
              color={getPriorityBadgeColor()}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.priorityText,
                {
                  color: getPriorityBadgeColor(),
                },
              ]}
            >
              {(notice.priority || 'normal').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {notice.title}
        </Text>

        {/* Meta Information */}
        <View
          style={[
            styles.metaContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.metaItem}>
            <Icon name="person-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {notice.createdByName || 'Admin'}
            </Text>
          </View>

          <View
            style={[
              styles.metaDivider,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          <View style={styles.metaItem}>
            <Icon name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {notice.createdAt
                ? new Date(notice.createdAt.toDate()).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Today'}
            </Text>
          </View>

          {notice.expiresAt && (
            <>
              <View
                style={[
                  styles.metaDivider,
                  {
                    backgroundColor: colors.border,
                  },
                ]}
              />
              <View style={styles.metaItem}>
                <Icon name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  Expires: {new Date(notice.expiresAt.toDate()).toLocaleDateString('en-IN')}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Image */}
        {notice.imageUrl && (
          <View style={[styles.imageContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Image
              source={{ uri: notice.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Description */}
        <Text style={[styles.description, { color: colors.text }]}>
          {notice.description || notice.message || 'No description provided'}
        </Text>

        {/* Target Information */}
        {(notice.targetRoles || notice.targetEducationLevel) && (
          <View
            style={[
              styles.targetContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.targetTitle, { color: colors.text }]}>
              Target Audience
            </Text>
            {notice.targetRoles && (
              <View style={styles.tagsContainer}>
                {notice.targetRoles.map((role: string, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: colors.primary + '20',
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>
                      {role}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {notice.targetEducationLevel && (
              <Text
                style={[
                  styles.targetInfo,
                  { color: colors.textSecondary },
                ]}
              >
                Education Level: {notice.targetEducationLevel}
              </Text>
            )}
          </View>
        )}

        {/* Read Status */}
        {isRead && (
          <View style={[styles.readBadge, { backgroundColor: colors.primary + '20' }]}>
            <Icon name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={[styles.readText, { color: colors.primary }]}>
              Marked as read
            </Text>
          </View>
        )}
      </ScrollView>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    marginBottom: 16,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 32,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 6,
  },
  metaDivider: {
    width: 1,
    height: 16,
    marginHorizontal: 12,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: 250,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  targetContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  targetTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  targetInfo: {
    fontSize: 12,
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  readText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 16,
  },
});

export default NoticeDetailsScreen;
