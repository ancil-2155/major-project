import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface Props {
  children: ReactNode;
  navigation?: any;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorStack: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      errorStack: '',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected error occurred.',
      errorStack: error?.stack || '',
    };
  }

  componentDidCatch(error: Error, info: any) {
    if (__DEV__) {
      console.error('[ErrorBoundary] Caught render error:', error);
      console.error('[ErrorBoundary] Component stack:', info?.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '', errorStack: '' });
  };

  handleGoBack = () => {
    if (this.props.navigation) {
      this.props.navigation.goBack();
    }
    this.setState({ hasError: false, errorMessage: '', errorStack: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            Something went wrong while opening this admin feature. Please go back and try again.
          </Text>

          {__DEV__ && this.state.errorMessage ? (
            <ScrollView style={styles.errorBox}>
              <Text style={styles.errorText}>{this.state.errorMessage}</Text>
            </ScrollView>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.retryBtn} onPress={this.handleRetry}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtn} onPress={this.handleGoBack}>
              <Text style={styles.backText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: { fontSize: 60, marginBottom: 20 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    maxHeight: 120,
    width: '100%',
    marginBottom: 24,
  },
  errorText: { fontSize: 12, color: '#DC2626', fontFamily: 'monospace' },
  actions: { flexDirection: 'row', gap: 12 },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  backBtn: {
    backgroundColor: '#6B7280',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
