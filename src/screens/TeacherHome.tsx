import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const TeacherHome = ({ navigation }: any) => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          style={styles.header}
        >
          <Text style={styles.headerEmoji}>👨‍🏫</Text>
          <Text style={styles.headerTitle}>Teacher Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Manage everything in one place
          </Text>
        </LinearGradient>

        {/* CONTENT */}
        <View style={styles.content}>

          {/* PRIMARY ACTION */}
          <TouchableOpacity
            style={styles.bigCard}
            onPress={() => navigation.navigate('Attendance')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              style={styles.bigCardGradient}
            >
              <Text style={styles.bigIcon}>📋</Text>
              <Text style={styles.bigText}>Take Attendance</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* GRID FEATURES */}
          <Text style={styles.sectionTitle}>Teaching Tools</Text>

          <View style={styles.grid}>
            {[
              { icon: '📊', label: 'Results', screen: 'UploadResult' },
              { icon: '👥', label: 'Groups', screen: 'CreateTeacherGroup' },
              { icon: '📚', label: 'Resources', screen: 'UploadResource' },
              { icon: '📝', label: 'Assignments', screen: 'CreateAssignment' },
              { icon: '🎥', label: 'Meeting', screen: 'CreateMeeting' },
              { icon: '✍️', label: 'Signature', screen: 'TeacherSignature' },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.gridCard}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.8}
              >
                <Text style={styles.gridIcon}>{item.icon}</Text>
                <Text style={styles.gridText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* REQUESTS SECTION */}
          <Text style={styles.sectionTitle}>Requests</Text>

          <TouchableOpacity
            style={styles.requestCard}
            onPress={() => navigation.navigate('TeacherRequests')}
          >
            <Text style={styles.requestIcon}>📄</Text>
            <View style={styles.requestContent}>
              <Text style={styles.requestTitle}>Bonafide Requests</Text>
              <Text style={styles.requestSubtitle}>
                Approve student certificates
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.requestCard}
            onPress={() => navigation.navigate('TeacherLeaveRequests')}
          >
            <Text style={styles.requestIcon}>📝</Text>
            <View style={styles.requestContent}>
              <Text style={styles.requestTitle}>Leave Requests</Text>
              <Text style={styles.requestSubtitle}>
                Manage leave applications
              </Text>
            </View>
          </TouchableOpacity>

          {/* LOGOUT */}
          <TouchableOpacity
            style={styles.logout}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.logoutText}>🚪 Logout</Text>
          </TouchableOpacity>

          <View style={styles.emptySpacer} />
        </View>
      </ScrollView>
    </>
  );
};

export default TeacherHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  headerEmoji: {
    fontSize: 42,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },

  headerSubtitle: {
    color: '#E0E7FF',
    marginTop: 4,
  },

  content: {
    padding: 20,
  },

  bigCard: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },

  bigCardGradient: {
    padding: 20,
    alignItems: 'center',
  },

  bigIcon: {
    fontSize: 28,
    marginBottom: 8,
  },

  bigText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 10,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  gridCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 3,
  },

  gridIcon: {
    fontSize: 28,
    marginBottom: 8,
  },

  gridText: {
    fontWeight: '600',
  },

  requestCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },

  requestIcon: {
    fontSize: 24,
    marginRight: 12,
  },

  requestContent: {
    flex: 1,
  },

  requestTitle: {
    fontWeight: '600',
    fontSize: 16,
  },

  requestSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },

  logout: {
    marginTop: 20,
    backgroundColor: '#EF4444',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptySpacer: {
    height: 40,
  },
});