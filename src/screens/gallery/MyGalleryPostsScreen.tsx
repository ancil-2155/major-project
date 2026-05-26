import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { GalleryPost } from '../../types/gallery';
import { deleteOwnPendingPost } from '../../services/gallery/galleryService';

const MyGalleryPostsScreen = ({ navigation }: any) => {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      setUserId(user.uid);
      const unsubscribe = firestore()
        .collection('galleryPosts')
        .where('uploaderId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
          if (!snapshot) return;
          const fetched: GalleryPost[] = [];
          snapshot.docs.forEach(doc => fetched.push(doc.data() as GalleryPost));
          setPosts(fetched);
          setLoading(false);
        }, (err) => {
          console.error(err);
          setLoading(false);
        });

      return () => unsubscribe();
    }
  }, []);

  const handleDelete = (post: GalleryPost) => {
    if (post.status !== 'pending') {
      Alert.alert('Cannot Delete', 'You can only delete pending posts.');
      return;
    }

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOwnPendingPost(post.postId, userId!);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: GalleryPost }) => (
    <View style={styles.card}>
      <Image 
        source={{ uri: item.mediaUrl }} 
        style={styles.thumbnail} 
      />
      <View style={styles.cardInfo}>
        <Text style={styles.heading} numberOfLines={1}>{item.heading}</Text>
        <Text style={styles.status}>Status: {item.status.toUpperCase()}</Text>
        <Text style={styles.date}>
          {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : ''}
        </Text>
      </View>
      {item.status === 'pending' && (
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Posts</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <FlatList
        data={posts}
        keyExtractor={item => item.postId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You haven't uploaded any posts.</Text>
          </View>
        }
      />
    </View>
  );
};

export default MyGalleryPostsScreen;

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
  backBtn: { padding: 10, paddingLeft: 0, width: 60 },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 15 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  thumbnail: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#E5E7EB' },
  cardInfo: { flex: 1, marginLeft: 15 },
  heading: { fontWeight: 'bold', fontSize: 16, color: '#1F2937' },
  status: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  date: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 10 },
  deleteIcon: { fontSize: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#6B7280', fontSize: 16 },
});
