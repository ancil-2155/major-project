import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const AdminHomeScreen = ({ navigation }: any) => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#1E3A8A', '#312E81']} style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back, Administrator</Text>
        </LinearGradient>

        <View style={styles.grid}>
          {/* Teacher Approvals Card */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminApprove')}
          >
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.cardGradient}>
              <Text style={styles.cardIcon}>👩‍🏫</Text>
              <Text style={styles.cardTitle}>Teacher Approvals</Text>
              <Text style={styles.cardDesc}>Review and approve new teacher registrations.</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Attendance Reports Card */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminAttendance')}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={styles.cardGradient}>
              <Text style={styles.cardIcon}>📊</Text>
              <Text style={styles.cardTitle}>Attendance Reports</Text>
              <Text style={styles.cardDesc}>View student attendance by department and year.</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};

export default AdminHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    textAlign: 'center',
    marginTop: 4,
  },
  grid: {
    paddingHorizontal: 20,
    gap: 20,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 24,
    alignItems: 'flex-start',
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
});
