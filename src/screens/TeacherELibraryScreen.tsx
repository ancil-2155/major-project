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
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { LibraryResource } from '../types/library';
import { getTeacherResources } from '../services/library/libraryService';
import SafeScreen from '../components/common/SafeScreen';

const TeacherELibraryScreen = ({ navigation }: any) => {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const user = auth().currentUser;
      if (!user) throw new Error('Not logged in');

      const data = await getTeacherResources(user.uid);
      setResources(data);
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

  const handleDelete = (resource: LibraryResource) => {
    Alert.alert('Hide Resource', 'Are you sure you want to hide this resource? Students will no longer see it.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Hide', 
        style: 'destructive',
        onPress: async () => {
          try {
            await firestore().collection('libraryResources').doc(resource.resourceId).update({
              status: 'hidden'
            });
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
  };

  const openResource = async (res: LibraryResource) => {
    const url = res.fileUrl || res.externalLink;
    if (url) {
      try {
        await Linking.openURL(url);
      } catch (e) {
        Alert.alert('Error', 'Could not open this file or link.');
      }
    } else {
      Alert.alert('Notice', 'No viewable link or file available.');
    }
  };

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
    const isHidden = item.status === 'hidden';
    const dateStr = item.createdAt && (item.createdAt as any).toDate 
      ? (item.createdAt as any).toDate().toLocaleDateString() 
      : '';

    return (
      <View style={[styles.card, isHidden && styles.cardHidden]}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>{getIcon(item.resourceType)}</Text>
          </View>
          <View style={styles.cardHeaderContent}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.subject}>{item.subject} • {dateStr}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, isHidden && { color: '#ef4444' }]}>
              {isHidden ? 'HIDDEN' : 'ACTIVE'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>👁️ {item.viewCount}</Text>
          <Text style={styles.statText}>⬇️ {item.downloadCount}</Text>
          <Text style={styles.statText}>🔖 {item.bookmarkCount}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openResource(item)}>
            <Text style={styles.actionBtnText}>View File</Text>
          </TouchableOpacity>
          
          {!isHidden && (
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
              <Text style={styles.deleteBtnText}>Hide</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
          <Text style={styles.headerTitle}>My E-Library</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#38bdf8" />
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
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyTitle}>No Resources</Text>
              <Text style={styles.emptySub}>You haven't uploaded anything yet.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('UploadLibraryResource')}
      >
        <LinearGradient colors={['#38bdf8', '#0284c7']} style={styles.fabGradient}>
          <Text style={styles.fabIcon}>➕</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default TeacherELibraryScreen;

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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHidden: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(56,189,248,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  icon: { fontSize: 24 },
  cardHeaderContent: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
  subject: { fontSize: 13, color: '#94a3b8' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(34,197,94,0.1)' },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#22c55e' },
  
  statsRow: { flexDirection: 'row', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12 },
  statText: { flex: 1, textAlign: 'center', color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: 'rgba(56,189,248,0.1)' },
  actionBtnText: { color: '#38bdf8', fontWeight: 'bold', fontSize: 13 },
  deleteBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)' },
  deleteBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 13 },
  
  fab: { position: 'absolute', bottom: 30, right: 24, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  fabIcon: { fontSize: 24, color: '#fff' },

  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16, opacity: 0.8 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#94a3b8' },
});
