import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { LibraryResource } from '../types/library';
import { 
  incrementResourceView, 
  incrementResourceDownload, 
  bookmarkResource, 
  unbookmarkResource, 
  checkBookmarked 
} from '../services/library/libraryService';
import { safeGetDownloadUrl } from '../services/firebase/storageSafeService';

const LibraryResourceDetailsScreen = ({ route, navigation }: any) => {
  const { resource } = route.params as { resource: LibraryResource };
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    // Increment view on mount
    incrementResourceView(resource.resourceId);

    const checkBookmark = async () => {
      const user = auth().currentUser;
      if (user) {
        const bookmarked = await checkBookmarked(resource.resourceId, user.uid);
        setIsBookmarked(bookmarked);
      }
    };
    checkBookmark();
  }, [resource.resourceId]);

  const toggleBookmark = async () => {
    const user = auth().currentUser;
    if (!user) return;
    setBookmarking(true);
    try {
      if (isBookmarked) {
        await unbookmarkResource(resource.resourceId, user.uid);
        setIsBookmarked(false);
      } else {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const studentName = userDoc.data()?.name || 'Student';
        await bookmarkResource(resource.resourceId, user.uid, studentName);
        setIsBookmarked(true);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setBookmarking(false);
    }
  };

  const handleOpen = async () => {
    setOpening(true);
    try {
      let urlToOpen = resource.externalLink;
      
      if (!urlToOpen && resource.filePath) {
        // Safe fetch from storage
        urlToOpen = await safeGetDownloadUrl(resource.filePath);
      } else if (!urlToOpen && resource.fileUrl) {
        // Fallback to directly stored URL
        urlToOpen = resource.fileUrl;
      }

      if (urlToOpen) {
        await incrementResourceDownload(resource.resourceId);
        await Linking.openURL(urlToOpen);
      } else {
        Alert.alert('File Unavailable', 'This file could not be found or has been removed.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not open resource.');
    } finally {
      setOpening(false);
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

  const dateStr = resource.createdAt && (resource.createdAt as any).toDate 
      ? (resource.createdAt as any).toDate().toLocaleDateString() 
      : '';

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return 'Unknown Size';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>
        
        <View style={styles.iconContainer}>
          <LinearGradient colors={['rgba(56,189,248,0.1)', 'rgba(56,189,248,0.2)']} style={styles.bigIconBox}>
            <Text style={styles.bigIcon}>{getIcon(resource.resourceType)}</Text>
          </LinearGradient>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{resource.title}</Text>
            <TouchableOpacity onPress={toggleBookmark} disabled={bookmarking} style={styles.bookmarkBtn}>
              {bookmarking ? (
                <ActivityIndicator size="small" color="#38bdf8" />
              ) : (
                <Text style={styles.bookmarkIcon}>{isBookmarked ? '🔖' : '🤍'}</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.subjectText}>{resource.subject} • {resource.resourceType.toUpperCase()}</Text>
          
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Uploaded By:</Text>
            <Text style={styles.metaValue}>{resource.uploadedByName} ({resource.uploadedByRole})</Text>
            
            <Text style={styles.metaLabel}>Date:</Text>
            <Text style={styles.metaValue}>{dateStr}</Text>

            {resource.resourceType !== 'link' && (
              <>
                <Text style={styles.metaLabel}>File Size:</Text>
                <Text style={styles.metaValue}>{formatBytes(resource.fileSize)}</Text>
              </>
            )}
          </View>

          {resource.description ? (
            <View style={styles.descBox}>
              <Text style={styles.descLabel}>Description</Text>
              <Text style={styles.descText}>{resource.description}</Text>
            </View>
          ) : null}
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.openBtn} onPress={handleOpen} disabled={opening}>
          {opening ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.openBtnText}>
              {resource.resourceType === 'link' ? 'Open Link' : 'Download / View File'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LibraryResourceDetailsScreen;

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
  
  content: { flex: 1 },
  iconContainer: { alignItems: 'center', marginVertical: 30 },
  bigIconBox: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)' },
  bigIcon: { fontSize: 60 },
  
  infoBox: { backgroundColor: '#1e293b', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, minHeight: 400 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc', flex: 1, marginRight: 16 },
  bookmarkBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  bookmarkIcon: { fontSize: 20 },
  
  subjectText: { fontSize: 16, color: '#38bdf8', fontWeight: '600', marginBottom: 24 },
  
  metaBox: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  metaLabel: { fontSize: 12, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  metaValue: { fontSize: 15, color: '#e2e8f0', fontWeight: '500', marginBottom: 12 },
  
  descBox: { marginBottom: 24 },
  descLabel: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
  descText: { fontSize: 15, color: '#94a3b8', lineHeight: 24 },
  
  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  openBtn: { backgroundColor: '#0ea5e9', paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  openBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
