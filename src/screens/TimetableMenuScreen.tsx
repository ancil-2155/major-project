import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type TimetableMenuNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TimetableMenu'>;

const TimetableMenuScreen = () => {
  const navigation = useNavigation<TimetableMenuNavigationProp>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Academic Section</Text>

      <TouchableOpacity style={styles.card}>
        <Text style={styles.text}>📅 Academic Calendar</Text>
      </TouchableOpacity>

     <TouchableOpacity
  style={styles.card}
  onPress={() => navigation.navigate('TimetableScreen')}
>
  <Text style={styles.text}>🕒 Timetable</Text>
</TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <Text style={styles.text}>📘 Schemes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <Text style={styles.text}>📄 Syllabus</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f3f4f6',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TimetableMenuScreen;