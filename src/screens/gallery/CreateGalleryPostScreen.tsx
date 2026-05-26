import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import { uploadMediaToCloudinary } from '../../services/cloudinary/cloudinaryUploadService';
import { createGalleryPost } from '../../services/gallery/galleryService';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const MAX_VIDEO_DURATION = 60; // seconds
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_VIDEO_SIZE = 150 * 1024 * 1024; // 150MB

const CreateGalleryPostScreen = ({ navigation }: any) => {
  const [media, setMedia] = useState<any>(null);
  const [heading, setHeading] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectMedia = () => {
    launchImageLibrary(
      {
        mediaType: 'mixed',
        videoQuality: 'high',
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorMessage) {
          Alert.alert('Error', response.errorMessage);
          return;
        }

        const asset = response.assets?.[0];
        if (!asset) return;

        // Validation
        if (asset.type?.includes('video')) {
          if (asset.duration && asset.duration > MAX_VIDEO_DURATION) {
            Alert.alert('Error', 'Video must be 60 seconds or less.');
            return;
          }
          if (asset.fileSize && asset.fileSize > MAX_VIDEO_SIZE) {
            Alert.alert('Error', 'Video must be less than 150MB.');
            return;
          }
        } else {
          if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
            Alert.alert('Error', 'Image must be less than 15MB.');
            return;
          }
        }

        setMedia(asset);
      }
    );
  };

  const handleUpload = async () => {
    if (!media || !heading.trim()) {
      Alert.alert('Error', 'Please add a heading and select a valid media file.');
      return;
    }

    setLoading(true);
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('User not authenticated');

      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      const role = userData?.role || 'student';
      const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

      const mediaType = media.type?.includes('video') ? 'video' : 'image';
      
      const response = await uploadMediaToCloudinary(
        media.uri,
        mediaType,
        setProgress
      );

      const cloudinaryData = {
        secureUrl: response.secure_url || (response as any).url || null,
        publicId: response.public_id || null,
        resourceType: response.resource_type || mediaType,
        format: response.format || null,
        width: response.width ?? null,
        height: response.height ?? null,
        duration: response.duration ?? null,
        bytes: response.bytes ?? null,
      };

      if (!cloudinaryData.secureUrl || !cloudinaryData.publicId) {
        throw new Error('Cloudinary upload completed but required media data is missing.');
      }

      await createGalleryPost({
        uploaderId: user.uid,
        uploaderName: userData?.name || 'Unknown',
        uploaderRole: role,
        uploaderPhotoUrl: userData?.profilePhoto || null,
        heading: heading.trim() || 'Untitled Event',
        caption: caption.trim() || '',
        mediaType,
        mediaUrl: cloudinaryData.secureUrl,
        thumbnailUrl: cloudinaryData.secureUrl,
        cloudinaryPublicId: cloudinaryData.publicId,
        cloudinaryResourceType: cloudinaryData.resourceType,
        format: cloudinaryData.format,
        width: cloudinaryData.width,
        height: cloudinaryData.height,
        duration: mediaType === 'video' ? cloudinaryData.duration ?? (media.duration ?? null) : null,
        bytes: cloudinaryData.bytes,
        status: isTeacherOrAdmin ? 'approved' : 'pending',
        visibility: 'school',
        department: userData?.department || null,
        year: userData?.year || null,
        semester: userData?.semester || null,
        classLevel: userData?.classLevel || null,
        section: userData?.section || null,
      });

      Alert.alert('Success', 'Post uploaded successfully!' + (!isTeacherOrAdmin ? ' It is pending approval.' : ''));
      navigation.goBack();
    } catch (error: any) {
      console.error('[Gallery Error]', error);
      Alert.alert('Upload Failed', 'Could not create gallery post. Please try again.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.mediaPicker} onPress={selectMedia}>
          {media ? (
            <Image source={{ uri: media.uri }} style={styles.preview} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📸</Text>
              <Text style={styles.placeholderText}>Tap to select Image / Video</Text>
              <Text style={styles.hintText}>(Max: 60s video, 15MB image)</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Heading (e.g. Annual Sports Day)"
          placeholderTextColor="#9CA3AF"
          value={heading}
          onChangeText={setHeading}
          maxLength={60}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write a caption..."
          placeholderTextColor="#9CA3AF"
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.disabledBtn]} 
          onPress={handleUpload}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.submitText}>Uploading... {progress}%</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>Share Post</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateGalleryPostScreen;

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
  content: { padding: 20 },
  mediaPicker: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    height: 250,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { alignItems: 'center' },
  placeholderIcon: { fontSize: 40, marginBottom: 10 },
  placeholderText: { color: '#4B5563', fontWeight: '600' },
  hintText: { color: '#9CA3AF', fontSize: 12, marginTop: 5 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: '#4F46E5',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledBtn: { backgroundColor: '#818CF8' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
});
