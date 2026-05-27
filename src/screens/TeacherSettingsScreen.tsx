import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import { ThemePreference, useAppTheme } from '../theme/appTheme';
import { useTranslation } from '../hooks/useTranslation';
import AppBackButton from '../components/common/AppBackButton';

const THEME_OPTIONS: ThemePreference[] = ['System Default', 'Light', 'Dark'];
const LANGUAGE_OPTIONS = ['English', 'Malayalam', 'Hindi'];

const TeacherSettingsScreen = ({ navigation }: any) => {
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

  const handleNotifications = () => {
    Alert.alert(
      'Notifications',
      'Push notification permissions are managed by your device settings.\n\nAndroid: Settings > Apps > ACAMS > Notifications',
      [{ text: 'OK' }],
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

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderSettingItem = (
    title: string,
    iconName: string,
    onPress: () => void,
    options?: { subtitle?: string; isDestructive?: boolean },
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      activeOpacity={0.72}
      onPress={onPress}>
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
      <Icon name="chevron-forward" size={20} color={colors.muted} />
    </TouchableOpacity>
  );

  const renderThemeModal = () => (
    <Modal
      visible={themeModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setThemeModalVisible(false)}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setThemeModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Theme</Text>
          {THEME_OPTIONS.map(option => (
            <TouchableOpacity
              key={option}
              style={styles.modalOption}
              onPress={() => handleThemeSelect(option)}>
              <Text
                style={[
                  styles.modalOptionText,
                  themePreference === option && styles.modalOptionSelected,
                ]}>
                {option}
              </Text>
              {themePreference === option ? (
                <Icon name="checkmark-circle" size={21} color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCancelBtn}
            onPress={() => setThemeModalVisible(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderLanguageModal = () => (
    <Modal
      visible={languageModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setLanguageModalVisible(false)}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setLanguageModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Language</Text>
          {LANGUAGE_OPTIONS.map(option => (
            <TouchableOpacity
              key={option}
              style={styles.modalOption}
              onPress={() => handleLanguageSelect(option)}>
              <Text
                style={[
                  styles.modalOptionText,
                  (language === 'ml' ? 'Malayalam' : language === 'hi' ? 'Hindi' : 'English') === option && styles.modalOptionSelected,
                ]}>
                {option}
              </Text>
              {(language === 'ml' ? 'Malayalam' : language === 'hi' ? 'Hindi' : 'English') === option ? (
                <Icon name="checkmark-circle" size={21} color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.modalCancelBtn}
            onPress={() => setLanguageModalVisible(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

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
          <AppBackButton navigation={navigation} fallbackRoute="TeacherHome" />
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Teacher Settings</Text>
            <Text style={styles.headerSubtitle}>
              Teaching tools, privacy, and preferences
            </Text>
          </View>
          <View style={styles.headerButtonGhost} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {renderSectionHeader('Teacher Tools')}
        <View style={styles.card}>
          {renderSettingItem('My Signature', 'create-outline', () =>
            navigation.navigate('TeacherSignature'),
          )}
          <View style={styles.divider} />
          {renderSettingItem('Assignments', 'document-text-outline', () =>
            navigation.navigate('TeacherAssignments'),
          )}
          <View style={styles.divider} />
          {renderSettingItem('Resources / E-Library', 'library-outline', () =>
            navigation.navigate('TeacherELibrary'),
          )}
        </View>

        {renderSectionHeader('Account')}
        <View style={styles.card}>
          {renderSettingItem(
            'Change Password',
            'key-outline',
            handleChangePassword,
          )}
          <View style={styles.divider} />
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
      </ScrollView>

      {renderThemeModal()}
      {renderLanguageModal()}
    </View>
  );
};

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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

export default TeacherSettingsScreen;
