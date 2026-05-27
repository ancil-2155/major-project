import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemePreference, useAppTheme } from '../theme/appTheme';
import { useTranslation } from '../hooks/useTranslation';
import AppBackButton from '../components/common/AppBackButton';

const THEME_OPTIONS: ThemePreference[] = ['System Default', 'Light', 'Dark'];
const LANGUAGE_OPTIONS = ['English', 'Malayalam', 'Hindi'];

const StudentSettingsScreen = ({ navigation }: any) => {
  const {
    colors,
    isDark,
    themePreference,
    setThemePreference,
  } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const { language, setLanguage, t } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(false);
  };

  const handleThemeSelect = async (theme: ThemePreference) => {
    try {
      await setThemePreference(theme);
      setThemeModalVisible(false);
      Alert.alert('Theme Updated', `Theme changed to "${theme}".`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save theme preference.');
    }
  };

  const handleLanguageSelect = async (langLabel: string) => {
    try {
      const code = langLabel === 'Malayalam' ? 'ml' : langLabel === 'Hindi' ? 'hi' : 'en';
      await setLanguage(code);
      setLanguageModalVisible(false);
      Alert.alert('Language Updated', `Language set to "${langLabel}".`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save language preference.');
    }
  };

  const handleChangePassword = () => {
    const user = auth().currentUser;
    if (!user || !user.email) {
      Alert.alert('Error', 'No user email found. Please log in again.');
      return;
    }
    Alert.alert(
      'Change Password',
      `A password reset email will be sent to:\n\n${user.email}\n\nDo you want to proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Email',
          onPress: async () => {
            try {
              await auth().sendPasswordResetEmail(user.email!);
              Alert.alert(
                'Email Sent',
                'A password reset link has been sent to your email.',
              );
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to send password reset email.',
              );
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await auth().signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (error) {
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  const handleNotifications = () => {
    Alert.alert(
      'Notifications',
      'Push notification permissions are managed by your device settings.\n\nAndroid: Settings > Apps > ACAMS > Notifications',
      [{ text: 'OK' }],
    );
  };

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderSettingItem = (
    title: string,
    iconName: string,
    onPress: () => void,
    options?: {
      subtitle?: string;
      isDestructive?: boolean;
      hideChevron?: boolean;
    },
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.iconContainer,
            options?.isDestructive && styles.dangerIconContainer,
          ]}>
          <Icon
            name={iconName}
            size={19}
            color={options?.isDestructive ? colors.danger : colors.primary}
          />
        </View>
        <View style={styles.settingTextWrap}>
          <Text
            style={[
              styles.settingTitle,
              options?.isDestructive && styles.destructiveText,
            ]}>
            {title}
          </Text>
          {options?.subtitle ? (
            <Text style={styles.settingSubtitle}>{options.subtitle}</Text>
          ) : null}
        </View>
      </View>
      {!options?.hideChevron && (
        <Icon name="chevron-forward" size={20} color={colors.muted} />
      )}
    </TouchableOpacity>
  );

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: string[],
    selected: string,
    onSelect: (value: any) => void,
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map(option => (
            <TouchableOpacity
              key={option}
              style={styles.modalOption}
              onPress={() => onSelect(option)}>
              <Text
                style={[
                  styles.modalOptionText,
                  selected === option && styles.modalOptionSelected,
                ]}>
                {option}
              </Text>
              {selected === option ? (
                <Icon name="checkmark-circle" size={21} color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.headerStart}
      />

      <LinearGradient
        colors={[colors.headerStart, colors.headerEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <View style={styles.headerRow}>
          <AppBackButton navigation={navigation} fallbackRoute="StudentHome" />
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>
              Manage your account and app experience
            </Text>
          </View>
          <View style={styles.headerButtonGhost} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {renderSectionHeader('Account')}
        <View style={styles.card}>
          {renderSettingItem('View Profile', 'person-outline', () =>
            navigation.navigate('StudentProfile'),
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            'Change Password',
            'key-outline',
            handleChangePassword,
          )}
        </View>

        {renderSectionHeader('App Preferences')}
        <View style={styles.card}>
          {renderSettingItem(
            'Notifications',
            'notifications-outline',
            handleNotifications,
            { subtitle: 'Managed by device settings' },
          )}
          <View style={styles.divider} />
          {renderSettingItem('Theme', 'contrast-outline', () =>
            setThemeModalVisible(true),
          {
            subtitle: themePreference,
          })}
          <View style={styles.divider} />
          {renderSettingItem('Language', 'language-outline', () =>
            setLanguageModalVisible(true),
          {
            subtitle: language === 'ml' ? 'Malayalam' : language === 'hi' ? 'Hindi' : 'English',
          })}
        </View>

        {renderSectionHeader('Privacy and Support')}
        <View style={styles.card}>
          {renderSettingItem('Privacy & Security', 'shield-checkmark-outline', () =>
            navigation.navigate('PrivacySecurity'),
          )}
          <View style={styles.divider} />
          {renderSettingItem('About ACAMS', 'information-circle-outline', () =>
            navigation.navigate('AboutACAMS'),
          )}
          <View style={styles.divider} />
          {renderSettingItem('FAQ', 'help-circle-outline', () =>
            navigation.navigate('FAQ'),
          )}
        </View>

        {renderSectionHeader('Session')}
        <View style={styles.card}>
          {renderSettingItem('Logout', 'log-out-outline', handleLogout, {
            isDestructive: true,
          })}
        </View>

        <Text style={styles.footerText}>ACAMS v1.0.0</Text>
      </ScrollView>

      {renderPickerModal(
        themeModalVisible,
        () => setThemeModalVisible(false),
        'Select Theme',
        THEME_OPTIONS,
        themePreference,
        handleThemeSelect,
      )}

      {renderPickerModal(
        languageModalVisible,
        () => setLanguageModalVisible(false),
        'Select Language',
        LANGUAGE_OPTIONS,
        language === 'ml' ? 'Malayalam' : language === 'hi' ? 'Hindi' : 'English',
        handleLanguageSelect,
      )}
    </View>
  );
};

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      paddingHorizontal: 18,
      paddingTop: Platform.OS === 'ios' ? 56 : 28,
      paddingBottom: 24,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(255,255,255,0.16)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerButtonGhost: {
      width: 42,
      height: 42,
    },
    headerTitleWrap: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 21,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    headerSubtitle: {
      marginTop: 4,
      fontSize: 12,
      color: 'rgba(255,255,255,0.76)',
      textAlign: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 44,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 10,
      marginTop: 12,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 18,
      shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0.26 : 0.08,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 18,
      elevation: 2,
    },
    settingItem: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    settingLeft: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconContainer: {
      width: 39,
      height: 39,
      borderRadius: 13,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dangerIconContainer: {
      backgroundColor: isDark ? '#3B1115' : '#FEF2F2',
    },
    settingTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    settingTitle: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '700',
    },
    settingSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 3,
    },
    destructiveText: {
      color: colors.danger,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 65,
    },
    footerText: {
      textAlign: 'center',
      color: colors.muted,
      fontSize: 12,
      marginTop: 4,
      marginBottom: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      backgroundColor: colors.elevated,
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    modalOption: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 14,
      paddingHorizontal: 12,
      marginBottom: 6,
      backgroundColor: colors.cardAlt,
    },
    modalOptionText: {
      fontSize: 15,
      color: colors.textSecondary,
      fontWeight: '700',
    },
    modalOptionSelected: {
      color: colors.primary,
    },
    modalCancelBtn: {
      marginTop: 8,
      backgroundColor: colors.chip,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: 'center',
    },
    modalCancelText: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '800',
    },
  });

export default StudentSettingsScreen;
