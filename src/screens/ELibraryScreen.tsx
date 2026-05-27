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
  TextInput,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { LibraryResource } from '../types/library';
import { getResourcesForStudent } from '../services/library/libraryService';
import { searchExternalBooks, ExternalBookResult } from '../services/library/externalBookSearchService';
import SafeScreen from '../components/common/SafeScreen';

const filters = ['all', 'pdf', 'notes', 'video', 'book', 'link', 'image'];

const ELibraryScreen = ({ navigation }: any) => {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [filteredData, setFilteredData] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');
  const [externalBooks, setExternalBooks] = useState<ExternalBookResult[]>([]);
  const [searchingExternal, setSearchingExternal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const user = auth().currentUser;
      if (!user) throw new Error('Not logged in');

      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      if (!userData) throw new Error('Profile not found');

      const data = await getResourcesForStudent(userData);
      setResources(data);
      setFilteredData(data);
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

  useEffect(() => {
    let filtered = resources;
    if (activeFilter !== 'all') {
      filtered = filtered.filter(r => r.resourceType === activeFilter);
    }
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(q) || 
        r.subject.toLowerCase().includes(q) || 
        (r.description && r.description.toLowerCase().includes(q))
      );
    }
    setFilteredData(filtered);
  }, [search, activeFilter, resources]);

  useEffect(() => {
    if (activeTab === 'external') {
      const delaySearch = setTimeout(async () => {
        if (search.trim().length >= 3) {
          setSearchingExternal(true);
          try {
            const results = await searchExternalBooks(search);
            setExternalBooks(results);
          } catch (e) {
            console.warn(e);
          } finally {
            setSearchingExternal(false);
          }
        } else {
          setExternalBooks([]);
        }
      }, 600); // 600ms debounce
      return () => clearTimeout(delaySearch);
    }
  }, [search, activeTab]);

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
            <View style={styles.countsRow}>
              <Text style={styles.statItem}>👁️ {item.viewCount}</Text>
              <Text style={styles.statItem}>⬇️ {item.downloadCount}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderExternalItem = ({ item }: { item: ExternalBookResult }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => item.readUrl && Linking.openURL(item.readUrl)}
    >
      <View style={styles.cardLeft}>
        {item.coverUrl ? (
          <Image source={{ uri: item.coverUrl }} style={styles.bookCover} />
        ) : (
          <View style={styles.iconBox}>
            <Text style={styles.icon}>📚</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.subject}>{item.author} • {item.source}</Text>
        <Text style={styles.uploaderText}>Subject: {item.subject}</Text>
        
        <View style={styles.actionRow}>
          {item.readUrl && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(item.readUrl!)}>
              <Text style={styles.actionBtnText}>Read Online</Text>
            </TouchableOpacity>
          )}
          {item.downloadUrl && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]} onPress={() => Linking.openURL(item.downloadUrl!)}>
              <Text style={styles.actionBtnOutlineText}>Download EPUB</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (error) {
    return <SafeScreen error={error} onRetry={loadData} onGoBack={() => navigation.goBack()} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>E-Library</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyBookmarkedResources')} style={styles.bookmarkBtn}>
            <Text style={styles.bookmarkIcon}>🔖</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search resources..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'internal' && styles.tabActive]} onPress={() => { setActiveTab('internal'); setSearch(''); }}>
          <Text style={[styles.tabText, activeTab === 'internal' && styles.tabTextActive]}>School Resources</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'external' && styles.tabActive]} onPress={() => { setActiveTab('external'); setSearch(''); }}>
          <Text style={[styles.tabText, activeTab === 'external' && styles.tabTextActive]}>Online Books</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'internal' && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {filters.map(f => (
              <TouchableOpacity 
                key={f}
                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                  {f.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {activeTab === 'internal' ? (
        loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#38bdf8" /></View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={item => item.resourceId}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>No Resources Found</Text>
                <Text style={styles.emptySub}>Try adjusting your search or filters.</Text>
              </View>
            }
          />
        )
      ) : (
        searchingExternal ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#38bdf8" /><Text style={{color:'#64748b', marginTop:10}}>Searching Global Libraries...</Text></View>
        ) : (
          <FlatList
            data={externalBooks}
            keyExtractor={item => item.id}
            renderItem={renderExternalItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🌍</Text>
                <Text style={styles.emptyTitle}>Search Global Books</Text>
                <Text style={styles.emptySub}>Type 3+ characters to search Gutendex & OpenLibrary.</Text>
              </View>
            }
          />
        )
      )}
    </View>
  );
};

export default ELibraryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 22 },
  backIcon: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  bookmarkBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(56,189,248,0.15)', borderRadius: 22 },
  bookmarkIcon: { fontSize: 20 },
  
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, height: 48, color: '#f8fafc', fontSize: 16 },
  
  filtersContainer: { backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  filtersScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  filterChipActive: { backgroundColor: 'rgba(56,189,248,0.15)', borderColor: '#38bdf8' },
  filterChipText: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold' },
  filterChipTextActive: { color: '#38bdf8' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardLeft: { marginRight: 16 },
  iconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(56,189,248,0.15)', justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 28 },
  cardBody: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
  subject: { fontSize: 13, color: '#94a3b8', marginBottom: 12 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  uploaderText: { fontSize: 12, color: '#64748b' },
  countsRow: { flexDirection: 'row', gap: 12 },
  statItem: { fontSize: 12, color: '#94a3b8' },

  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16, opacity: 0.8 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#94a3b8' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 8, gap: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#0f172a' },
  tabText: { color: '#94a3b8', fontWeight: '600' },
  tabTextActive: { color: '#38bdf8', fontWeight: 'bold' },

  bookCover: { width: 56, height: 80, borderRadius: 8, backgroundColor: '#0f172a' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { backgroundColor: '#38bdf8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  actionBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 12 },
  actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#38bdf8' },
  actionBtnOutlineText: { color: '#38bdf8', fontWeight: 'bold', fontSize: 12 },
});
