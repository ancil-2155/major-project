import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { LanguageCode } from '../../i18n';
import Icon from 'react-native-vector-icons/Ionicons';

export const LanguageSelector = () => {
  const { language, setLanguage, t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const languages: { code: LanguageCode; label: string }[] = [
    { code: 'en', label: t('settings.english') || 'English' },
    { code: 'ml', label: t('settings.malayalam') || 'Malayalam' },
    { code: 'hi', label: t('settings.hindi') || 'Hindi' },
  ];

  const currentLabel = languages.find(l => l.code === language)?.label || 'English';

  return (
    <View>
      <TouchableOpacity 
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.leftContent}>
          <Icon name="language-outline" size={24} color="#f8fafc" />
          <Text style={styles.selectorText}>{t('settings.language')}</Text>
        </View>
        <View style={styles.rightContent}>
          <Text style={styles.currentLanguageText}>{currentLabel}</Text>
          <Icon name="chevron-forward-outline" size={20} color="#94a3b8" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
            
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.optionButton,
                  language === lang.code && styles.optionButtonActive
                ]}
                onPress={() => {
                  setLanguage(lang.code);
                  setModalVisible(false);
                }}
              >
                <Text style={[
                  styles.optionText,
                  language === lang.code && styles.optionTextActive
                ]}>
                  {lang.label}
                </Text>
                {language === lang.code && (
                  <Icon name="checkmark-circle" size={24} color="#38bdf8" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  currentLanguageText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#0f172a',
  },
  optionButtonActive: {
    backgroundColor: '#0c4a6e',
    borderColor: '#0ea5e9',
    borderWidth: 1,
  },
  optionText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
});
