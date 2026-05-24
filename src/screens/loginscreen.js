import React from 'react';  
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ACAMS</Text>

      <TextInput
        placeholder="Email"
        style={styles.input1}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input2}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  input1: {
    borderWidth: 1,
    marginTop: 20,
    padding: 10,
  },
  input2: {
    borderWidth: 1,
    marginTop: 10,
    padding: 10,
  },
  button: {
    marginTop: 20,
    backgroundColor: 'black',
    padding: 15,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
});