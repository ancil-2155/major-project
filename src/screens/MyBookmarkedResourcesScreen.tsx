import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { LibraryResource } from '../types/library';
import { getResourcesForStudent, checkBookmarked } from '../services/library/libraryService';
import SafeScreen from '../components/common/SafeScreen';

const MyBookmarkedResourcesScreen = ({ navigation }: any) => {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const user = auth().currentUser;
      if (!user) throw new Error('Not logged in');

      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      if (!userData) throw new Error('Profile not found');

      // 1. Fetch all student resources
      const allData = await getResourcesForStudent(userData);
      
      // 2. Filter by bookmarks manually (this avoids composite index issues)
      const bookmarked: LibraryResource[] = [];
      for (const res of allData) {
        if (res.bookmarkCount > 0) { // optimization
          const isMarked = await checkBookmarked(res.resourceId, user.uid);
          if (isMarked) bookmarked.push(res);
        }
      }
      
      setResources(bookmarked);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const getIcon = (type: string) => {
    switch(type) {
      case 'pdf': return '📄';
      case 'notes': return '📝';
      case 'video': return '🎥';
      case 'book': return '📚';
      case 'link': return '🔗';
      case 'image': return '🖼️';
      default: return '📎';
    }
  };

  const renderItem = ({ item }: { item: LibraryResource }) => {
    const dateStr = item.createdAt && (item.createdAt as any).toDate 
      ? (item.createdAt as any).toDate().toLocaleDateString() 
      : '';

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('LibraryResourceDetails', { resource: item })}
      >
        <View style={styles.cardLeft}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>{getIcon(item.resourceType)}</Text>
          </View>
        </View>
        
        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.subject}>{item.subject} • {dateStr}</Text>
          
          <View style={styles.statsRow}>
            <Text style={styles.uploaderText}>By: {item.uploadedByName}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (error) {
    return <SafeScreen error={error} onRetry={loadData} onGoBack={() => navigation.goBack()} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Bookmarks</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={{color: '#64748b', marginTop: 12}}>Loading bookmarks...</Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={item => item.resourceId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🔖</Text>
              <Text style={styles.emptyTitle}>No Bookmarks</Text>
              <Text style={styles.emptySub}>Resources you bookmark will appear here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default MyBookmarkedResourcesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 22 },
  backIcon: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
  },
  cardLeft: { marginRight: 16 },
  iconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(56,189,248,0.15)', justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 28 },
  cardBody: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
  subject: { fontSize: 13, color: '#94a3b8', marginBottom: 12 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  uploaderText: { fontSize: 12, color: '#64748b' },

  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16, opacity: 0.8 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#94a3b8' },
});
