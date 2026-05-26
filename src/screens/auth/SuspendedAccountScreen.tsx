import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import { CommonActions } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const SuspendedAccountScreen = ({ navigation }: any) => {
  const handleLogout = async () => {
    await auth().signOut();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#9CA3AF', '#4B5563']} style={styles.iconContainer}>
        <Text style={styles.icon}>🔒</Text>
      </LinearGradient>
      <Text style={styles.title}>Account Suspended</Text>
      <Text style={styles.subtitle}>
        Your account has been temporarily suspended by an administrator. Please contact the school administration for more information.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SuspendedAccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#4B5563', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  button: {
    backgroundColor: '#374151',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
