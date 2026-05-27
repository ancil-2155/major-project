import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ACAMSLogo from '../common/ACAMSLogo';
import ProfileAvatarButton from './ProfileAvatarButton';
import SettingsButton from './SettingsButton';
import { useAppTheme } from '../../theme/appTheme';

type DashboardHeaderProps = {
  role: 'student' | 'teacher';
  userName: string;
  subtitle?: string;
  profilePhotoUrl?: string | null;
  localProfilePhotoUri?: string | null;
  onProfilePress: () => void;
  onSettingsPress: () => void;
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  role,
  userName,
  subtitle,
  profilePhotoUrl,
  localProfilePhotoUri,
  onProfilePress,
  onSettingsPress,
}) => {
  const { colors } = useAppTheme();

  return (
    <LinearGradient
      colors={[colors.headerStart, colors.headerEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.row}>
        <View style={styles.identityWrap}>
          <ACAMSLogo size={54} />
          <View style={styles.nameWrap}>
            <Text style={styles.subtitle}>{subtitle || 'Welcome back'}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {userName}
            </Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>
                {role === 'student' ? 'Student' : 'Teacher'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <ProfileAvatarButton
            photoUrl={profilePhotoUrl}
            localProfilePhotoUri={localProfilePhotoUri}
            name={userName}
            onPress={onProfilePress}
          />
          <SettingsButton onPress={onSettingsPress} />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  identityWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nameWrap: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
  },
  name: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rolePill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default DashboardHeader;
