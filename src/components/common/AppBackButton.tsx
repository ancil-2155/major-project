import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type AppBackButtonProps = {
  navigation: any;
  fallbackRoute?: keyof RootStackParamList;
  iconColor?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  children?: React.ReactNode;
};

const AppBackButton: React.FC<AppBackButtonProps> = ({
  navigation,
  fallbackRoute,
  iconColor = '#FFFFFF',
  backgroundColor = 'rgba(255,255,255,0.16)',
  style,
  onPress,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    if (fallbackRoute) {
      navigation.navigate(fallbackRoute);
      return;
    }

    navigation.navigate('StudentHome');
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }, style]}
      onPress={handlePress}
      activeOpacity={0.78}
      hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
    >
      <Icon name="chevron-back" size={22} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppBackButton;
