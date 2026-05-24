import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const ParentHome = ({ navigation }: any) => {
  return (
    <ScrollView style={styles.container}>

      <Text style={styles.header}>👨‍👩‍👧 Parent Dashboard</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('MeetingViewer')}
      >
        <Text style={styles.text}>🎥 Join PTA Meeting</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Attendance')}
      >
        <Text style={styles.text}>📊 Attendance Report</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Notifications')}
      >
        <Text style={styles.text}>🔔 Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Gallery')}
      >
        <Text style={styles.text}>📸 Gallery</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('RequestMeeting')}
      >
        <Text style={styles.text}>📅 Request Meeting</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logout}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  logout: {
    marginTop: 30,
    backgroundColor: '#ef4444',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ParentHome;