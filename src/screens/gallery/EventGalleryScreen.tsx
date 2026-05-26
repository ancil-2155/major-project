import React, { useEffect, useState, useRef } from 'react';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { GalleryPost } from '../../types/gallery';
import { likePost, unlikePost } from '../../services/gallery/galleryService';

const { width } = Dimensions.get('window');

const EventGalleryScreen = ({ navigation }: any) => {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      setCurrentUserId(user.uid);
      firestore().collection('users').doc(user.uid).get().then(doc => {
        setCurrentUserName(doc.data()?.name || 'Unknown');
      });
    }

    const unsubscribe = firestore()
      .collection('galleryPosts')
      .where('status', '==', 'approved')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .onSnapshot((snapshot) => {
        if (!snapshot) return;
        const fetchedPosts: GalleryPost[] = [];
        snapshot.docs.forEach((doc) => {
          fetchedPosts.push(doc.data() as GalleryPost);
        });
        setPosts(fetchedPosts);
        setLoading(false);
        setRefreshing(false);

        // Fetch likes for current user for these posts
        if (user) {
          fetchUserLikes(user.uid, snapshot.docs.map(d => d.id));
        }
      }, (error) => {
        console.error('Error fetching gallery:', error);
        setLoading(false);
        setRefreshing(false);
      });

    return () => unsubscribe();
  }, []);

  const fetchUserLikes = async (userId: string, postIds: string[]) => {
    // In a production app with many posts, you'd want to optimize this or embed it.
    // For now, we fetch the like status individually.
    const likesMap: Record<string, boolean> = { ...userLikes };
    for (const pid of postIds) {
      if (likesMap[pid] !== undefined) continue;
      const likeDoc = await firestore().collection('galleryPosts').doc(pid).collection('likes').doc(userId).get();
      likesMap[pid] = likeDoc.exists;
    }
    setUserLikes(likesMap);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // The onSnapshot will automatically update, but we trigger refresh animation
    setTimeout(() => setRefreshing(false), 1000);
  };

  const toggleLike = async (post: GalleryPost) => {
    if (!currentUserId) return;
    const isLiked = userLikes[post.postId];
    
    // Optimistic UI update
    setUserLikes(prev => ({ ...prev, [post.postId]: !isLiked }));
    
    try {
      if (isLiked) {
        await unlikePost(post.postId, currentUserId);
      } else {
        await likePost(post.postId, currentUserId, currentUserName);
      }
    } catch (error) {
      console.error('Like error:', error);
      // Revert optimistic update
      setUserLikes(prev => ({ ...prev, [post.postId]: isLiked }));
    }
  };

  const renderItem = ({ item }: { item: GalleryPost }) => {
    const isLiked = userLikes[item.postId];
    const date = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : '';

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          {item.uploaderPhotoUrl ? (
            <Image source={{ uri: item.uploaderPhotoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.uploaderName.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.uploaderName}>{item.uploaderName}</Text>
            <Text style={styles.dateText}>{date}</Text>
          </View>
        </View>

        {/* Media */}
        {item.mediaType === 'image' ? (
          <Image source={{ uri: item.mediaUrl }} style={styles.mediaImage} />
        ) : (
          <View style={styles.mediaVideoContainer}>
            <Video
              source={{ uri: item.mediaUrl }}
              style={styles.mediaVideo}
              resizeMode="cover"
              repeat
              muted={true}
              paused={playingVideoId !== item.postId}
            />
            <TouchableOpacity 
              style={styles.playOverlay}
              onPress={() => setPlayingVideoId(playingVideoId === item.postId ? null : item.postId)}
            >
              {playingVideoId !== item.postId && <Text style={styles.playIcon}>▶️</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Footer / Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => toggleLike(item)} style={styles.actionBtn}>
            <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
            <Text style={styles.actionText}>{item.likeCount} Likes</Text>
          </TouchableOpacity>
        </View>

        {/* Caption */}
        <View style={styles.captionContainer}>
          <Text style={styles.heading}>{item.heading}</Text>
          {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Gallery</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateGalleryPost')}>
          <Text style={styles.addIcon}>➕</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={item => item.postId}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No event posts yet.</Text>
          </View>
        }
        onViewableItemsChanged={({ viewableItems }) => {
          if (viewableItems.length > 0) {
            // Auto play the first fully visible video
            const firstVideo = viewableItems.find(v => v.item.mediaType === 'video');
            if (firstVideo) {
              setPlayingVideoId(firstVideo.item.postId);
            } else {
              setPlayingVideoId(null);
            }
          }
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
      />
    </View>
  );
};

export default EventGalleryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: { padding: 10, paddingLeft: 0 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  addBtn: { padding: 10, paddingRight: 0 },
  addIcon: { fontSize: 20 },
  listContent: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  headerText: { marginLeft: 10 },
  uploaderName: { fontWeight: 'bold', fontSize: 16, color: '#1F2937' },
  dateText: { color: '#6B7280', fontSize: 12 },
  mediaImage: { width: width, height: width, resizeMode: 'cover' },
  mediaVideoContainer: { width: width, height: width, backgroundColor: '#000' },
  mediaVideo: { width: '100%', height: '100%' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { fontSize: 50, opacity: 0.8 },
  actions: { flexDirection: 'row', padding: 15, paddingBottom: 5 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  actionIcon: { fontSize: 22, marginRight: 5 },
  actionText: { fontWeight: '600', color: '#1F2937' },
  captionContainer: { padding: 15, paddingTop: 5 },
  heading: { fontWeight: 'bold', fontSize: 16, marginBottom: 5, color: '#1F2937' },
  caption: { color: '#4B5563', lineHeight: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyIcon: { fontSize: 50, marginBottom: 10 },
  emptyText: { color: '#6B7280', fontSize: 16 },
});
