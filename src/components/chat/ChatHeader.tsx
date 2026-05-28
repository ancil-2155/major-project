import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/appTheme';

type ChatHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  onGroupInfo?: () => void;
};

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, subtitle, onBack, onGroupInfo }) => {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        onPress={onBack}
        style={[styles.backButton, { backgroundColor: isDark ? '#1F2937' : '#EEF2FF' }]}
        activeOpacity={0.78}
      >
        <Icon name="chevron-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onGroupInfo && (
        <TouchableOpacity
          onPress={onGroupInfo}
          style={[styles.infoButton, { backgroundColor: isDark ? '#1F2937' : '#EEF2FF' }]}
          activeOpacity={0.78}
        >
          <Icon name="information-circle" size={22} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    marginLeft: 10,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  infoButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});

export default ChatHeader;

