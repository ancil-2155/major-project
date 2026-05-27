import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type SettingsButtonProps = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  size?: number;
};

const SettingsButton: React.FC<SettingsButtonProps> = ({
  onPress,
  style,
  size = 44,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      activeOpacity={0.78}
      onPress={onPress}
    >
      <Icon name="settings-outline" size={22} color="#FFFFFF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SettingsButton;
