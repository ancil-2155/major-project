import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import { CommonActions } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const RejectedTeacherScreen = ({ route, navigation }: any) => {
  const reason = route?.params?.reason || 'No specific reason provided by the administrator.';

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
      <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.iconContainer}>
        <Text style={styles.icon}>❌</Text>
      </LinearGradient>
      <Text style={styles.title}>Application Rejected</Text>
      <Text style={styles.subtitle}>
        Your registration to join as a teacher has been rejected by an administrator.
      </Text>
      <View style={styles.reasonBox}>
        <Text style={styles.reasonLabel}>Reason:</Text>
        <Text style={styles.reasonText}>{reason}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RejectedTeacherScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEE2E2',
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#991B1B', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#7F1D1D', textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  reasonBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 32,
  },
  reasonLabel: { fontSize: 12, color: '#DC2626', fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  reasonText: { fontSize: 14, color: '#374151' },
  button: {
    backgroundColor: '#991B1B',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
