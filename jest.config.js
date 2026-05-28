module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/__mocks__/asyncStorageMock.js',
    '\\.(png|jpg|jpeg|gif|webp)$': '<rootDir>/__mocks__/assetMock.js',
  },
};
