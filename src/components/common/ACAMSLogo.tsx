import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const ACAMS_LOGO = require('../../assets/images/acams_icon.jpg');

type ACAMSLogoProps = {
  size?: number;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

const ACAMSLogo: React.FC<ACAMSLogoProps> = ({
  size = 64,
  containerStyle,
  imageStyle,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
        },
        containerStyle,
      ]}
    >
      <Image
        source={ACAMS_LOGO}
        style={[styles.image, imageStyle]}
        resizeMode="cover"
      />
    </View>
  );
};

export default ACAMSLogo;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
