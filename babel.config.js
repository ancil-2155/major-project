module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // ... other plugins you may have
    'react-native-reanimated/plugin',  // ✅ Must be last
  ],
};