import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen = ({ route }: any) => {
  const role = route?.params?.role || 'User';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{role} Dashboard</Text>
      <Text style={styles.subtitle}>Navigation works 🎉</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
});

export default HomeScreen;
