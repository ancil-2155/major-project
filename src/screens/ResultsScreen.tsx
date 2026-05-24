import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const results = [
  { id: '1', subject: 'Maths', marks: '85' },
  { id: '2', subject: 'Physics', marks: '78' },
  { id: '3', subject: 'Chemistry', marks: '82' },
  { id: '4', subject: 'English', marks: '88' },
];

const ResultsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Exam Results</Text>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.subject}>{item.subject}</Text>
            <Text style={styles.marks}>{item.marks} %</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
  },
  marks: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
  },
});

export default ResultsScreen;