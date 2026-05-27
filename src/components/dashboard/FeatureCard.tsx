import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/appTheme';
import { dashboardTheme } from '../../theme/dashboardTheme';

type FeatureCardProps = {
  title: string;
  subtitle: string;
  iconName: string;
  color?: string;
  badgeCount?: number;
  width: number;
  onPress: () => void;
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  iconName,
  color,
  badgeCount,
  width,
  onPress,
}) => {
  const { colors, isDark } = useAppTheme();
  const iconColor = color || colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width,
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOpacity: isDark ? 0.24 : 0.08,
        },
      ]}
      activeOpacity={0.82}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}22` }]}>
        <Icon name={iconName} size={dashboardTheme.sizes.iconSize} color={iconColor} />
      </View>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {title}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
        {subtitle}
      </Text>

      {typeof badgeCount === 'number' && badgeCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: dashboardTheme.sizes.minCardHeight,
    borderRadius: dashboardTheme.spacing.cardRadius,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: dashboardTheme.typography.featureTitle,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 5,
    fontSize: dashboardTheme.typography.subtitle,
    lineHeight: 18,
    fontWeight: '500',
  },
  badge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: dashboardTheme.typography.badge,
    fontWeight: '700',
  },
});

export default FeatureCard;
