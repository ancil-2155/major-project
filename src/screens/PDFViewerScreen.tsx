import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PDFViewer'>;

const PDFViewerScreen = ({ route }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const fileUrl = route?.params?.fileUrl;

  if (!fileUrl) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Invalid PDF URL</Text>
      </View>
    );
  }

  // Google PDF Viewer (works for Cloudinary, Firebase URLs)
  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: viewerUrl }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading PDF...</Text>
          </View>
        )}
        onError={() => setError('Failed to load PDF')}
      />

      {error && (
        <View style={styles.centerOverlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

export default PDFViewerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#374151',
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  webview: {
    flex: 1,
  },
});