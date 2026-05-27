import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/appTheme';

type DateSeparatorProps = {
  label: string;
};

const DateSeparator: React.FC<DateSeparatorProps> = ({ label }) => {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default DateSeparator;

