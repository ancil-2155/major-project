import React, { useMemo, useState } from 'react';
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
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { uploadMediaToCloudinary } from '../../services/cloudinary/cloudinaryUploadService';
import { createGalleryPost } from '../../services/gallery/galleryService';
import { useAppTheme } from '../../theme/appTheme';
import { GalleryCategory } from '../../types/gallery';

const MAX_VIDEO_DURATION = 60;
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_VIDEO_SIZE = 150 * 1024 * 1024;
const SUPPORTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const SUPPORTED_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime'];
const CATEGORY_OPTIONS: { id: GalleryCategory; label: string }[] = [
  { id: 'campus', label: 'Campus' },
  { id: 'events', label: 'Events' },
  { id: 'classes', label: 'Classes' },
  { id: 'sports', label: 'Sports' },
  { id: 'arts', label: 'Arts' },
];

const getAssetExtension = (fileName?: string) =>
  fileName?.split('.').pop()?.toLowerCase() || '';

const isSupportedAsset = (asset: any) => {
  const mimeType = String(asset.type || '').toLowerCase();
  const extension = getAssetExtension(asset.fileName);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const videoExtensions = ['mp4', 'mov'];

  if (SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType) || imageExtensions.includes(extension)) {
    return { supported: true, mediaType: 'image' as const };
  }

  if (SUPPORTED_VIDEO_MIME_TYPES.includes(mimeType) || videoExtensions.includes(extension)) {
    return { supported: true, mediaType: 'video' as const };
  }

  return { supported: false, mediaType: null };
};

