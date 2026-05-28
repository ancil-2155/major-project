import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  AlertButton,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import Share from 'react-native-share';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { GalleryCategory, GalleryComment, GalleryPost } from '../../types/gallery';
import {
  addGalleryComment,
  deleteGalleryComment,
  deleteGalleryPost,
  likePost,
  subscribeGalleryComments,
  unlikePost,
} from '../../services/gallery/galleryService';
import { useAppTheme } from '../../theme/appTheme';
import ACAMSLogo from '../../components/common/ACAMSLogo';
import AppBackButton from '../../components/common/AppBackButton';

const { width } = Dimensions.get('window');

const CATEGORY_OPTIONS: { id: GalleryCategory; label: string; color: string }[] = [
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
  const [currentUserRole, setCurrentUserRole] = useState<'student' | 'teacher' | 'admin' | 'parent'>('student');
  const [currentUserPhotoUrl, setCurrentUserPhotoUrl] = useState<string | null>(null);
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('campus');
  const [commentsPost, setCommentsPost] = useState<GalleryPost | null>(null);
  const [comments, setComments] = useState<GalleryComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

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
          const data = doc.data();
          setCurrentUserName(data?.name || 'ACAMS User');
          setCurrentUserRole(data?.role || 'student');
          setCurrentUserPhotoUrl(data?.profilePhoto || data?.profilePhotoUrl || null);
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

  useEffect(() => {
    if (!commentsPost) {
      setComments([]);
      setCommentText('');
      return undefined;
    }

    setCommentsLoading(true);
    const unsubscribe = subscribeGalleryComments(
      commentsPost.postId,
      nextComments => {
        setComments(nextComments);
        setCommentsLoading(false);
      },
      error => {
        console.error('Comments error:', error);
        setCommentsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [commentsPost]);

  const visiblePosts = useMemo(
    () => posts.filter(post => (post.category || 'campus') === selectedCategory),
    [posts, selectedCategory],
  );

  const renderCategoryPills = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryPillsWrap}>
      {CATEGORY_OPTIONS.map(item => {
        const active = selectedCategory === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => setSelectedCategory(item.id)}
            activeOpacity={0.78}>
            <Animated.View
              style={[
                styles.categoryPill,
                active && {
                  backgroundColor: item.color,
                  borderColor: item.color,
                  transform: [{ scale: 1.04 }],
                },
              ]}>
              <Text
                style={[
                  styles.categoryPillText,
                  active && styles.categoryPillTextActive,
                ]}>
                {item.label}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderListHeader = () => (
    <View>
      {renderCategoryPills()}
      <View style={styles.feedIntro}>
        <Text style={styles.feedTitle}>Latest moments</Text>
        <Text style={styles.feedSubtitle}>
          Approved posts from campus events and classes
        </Text>
      </View>
    </View>
  );

  const handleShare = async (post: GalleryPost) => {
    try {
      await Share.open({
        title: post.heading || 'ACAMS Gallery',
        message: `${post.heading || 'ACAMS Gallery'}${post.caption ? `\n\n${post.caption}` : ''}\n\n${post.mediaUrl}`,
        url: post.mediaUrl,
        failOnCancel: false,
      });
    } catch (error: any) {
      if (!String(error?.message || '').toLowerCase().includes('cancel')) {
        Alert.alert('Share Failed', 'Could not open sharing options.');
      }
    }
  };

  const handlePostMenu = (post: GalleryPost) => {
    const ownerId = post.userId || post.uploaderId;
    const canDelete = currentUserRole === 'admin' || ownerId === currentUserId;
    const actions: AlertButton[] = [
      { text: 'Cancel', style: 'cancel' as const },
      { text: 'Share', onPress: () => handleShare(post) },
    ];

    if (canDelete && currentUserId) {
      actions.push({
        text: currentUserRole === 'admin' && ownerId !== currentUserId ? 'Delete as Admin' : 'Delete Post',
        style: 'destructive' as const,
        onPress: async () => {
          try {
            await deleteGalleryPost(post.postId, currentUserId, currentUserRole === 'admin');
          } catch (error: any) {
            Alert.alert('Delete Failed', error.message || 'Could not delete this post.');
          }
        },
      });
    }

    Alert.alert('Post Options', post.heading || 'Gallery post', actions);
  };

  const submitComment = async () => {
    const text = commentText.trim();
    if (!commentsPost || !currentUserId || !text) {
      return;
    }

    setCommentText('');
    try {
      await addGalleryComment(commentsPost.postId, {
        userId: currentUserId,
        userName: currentUserName || 'ACAMS User',
        userRole: currentUserRole,
        userPhotoUrl: currentUserPhotoUrl,
        text,
      });
    } catch (error: any) {
      setCommentText(text);
      Alert.alert('Comment Failed', error.message || 'Could not add comment.');
    }
  };

  const handleDeleteComment = (comment: GalleryComment) => {
    if (!currentUserId) {
      return;
    }
    const canDelete = currentUserRole === 'admin' || comment.userId === currentUserId;
    if (!canDelete || !commentsPost) {
      return;
    }

    Alert.alert('Delete Comment', 'Delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGalleryComment(
              commentsPost.postId,
              comment,
              currentUserId,
              currentUserRole === 'admin',
            );
          } catch (error: any) {
            Alert.alert('Delete Failed', error.message || 'Could not delete comment.');
          }
        },
      },
    ]);
  };

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

          <TouchableOpacity
            onPress={() => handlePostMenu(item)}
            style={styles.moreButton}
            activeOpacity={0.7}>
            <Icon name="ellipsis-horizontal" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
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
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setCommentsPost(item)}
              activeOpacity={0.7}>
              <Icon
                name="chatbubble-outline"
                size={25}
                color={colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(item)}
              activeOpacity={0.7}>
              <Icon
                name="paper-plane-outline"
                size={25}
                color={colors.text}
              />
            </TouchableOpacity>
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
            <Text style={styles.commentText} onPress={() => setCommentsPost(item)}>
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
        data={visiblePosts}
        keyExtractor={item => item.postId}
        renderItem={({ item }) => <PostCard item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderListHeader}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        updateCellsBatchingPeriod={80}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
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
              Approved {selectedCategory} photos and videos will appear here.
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

      <Modal
        visible={Boolean(commentsPost)}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentsPost(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.commentsSheet}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCommentsPost(null)}
                activeOpacity={0.7}>
                <Icon name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {commentsLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.commentsLoader} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={item => item.commentId}
                style={styles.commentsList}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={styles.emptyComments}>
                    <Text style={styles.emptyText}>No comments yet</Text>
                    <Text style={styles.emptySubtext}>Start the conversation.</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const canDelete =
                    currentUserRole === 'admin' || item.userId === currentUserId;
                  const date = item.createdAt?.toDate
                    ? item.createdAt.toDate().toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Now';

                  return (
                    <TouchableOpacity
                      style={styles.commentRow}
                      activeOpacity={canDelete ? 0.72 : 1}
                      onLongPress={() => handleDeleteComment(item)}>
                      {item.userPhotoUrl ? (
                        <Image source={{ uri: item.userPhotoUrl }} style={styles.commentAvatar} />
                      ) : (
                        <View style={styles.commentAvatarFallback}>
                          <Text style={styles.commentAvatarText}>
                            {(item.userName || 'A').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.commentBody}>
                        <View style={styles.commentMetaRow}>
                          <Text style={styles.commentName} numberOfLines={1}>
                            {item.userName || 'ACAMS User'}
                          </Text>
                          <Text style={styles.commentDate}>{date}</Text>
                        </View>
                        <Text style={styles.commentMessage}>{item.text}</Text>
                      </View>
                      {canDelete ? (
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(item)}
                          style={styles.commentDeleteButton}>
                          <Icon name="trash-outline" size={18} color={colors.danger} />
                        </TouchableOpacity>
                      ) : null}
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={colors.muted}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[
                  styles.commentSendButton,
                  !commentText.trim() && styles.commentSendButtonDisabled,
                ]}
                onPress={submitComment}
                disabled={!commentText.trim()}
                activeOpacity={0.76}>
                <Icon name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    categoryPillsWrap: {
      paddingVertical: 14,
      paddingHorizontal: 12,
      flexDirection: 'row',
      gap: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryPill: {
      minHeight: 38,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryPillText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '800',
    },
    categoryPillTextActive: {
      color: '#FFFFFF',
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
    moreButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
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
    modalBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.overlay,
    },
    commentsSheet: {
      maxHeight: '82%',
      minHeight: '48%',
      backgroundColor: colors.modal,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    commentsHeader: {
      minHeight: 58,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    commentsTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '900',
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.chip,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentsLoader: {
      marginVertical: 30,
    },
    commentsList: {
      flexGrow: 0,
    },
    emptyComments: {
      paddingVertical: 48,
      paddingHorizontal: 28,
      alignItems: 'center',
    },
    commentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 10,
    },
    commentAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.cardAlt,
    },
    commentAvatarFallback: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentAvatarText: {
      color: colors.primary,
      fontWeight: '900',
      fontSize: 14,
    },
    commentBody: {
      flex: 1,
      minWidth: 0,
    },
    commentMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    commentName: {
      flexShrink: 1,
      color: colors.text,
      fontSize: 13,
      fontWeight: '900',
    },
    commentDate: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '600',
    },
    commentMessage: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 3,
    },
    commentDeleteButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentInputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    commentInput: {
      flex: 1,
      maxHeight: 92,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.input,
      color: colors.text,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
    },
    commentSendButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    commentSendButtonDisabled: {
      opacity: 0.45,
    },
  });
};
