import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';

interface SafeScreenProps {
  error: Error | null;
  onRetry?: () => void;
  onGoBack?: () => void;
  title?: string;
  message?: string;
}

const SafeScreen: React.FC<SafeScreenProps> = ({ 
  error, 
  onRetry, 
  onGoBack,
  title = 'Something went wrong',
  message = 'We encountered an error loading this screen. Please try again.'
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        {__DEV__ && error && (
          <View style={styles.devErrorBox}>
            <Text style={styles.devErrorText}>{error.message}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {onRetry && (
            <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          )}
          {onGoBack && (
            <TouchableOpacity style={styles.backBtn} onPress={onGoBack}>
              <Text style={styles.backText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SafeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  icon: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 12, textAlign: 'center' },
  message: { fontSize: 16, color: '#4B5563', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  actions: { flexDirection: 'row', gap: 16 },
  retryBtn: { backgroundColor: '#3B82F6', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backBtn: { backgroundColor: '#E5E7EB', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  backText: { color: '#374151', fontWeight: 'bold', fontSize: 16 },
  devErrorBox: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 24, width: '100%' },
  devErrorText: { color: '#DC2626', fontSize: 12, fontFamily: 'monospace' },
});
