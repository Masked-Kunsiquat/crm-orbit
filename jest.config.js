/**
 * Jest configuration for Expo React Native app (crm-orbit).
 * Uses jest-expo preset and a setup file to mock Expo/Router/SQLite.
 */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '<rootDir>/**/__tests__/**/*.(test|spec).ts',
    '<rootDir>/**/__tests__/**/*.(test|spec).tsx',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo(nent)?|expo-.*|@expo|@expo/vector-icons|react-clone-referenced-element|@react-native-community|@react-native/assets|@react-native/polyfills)/)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  clearMocks: true,
};

