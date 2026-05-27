import React, { useMemo, useState } from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../theme/appTheme';

type ProfileAvatarButtonProps = {
  photoUrl?: string | null;
  localProfilePhotoUri?: string | null;
  name?: string;
  size?: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

const getInitials = (name?: string) => {
  if (!name) {
    return 'U';
  }
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
};

const ProfileAvatarButton: React.FC<ProfileAvatarButtonProps> = ({
  photoUrl,
  localProfilePhotoUri,
  name,
  size = 44,
  onPress,
  style,
}) => {
  const { colors } = useAppTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const imageSource = !imageFailed
    ? photoUrl || localProfilePhotoUri
      ? { uri: (photoUrl || localProfilePhotoUri) as string }
      : null
    : null;

  const initials = useMemo(() => getInitials(name), [name]);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: 'rgba(255,255,255,0.28)',
          backgroundColor: 'rgba(255,255,255,0.16)',
        },
        style,
      ]}
      activeOpacity={0.78}
      onPress={onPress}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.primarySoft,
            },
          ]}
        >
          <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 14,
    fontWeight: '800',
  },
});

export default ProfileAvatarButton;
