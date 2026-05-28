import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { GalleryPost } from '../../types/gallery';
import { deleteOwnPost } from '../../services/gallery/galleryService';
import { useAppTheme } from '../../theme/appTheme';

const MyGalleryPostsScreen = ({ navigation }: any) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.uid);
    const unsubscribe = firestore()
      .collection('galleryPosts')
      .where('uploaderId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snapshot => {
          if (!snapshot) {
            return;
          }
          const fetched = snapshot.docs.map(doc => ({
            ...(doc.data() as GalleryPost),
            postId: (doc.data() as GalleryPost).postId || doc.id,
          })).filter(post => post.status !== 'deleted');
          setPosts(fetched);
          setLoading(false);
        },
        err => {
          console.error(err);
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, []);

  const handleDelete = (post: GalleryPost) => {
    Alert.alert('Delete Post', 'Delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteOwnPost(post.postId, userId!);
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: GalleryPost['status']) => {
    if (status === 'approved') {
      return colors.success;
    }
    if (status === 'rejected') {
      return colors.danger;
    }
    return colors.warning;
  };

  const renderItem = ({ item }: { item: GalleryPost }) => {
    const statusColor = getStatusColor(item.status);
    const date = item.createdAt?.toDate
      ? item.createdAt.toDate().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Recently';

    return (
      <View style={styles.card}>
        <View style={styles.thumbWrap}>
          <Image
            source={{ uri: item.thumbnailUrl || item.mediaUrl }}
            style={styles.thumbnail}
          />
          {item.mediaType === 'video' ? (
            <View style={styles.videoBadge}>
              <Icon name="play" size={12} color="#FFFFFF" />
            </View>
          ) : null}
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.heading} numberOfLines={1}>
            {item.heading || 'Gallery Post'}
          </Text>
          <Text style={styles.date}>{date}</Text>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.deleteBtn}
          activeOpacity={0.72}>
          <Icon name="trash-outline" size={21} color={colors.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.72}>
          <Icon name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Posts</Text>
          <Text style={styles.headerSubtitle}>Uploads and approvals</Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('CreateGalleryPost')}
          activeOpacity={0.72}>
          <Icon name="add" size={25} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.postId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Icon name="albums-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.emptyText}>No posts uploaded</Text>
            <Text style={styles.emptySubtext}>
              Your gallery submissions and approval status will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default MyGalleryPostsScreen;

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 52 : 20,
      paddingBottom: 12,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.chip,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '900',
    },
    headerSubtitle: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      marginTop: 1,
    },
    listContent: {
      padding: 14,
      paddingBottom: 34,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0.22 : 0.07,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 18,
      elevation: 2,
    },
    thumbWrap: {
      width: 76,
      height: 76,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.cardAlt,
    },
    thumbnail: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    videoBadge: {
      position: 'absolute',
      right: 7,
      bottom: 7,
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardInfo: {
      flex: 1,
      minWidth: 0,
      marginLeft: 12,
    },
    heading: {
      color: colors.text,
      fontWeight: '900',
      fontSize: 15,
    },
    date: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 5,
      fontWeight: '600',
    },
    statusPill: {
      marginTop: 8,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.4,
    },
    deleteBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#3B1115' : '#FEF2F2',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingTop: 90,
      paddingHorizontal: 32,
    },
    emptyIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '900',
      textAlign: 'center',
    },
    emptySubtext: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 19,
      marginTop: 6,
    },
  });
