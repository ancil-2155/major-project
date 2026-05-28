import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GalleryPost } from '../../types/gallery';
import { deleteGalleryPost } from '../../services/gallery/galleryService';
import { useAppTheme } from '../../theme/appTheme';

const GalleryManagementScreen = ({ navigation }: any) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('galleryPosts')
      .limit(100)
      .onSnapshot(
        snapshot => {
          const nextPosts = snapshot.docs
            .map(doc => ({
              ...(doc.data() as GalleryPost),
              postId: (doc.data() as GalleryPost).postId || doc.id,
            }))
            .filter(post => post.status !== 'deleted')
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
              const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
              return bTime - aTime;
            });
          setPosts(nextPosts);
          setLoading(false);
        },
        error => {
          console.error('Gallery management error:', error);
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, []);

  const approvedCount = posts.filter(post => post.status === 'approved').length;
  const pendingCount = posts.filter(post => post.status === 'pending').length;
  const totalComments = posts.reduce((sum, post) => sum + (post.commentCount || 0), 0);

  const handleDeletePost = (post: GalleryPost) => {
    Alert.alert('Delete Gallery Post', 'This will remove the post from all feeds.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const user = auth().currentUser;
          if (!user) {
            Alert.alert('Error', 'Admin session expired.');
            return;
          }

          try {
            await deleteGalleryPost(post.postId, user.uid, true);
          } catch (error: any) {
            Alert.alert('Delete Failed', error.message || 'Could not delete this post.');
          }
        },
      },
    ]);
  };

  const renderPost = ({ item }: { item: GalleryPost }) => {
    const title = item.heading || item.caption || 'Gallery post';
    const ownerName = item.userName || item.uploaderName || 'ACAMS User';
    const category = item.category || 'campus';

    return (
      <View style={styles.postCard}>
        <View style={styles.thumbnailWrap}>
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

        <View style={styles.postInfo}>
          <Text style={styles.postTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.postMeta} numberOfLines={1}>
            {ownerName} - {category}
          </Text>
          <Text style={styles.postStats}>
            {item.likeCount || 0} likes - {item.commentCount || 0} comments
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePost(item)}
          activeOpacity={0.76}>
          <Icon name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    );
  };

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
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Gallery Management</Text>
          <Text style={styles.headerSubtitle}>Moderate posts and reports</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.reportRow}>
        <View style={styles.reportCard}>
          <Text style={styles.reportValue}>{posts.length}</Text>
          <Text style={styles.reportLabel}>Posts</Text>
        </View>
        <View style={styles.reportCard}>
          <Text style={styles.reportValue}>{approvedCount}</Text>
          <Text style={styles.reportLabel}>Approved</Text>
        </View>
        <View style={styles.reportCard}>
          <Text style={styles.reportValue}>{pendingCount}</Text>
          <Text style={styles.reportLabel}>Pending</Text>
        </View>
        <View style={styles.reportCard}>
          <Text style={styles.reportValue}>{totalComments}</Text>
          <Text style={styles.reportLabel}>Comments</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.postId}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="images-outline" size={38} color={colors.primary} />
              <Text style={styles.emptyTitle}>No gallery posts</Text>
              <Text style={styles.emptySubtitle}>Uploaded posts will appear here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default GalleryManagementScreen;

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 52 : 20,
      paddingBottom: 12,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.chip,
    },
    headerTextWrap: {
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
    reportRow: {
      flexDirection: 'row',
      gap: 8,
      padding: 12,
    },
    reportCard: {
      flex: 1,
      minHeight: 68,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0.18 : 0.05,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 10,
      elevation: 1,
    },
    reportValue: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '900',
    },
    reportLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '700',
      marginTop: 3,
    },
    listContent: {
      padding: 12,
      paddingBottom: 34,
    },
    postCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: 10,
    },
    thumbnailWrap: {
      width: 70,
      height: 70,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: colors.cardAlt,
    },
    thumbnail: {
      width: '100%',
      height: '100%',
    },
    videoBadge: {
      position: 'absolute',
      right: 6,
      bottom: 6,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.56)',
    },
    postInfo: {
      flex: 1,
      minWidth: 0,
    },
    postTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '900',
    },
    postMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 4,
      textTransform: 'capitalize',
    },
    postStats: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 5,
    },
    deleteButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(248,113,113,0.12)' : '#FEF2F2',
    },
    empty: {
      alignItems: 'center',
      paddingTop: 82,
      paddingHorizontal: 30,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '900',
      marginTop: 12,
    },
    emptySubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      marginTop: 6,
    },
  });
