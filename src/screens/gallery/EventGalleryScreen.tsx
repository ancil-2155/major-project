import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { GalleryPost } from '../../types/gallery';
import { likePost, unlikePost } from '../../services/gallery/galleryService';
import { useAppTheme } from '../../theme/appTheme';
import ACAMSLogo from '../../components/common/ACAMSLogo';
import AppBackButton from '../../components/common/AppBackButton';

const { width } = Dimensions.get('window');

const storyItems = [
  { id: 'campus', label: 'Campus', color: '#EC4899' },
  { id: 'events', label: 'Events', color: '#8B5CF6' },
  { id: 'classes', label: 'Classes', color: '#06B6D4' },
  { id: 'sports', label: 'Sports', color: '#10B981' },
  { id: 'arts', label: 'Arts', color: '#F59E0B' },
];

const EventGalleryScreen = ({ navigation }: any) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 78 }).current;

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      setCurrentUserId(user.uid);
      firestore()
        .collection('users')
        .doc(user.uid)
        .get()
        .then(doc => {
          setCurrentUserName(doc.data()?.name || 'ACAMS User');
        });
    }

    const unsubscribe = firestore()
      .collection('galleryPosts')
      .where('status', '==', 'approved')
      .limit(30)
      .onSnapshot(
        snapshot => {
          if (!snapshot) {
            return;
          }

          const fetchedPosts: GalleryPost[] = snapshot.docs.map(doc => ({
            ...(doc.data() as GalleryPost),
            postId: (doc.data() as GalleryPost).postId || doc.id,
          }));

          fetchedPosts.sort((a, b) => {
            const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return bTime - aTime;
          });

          setPosts(fetchedPosts);
          setLoading(false);
          setRefreshing(false);

          if (user) {
            fetchUserLikes(user.uid, fetchedPosts.map(post => post.postId));
          }
        },
        error => {
          console.error('Error fetching gallery:', error);
          setLoading(false);
          setRefreshing(false);
        },
      );

    return () => unsubscribe();
  }, []);

  const fetchUserLikes = async (userId: string, postIds: string[]) => {
    const likesMap: Record<string, boolean> = {};
    await Promise.all(
      postIds.map(async postId => {
        try {
          const likeDoc = await firestore()
            .collection('galleryPosts')
            .doc(postId)
            .collection('likes')
            .doc(userId)
            .get();
          const exists =
            typeof (likeDoc as any).exists === 'function'
              ? (likeDoc as any).exists()
              : Boolean((likeDoc as any).exists);
          likesMap[postId] = exists;
        } catch {
          likesMap[postId] = false;
        }
      }),
    );
    setUserLikes(previous => ({ ...previous, ...likesMap }));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  };

  const toggleLike = async (post: GalleryPost) => {
    if (!currentUserId) {
      return;
    }

    const isLiked = Boolean(userLikes[post.postId]);
    setUserLikes(prev => ({ ...prev, [post.postId]: !isLiked }));

    try {
      if (isLiked) {
        await unlikePost(post.postId, currentUserId);
      } else {
        await likePost(post.postId, currentUserId, currentUserName);
      }
    } catch (error) {
      console.error('Like error:', error);
      setUserLikes(prev => ({ ...prev, [post.postId]: isLiked }));
    }
  };

  const formatDate = (post: GalleryPost) => {
    const date = post.createdAt?.toDate ? post.createdAt.toDate() : null;
    if (!date) {
      return 'Recently';
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderStories = () => (
    <View style={styles.storiesWrap}>
      {storyItems.map(item => (
        <View key={item.id} style={styles.storyItem}>
          <View style={[styles.storyRing, { borderColor: item.color }]}>
            <Text style={[styles.storyInitial, { color: item.color }]}>
              {item.label.charAt(0)}
            </Text>
          </View>
          <Text style={styles.storyLabel} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderListHeader = () => (
    <View>
      {renderStories()}
      <View style={styles.feedIntro}>
        <Text style={styles.feedTitle}>Latest moments</Text>
        <Text style={styles.feedSubtitle}>
          Approved posts from campus events and classes
        </Text>
      </View>
    </View>
  );

  const PostCard = ({ item }: { item: GalleryPost }) => {
    const isLiked = Boolean(userLikes[item.postId]);
    const uploaderInitial = (item.uploaderName || 'A').charAt(0).toUpperCase();
    const isVideo = item.mediaType === 'video';
    
    const [lastTap, setLastTap] = useState(0);
    const heartScale = useRef(new Animated.Value(0)).current;
    const heartOpacity = useRef(new Animated.Value(0)).current;

    const handleDoubleTap = () => {
      const now = Date.now();
      if (now - lastTap < 300) {
        if (!isLiked) {
          toggleLike(item);
        }
        
        // Heart animation
        heartScale.setValue(0);
        heartOpacity.setValue(1);
        
        Animated.parallel([
          Animated.spring(heartScale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(heartOpacity, {
            toValue: 0,
            duration: 800,
            delay: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }
      setLastTap(now);
    };

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          {item.uploaderPhotoUrl ? (
            <Image source={{ uri: item.uploaderPhotoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{uploaderInitial}</Text>
            </View>
          )}

          <View style={styles.postHeaderText}>
            <View style={styles.nameRow}>
              <Text style={styles.uploaderName} numberOfLines={1}>
                {item.uploaderName || 'ACAMS User'}
              </Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {(item.uploaderRole || 'school').toString()}
                </Text>
              </View>
            </View>
            <Text style={styles.dateText}>{formatDate(item)}</Text>
          </View>

          <Icon name="ellipsis-horizontal" size={22} color={colors.textSecondary} />
        </View>

        <TouchableOpacity 
          activeOpacity={1} 
          onPress={handleDoubleTap} 
          style={styles.mediaFrame}
        >
          {isVideo ? (
            <>
              <Video
                source={{ uri: item.mediaUrl }}
                style={styles.media}
                resizeMode="cover"
                repeat
                muted
                paused={playingVideoId !== item.postId}
              />
              <TouchableOpacity
                style={styles.playOverlay}
                onPress={() =>
                  setPlayingVideoId(
                    playingVideoId === item.postId ? null : item.postId,
                  )
                }
                activeOpacity={0.85}>
                {playingVideoId !== item.postId ? (
                  <View style={styles.playButton}>
                    <Icon name="play" size={26} color="#FFFFFF" />
                  </View>
                ) : null}
              </TouchableOpacity>
            </>
          ) : (
            <Image source={{ uri: item.mediaUrl }} style={styles.media} />
          )}
          
          {/* Big Heart Animation Overlay */}
          <Animated.View 
            style={[
              styles.heartOverlay, 
              { 
                opacity: heartOpacity,
                transform: [{ scale: heartScale }] 
              }
            ]}
            pointerEvents="none"
          >
            <Icon name="heart" size={100} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.actionsRow}>
          <View style={styles.leftActions}>
            <TouchableOpacity
              onPress={() => toggleLike(item)}
              style={styles.actionButton}
              activeOpacity={0.7}>
              <Icon
                name={isLiked ? 'heart' : 'heart-outline'}
                size={27}
                color={isLiked ? '#EF4444' : colors.text}
              />
            </TouchableOpacity>
            <View style={styles.actionButton}>
              <Icon
                name="chatbubble-outline"
                size={25}
                color={colors.text}
              />
            </View>
            <View style={styles.actionButton}>
              <Icon
                name="paper-plane-outline"
                size={25}
                color={colors.text}
              />
            </View>
          </View>
          <View style={styles.actionButton}>
            <Icon name="bookmark-outline" size={25} color={colors.text} />
          </View>
        </View>

        <View style={styles.captionWrap}>
          <Text style={styles.likeText}>
            {item.likeCount || 0} {(item.likeCount || 0) === 1 ? 'like' : 'likes'}
          </Text>
          <Text style={styles.captionText}>
            <Text style={styles.captionName}>{item.heading || 'ACAMS Event'}</Text>
            {item.caption ? ` ${item.caption}` : ''}
          </Text>
          {item.commentCount ? (
            <Text style={styles.commentText}>
              View {item.commentCount} comments
            </Text>
          ) : null}
        </View>
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
        <AppBackButton
          navigation={navigation}
          fallbackRoute="StudentHome"
          iconColor={colors.text}
          backgroundColor={colors.chip}
          style={styles.headerButton}
        />
        <View style={styles.brandWrap}>
          <ACAMSLogo size={34} />
          <View>
            <Text style={styles.headerTitle}>ACAMS Gallery</Text>
            <Text style={styles.headerSubtitle}>Campus feed</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('CreateGalleryPost')}
          activeOpacity={0.74}>
          <Icon name="add" size={25} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.postId}
        renderItem={({ item }) => <PostCard item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderListHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Icon name="images-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.emptyText}>No gallery posts yet</Text>
            <Text style={styles.emptySubtext}>
              Approved event photos and videos will appear here.
            </Text>
          </View>
        }
        onViewableItemsChanged={({ viewableItems }) => {
          const firstVideo = viewableItems.find(
            item => item.item?.mediaType === 'video',
          );
          setPlayingVideoId(firstVideo?.item?.postId || null);
        }}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
};

export default EventGalleryScreen;

const createStyles = (colors: any, isDark: boolean) => {
  const horizontalPadding = 12;
  const mediaWidth = width - horizontalPadding * 2;

  return StyleSheet.create({
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
    brandWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
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
      paddingBottom: 34,
    },
    storiesWrap: {
      paddingVertical: 14,
      paddingHorizontal: 12,
      flexDirection: 'row',
      gap: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    storyItem: {
      width: 58,
      alignItems: 'center',
    },
    storyRing: {
      width: 54,
      height: 54,
      borderRadius: 27,
      borderWidth: 2,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    storyInitial: {
      fontSize: 18,
      fontWeight: '900',
    },
    storyLabel: {
      marginTop: 6,
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
    },
    feedIntro: {
      paddingHorizontal: 14,
      paddingTop: 16,
      paddingBottom: 10,
    },
    feedTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '900',
    },
    feedSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 4,
    },
    postCard: {
      marginHorizontal: horizontalPadding,
      marginBottom: 18,
      overflow: 'hidden',
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0.24 : 0.08,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 22,
      elevation: 2,
    },
    postHeader: {
      minHeight: 66,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.cardAlt,
    },
    avatarPlaceholder: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: colors.primary,
      fontWeight: '900',
      fontSize: 16,
    },
    postHeaderText: {
      flex: 1,
      minWidth: 0,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    uploaderName: {
      flexShrink: 1,
      color: colors.text,
      fontSize: 14,
      fontWeight: '900',
    },
    roleBadge: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: colors.chip,
    },
    roleBadgeText: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'capitalize',
    },
    dateText: {
      color: colors.muted,
      fontSize: 11,
      marginTop: 3,
      fontWeight: '600',
    },
    mediaFrame: {
      width: mediaWidth,
      height: mediaWidth,
      backgroundColor: '#000000',
    },
    media: {
      width: '100%',
      height: '100%',
    },
    playOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.42)',
    },
    heartOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    actionsRow: {
      paddingHorizontal: 10,
      paddingTop: 9,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    actionButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
    },
    captionWrap: {
      paddingHorizontal: 14,
      paddingBottom: 15,
    },
    likeText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '900',
      marginBottom: 6,
    },
    captionText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    captionName: {
      color: colors.text,
      fontWeight: '900',
    },
    commentText: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 8,
      fontWeight: '700',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingTop: 80,
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
};