const CreateGalleryPostScreen = ({ navigation }: any) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [media, setMedia] = useState<any>(null);
  const [heading, setHeading] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<GalleryCategory>('campus');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectMedia = () => {
    launchImageLibrary(
      {
        mediaType: 'mixed',
        videoQuality: 'high',
        quality: 0.8,
      },
      response => {
        if (response.didCancel) {
          return;
        }
        if (response.errorMessage) {
          Alert.alert('Error', response.errorMessage);
          return;
        }

        const asset = response.assets?.[0];
        if (!asset) {
          return;
        }

        const support = isSupportedAsset(asset);
        if (!support.supported) {
          Alert.alert(
            'Unsupported File',
            'Please select JPG, JPEG, PNG, WEBP, GIF, MP4, or MOV media.',
          );
          return;
        }

        if (support.mediaType === 'video') {
          if (asset.duration && asset.duration > MAX_VIDEO_DURATION) {
            Alert.alert('Error', 'Video must be 60 seconds or less.');
            return;
          }
          if (asset.fileSize && asset.fileSize > MAX_VIDEO_SIZE) {
            Alert.alert('Error', 'Video must be less than 150MB.');
            return;
          }
        } else if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
          Alert.alert('Error', 'Image must be less than 15MB.');
          return;
        }

        setMedia(asset);
      },
    );
  };

  const handleUpload = async () => {
    if (!media || !heading.trim()) {
      Alert.alert('Error', 'Please add a heading and select a media file.');
      return;
    }

    setLoading(true);
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      const role = userData?.role || 'student';
      const support = isSupportedAsset(media);
      if (!support.supported || !support.mediaType) {
        throw new Error('Unsupported media type.');
      }
      const mediaType = support.mediaType;

      const response = await uploadMediaToCloudinary(
        media.uri,
        mediaType,
        setProgress,
        media.fileName,
        media.type,
        media.fileSize,
      );

      const cloudinaryResourceType =
        response.resource_type === 'video' || response.resource_type === 'image'
          ? response.resource_type
          : mediaType;

      const cloudinaryData = {
        secureUrl: response.secure_url || (response as any).url || null,
        publicId: response.public_id || null,
        resourceType: cloudinaryResourceType,
        format: response.format || null,
        width: response.width ?? null,
        height: response.height ?? null,
        duration: response.duration ?? null,
        bytes: response.bytes ?? null,
      };

      if (!cloudinaryData.secureUrl || !cloudinaryData.publicId) {
        throw new Error('Cloudinary upload completed but media data is missing.');
      }

      await createGalleryPost({
        userId: user.uid,
        userName: userData?.name || 'Unknown',
        role,
        uploaderId: user.uid,
        uploaderName: userData?.name || 'Unknown',
        uploaderRole: role,
        uploaderPhotoUrl: userData?.profilePhoto || null,
        category,
        heading: heading.trim(),
        caption: caption.trim(),
        mediaType,
        mediaUrl: cloudinaryData.secureUrl,
        thumbnailUrl: cloudinaryData.secureUrl,
        cloudinaryPublicId: cloudinaryData.publicId,
        cloudinaryResourceType: cloudinaryData.resourceType,
        format: cloudinaryData.format,
        width: cloudinaryData.width,
        height: cloudinaryData.height,
        duration:
          mediaType === 'video'
            ? cloudinaryData.duration ?? media.duration ?? null
            : null,
        bytes: cloudinaryData.bytes,
        status: 'approved',
        visibility: 'school',
        department: userData?.department || null,
        year: userData?.year || null,
        semester: userData?.semester || null,
        classLevel: userData?.classLevel || null,
        section: userData?.section || null,
      });

      Alert.alert('Post Uploaded', 'Your post is now live in the gallery.');
      navigation.goBack();
    } catch (error: any) {
      console.error('[Gallery Error]', error);
      Alert.alert('Upload Failed', 'Could not create gallery post. Please try again.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const isVideo = media ? isSupportedAsset(media).mediaType === 'video' : false;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Create Post</Text>
          <Text style={styles.headerSubtitle}>Share a campus moment</Text>
        </View>
        <TouchableOpacity
          style={[styles.postButton, loading && styles.disabledButton]}
          onPress={handleUpload}
          disabled={loading}
          activeOpacity={0.72}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={styles.mediaPicker}
          onPress={selectMedia}
          activeOpacity={0.82}>
          {media ? (
            isVideo ? (
              <View style={styles.previewWrap}>
                <Video
                  source={{ uri: media.uri }}
                  style={styles.preview}
                  resizeMode="cover"
                  muted
                  paused
                />
                <View style={styles.previewBadge}>
                  <Icon name="play" size={14} color="#FFFFFF" />
                  <Text style={styles.previewBadgeText}>Video</Text>
                </View>
              </View>
            ) : (
              <Image source={{ uri: media.uri }} style={styles.preview} />
            )
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.placeholderIcon}>
                <Icon name="images-outline" size={34} color={colors.primary} />
              </View>
              <Text style={styles.placeholderText}>Select image or video</Text>
              <Text style={styles.hintText}>60s video max, 15MB image max</Text>
            </View>
          )}
        </TouchableOpacity>

        {loading ? (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>Uploading {progress}%</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Heading</Text>
          <TextInput
            style={styles.input}
            placeholder="Annual Sports Day"
            placeholderTextColor={colors.muted}
            value={heading}
            onChangeText={setHeading}
            maxLength={60}
          />

          <Text style={styles.inputLabel}>Caption</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write a short caption..."
            placeholderTextColor={colors.muted}
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          <Text style={styles.inputLabel}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORY_OPTIONS.map(item => {
              const active = category === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.categoryPill, active && styles.categoryPillActive]}
                  onPress={() => setCategory(item.id)}
                  activeOpacity={0.72}>
                  <Text
                    style={[
                      styles.categoryPillText,
                      active && styles.categoryPillTextActive,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateGalleryPostScreen;

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
    headerCenter: {
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
    postButton: {
      minWidth: 58,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 14,
    },
    disabledButton: {
      opacity: 0.72,
    },
    postButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '900',
    },
    content: {
      padding: 14,
      paddingBottom: 36,
    },
    mediaPicker: {
      height: 330,
      borderRadius: 22,
      overflow: 'hidden',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0.22 : 0.08,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 22,
      elevation: 2,
    },
    previewWrap: {
      flex: 1,
    },
    preview: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    previewBadge: {
      position: 'absolute',
      left: 14,
      bottom: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: 'rgba(0,0,0,0.58)',
    },
    previewBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
    },
    placeholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    placeholderIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
    },
    placeholderText: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '900',
    },
    hintText: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 6,
      fontWeight: '600',
    },
    progressWrap: {
      marginBottom: 16,
    },
    progressTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.chip,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    progressText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 6,
      textAlign: 'right',
    },
    formCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    inputLabel: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '900',
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.input,
      borderRadius: 15,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      color: colors.text,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    textArea: {
      minHeight: 116,
      textAlignVertical: 'top',
    },
    categoryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryPill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.chip,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryPillText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
    },
    categoryPillTextActive: {
      color: '#FFFFFF',
    },
  });
