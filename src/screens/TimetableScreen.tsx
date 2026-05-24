import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const timetableData = [
  {
    day: 'Monday',
    classes: [
      { time: '9:00 - 10:00', subject: 'Maths' },
      { time: '10:00 - 11:00', subject: 'Physics' },
      { time: '11:30 - 12:30', subject: 'Chemistry' },
    ],
  },
  {
    day: 'Tuesday',
    classes: [
      { time: '9:00 - 10:00', subject: 'English' },
      { time: '10:00 - 11:00', subject: 'Biology' },
    ],
  },
  {
    day: 'Wednesday',
    classes: [
      { time: '9:00 - 10:00', subject: 'Maths' },
      { time: '10:00 - 11:00', subject: 'Computer' },
    ],
  },
  {
    day: 'Thursday',
    classes: [
      { time: '9:00 - 10:00', subject: 'Physics' },
      { time: '10:00 - 11:00', subject: 'Chemistry' },
    ],
  },
  {
    day: 'Friday',
    classes: [
      { time: '9:00 - 10:00', subject: 'English' },
      { time: '10:00 - 11:00', subject: 'Maths' },
    ],
  },
];

const TimetableScreen = () => {
  return (
    <FlatList
      style={styles.container}
      data={timetableData}
      keyExtractor={(item) => item.day}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.day}>{item.day}</Text>

          {item.classes.map((cls, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.time}>{cls.time}</Text>
              <Text style={styles.subject}>{cls.subject}</Text>
            </View>
          ))}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 10,
  },
  card: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  day: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2563EB',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  time: {
    fontSize: 14,
    color: '#555',
  },
  subject: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TimetableScreen;