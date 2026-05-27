import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/appTheme';

type AttachmentPreviewProps = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uri?: string;
  kind: 'image' | 'video' | 'document';
  onRemove?: () => void;
};

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  fileName,
  mimeType,
  sizeBytes,
  uri,
  kind,
  onRemove,
}) => {
  const { colors } = useAppTheme();
  const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(2);
  const showImage = kind === 'image' && uri;
  const iconName =
    kind === 'image' ? 'image-outline' : kind === 'video' ? 'videocam-outline' : 'document-text-outline';

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {showImage ? (
        <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
          <Icon name={iconName} size={20} color={colors.primary} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {fileName}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {mimeType} • {sizeMb} MB
        </Text>
      </View>
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn} activeOpacity={0.8}>
          <Icon name="close-circle" size={22} color={colors.danger} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  removeBtn: {
    padding: 2,
  },
});

export default AttachmentPreview;

