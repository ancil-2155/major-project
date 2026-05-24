import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Modal,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const { width, height } = Dimensions.get('window');

const ApplyBonafideScreen = ({ navigation }: any) => {
  const [purpose, setPurpose] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Details, Step 2: Teacher Selection
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    fetchUserData();
    fetchTeachers();
    startAnimations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchUserData = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      const userDoc = await firestore()
        .collection('users')
        .doc(user.uid)
        .get();

      setUserData(userDoc.data());
    } catch (error) {
      console.log('Error fetching user data:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const teachersSnapshot = await firestore()
        .collection('users')
        .where('role', '==', 'teacher')
        .where('approved', '==', true)
        .get();

      const teachersList: any[] = [];
      teachersSnapshot.forEach(doc => {
        teachersList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setTeachers(teachersList);
    } catch (error) {
      console.log('Error fetching teachers:', error);
    }
  };

  const handleNextStep = () => {
    if (!purpose.trim()) {
      Alert.alert('Error', 'Please enter purpose');
      return;
    }
    setStep(2);
  };

  const submitRequest = async () => {
    try {
      const user = auth().currentUser;

      if (!user) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      if (!selectedTeacher) {
        Alert.alert('Error', 'Please select a teacher');
        return;
      }

      setLoading(true);

      // Fetch user data if not already loaded
      let data = userData;
      if (!data) {
        const userDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        data = userDoc.data();
      }

      if (!data) {
        Alert.alert('Error', 'User data not found');
        setLoading(false);
        return;
      }

      // Save bonafide request with teacherId
      const docRef = await firestore().collection('bonafide_requests').add({
        studentId: user.uid,
        studentName: data.name || 'N/A',
        rollNo: data.rollNo || 'N/A',
        department: data.department || 'N/A',
        year: data.year || 'N/A',
        section: data.section || 'N/A',
        purpose: purpose.trim(),
        additionalInfo: additionalInfo.trim(),
        teacherId: selectedTeacher.id, // 🔥 IMPORTANT - Add teacherId
        teacherName: selectedTeacher.name,
        teacherDepartment: selectedTeacher.department,
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      setRequestId(docRef.id);
      setShowSuccessModal(true);
      
      // Reset form
      setPurpose('');
      setAdditionalInfo('');
      setSelectedTeacher(null);
      setStep(1);

    } catch (error) {
      console.log('ERROR:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const commonPurposes = [
    'Scholarship Application',
    'Education Loan',
    'Passport/Visa',
    'Competitive Exam',
    'Job Application',
    'Higher Studies',
    'Fee Concession',
    'Government Scheme',
  ];

  const selectPurpose = (selectedPurpose: string) => {
    setPurpose(selectedPurpose);
  };

  const renderTeacherItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.teacherCard,
        selectedTeacher?.id === item.id && styles.teacherCardActive
      ]}
      onPress={() => {
        setSelectedTeacher(item);
        setShowTeacherModal(false);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.teacherAvatar}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.teacherAvatarGradient}
        >
          <Text style={styles.teacherAvatarText}>
            {item.name?.charAt(0) || 'T'}
          </Text>
        </LinearGradient>
      </View>
      <View style={styles.teacherInfo}>
        <Text style={styles.teacherName}>{item.name || 'Unknown'}</Text>
        <Text style={styles.teacherDetail}>{item.department || 'Department'}</Text>
        <Text style={styles.teacherDetail}>Year Incharge: {item.yearIncharge || 'N/A'}</Text>
      </View>
      {selectedTeacher?.id === item.id && (
        <View style={styles.teacherCheck}>
          <Text style={styles.teacherCheckText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.headerTitle}>Bonafide Certificate</Text>
              <Text style={styles.headerSubtitle}>
                Step {step} of 2: {step === 1 ? 'Request Details' : 'Select Teacher'}
              </Text>
            </Animated.View>
          </LinearGradient>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          </View>

          {/* Step 1: Request Details */}
          {step === 1 && (
            <>
              {/* Student Info Card */}
              <Animated.View 
                style={[
                  styles.infoCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  }
                ]}
              >
                <Text style={styles.cardTitle}>📋 Student Information</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>{userData?.name || 'Loading...'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Roll No</Text>
                    <Text style={styles.infoValue}>{userData?.rollNo || 'Loading...'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Department</Text>
                    <Text style={styles.infoValue}>{userData?.department || 'Loading...'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Year</Text>
                    <Text style={styles.infoValue}>{userData?.year || 'Loading...'}</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Purpose Input Section */}
              <Animated.View 
                style={[
                  styles.formSection,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                  }
                ]}
              >
                <Text style={styles.sectionTitle}>🎯 Purpose of Certificate</Text>
                
                {/* Common Purposes Chips */}
                <View style={styles.chipsContainer}>
                  {commonPurposes.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.chip,
                        purpose === item && styles.chipActive
                      ]}
                      onPress={() => selectPurpose(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.chipText,
                        purpose === item && styles.chipTextActive
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Or specify your purpose *</Text>
                <TextInput
                  placeholder="e.g., For scholarship application, education loan, etc."
                  style={styles.input}
                  value={purpose}
                  onChangeText={setPurpose}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.label}>Additional Information (Optional)</Text>
                <TextInput
                  placeholder="Any additional details you'd like to mention..."
                  style={[styles.input, styles.textArea]}
                  value={additionalInfo}
                  onChangeText={setAdditionalInfo}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#9CA3AF"
                />

                {/* Next Button */}
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleNextStep}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={purpose.trim() ? ['#11998e', '#38ef7d'] : ['#94a3b8', '#cbd5e1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <>
                      <Text style={styles.buttonIcon}>➡️</Text>
                      <Text style={styles.buttonText}>Next: Select Teacher</Text>
                    </>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}

          {/* Step 2: Teacher Selection */}
          {step === 2 && (
            <Animated.View 
              style={[
                styles.formSection,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              <Text style={styles.sectionTitle}>👨‍🏫 Select Teacher</Text>
              <Text style={styles.subSectionText}>
                Please select a teacher who will approve your bonafide certificate
              </Text>

              {/* Selected Teacher Display */}
              {selectedTeacher && (
                <View style={styles.selectedTeacherCard}>
                  <Text style={styles.selectedTeacherTitle}>Selected Teacher:</Text>
                  <View style={styles.selectedTeacherInfo}>
                    <Text style={styles.selectedTeacherName}>{selectedTeacher.name}</Text>
                    <Text style={styles.selectedTeacherDept}>{selectedTeacher.department}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeTeacherButton}
                    onPress={() => setShowTeacherModal(true)}
                  >
                    <Text style={styles.changeTeacherText}>Change Teacher</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Select Teacher Button */}
              {!selectedTeacher && (
                <TouchableOpacity
                  style={styles.selectTeacherButton}
                  onPress={() => setShowTeacherModal(true)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.selectTeacherGradient}
                  >
                    <Text style={styles.selectTeacherIcon}>👨‍🏫</Text>
                    <Text style={styles.selectTeacherText}>Choose a Teacher</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Teacher List (if no modal) */}
              {teachers.length > 0 && !selectedTeacher && (
                <View style={styles.teacherListContainer}>
                  <Text style={styles.teacherListTitle}>Available Teachers:</Text>
                  {teachers.map((teacher) => (
                    <TouchableOpacity
                      key={teacher.id}
                      style={styles.teacherCard}
                      onPress={() => setSelectedTeacher(teacher)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.teacherAvatar}>
                        <LinearGradient
                          colors={['#667eea', '#764ba2']}
                          style={styles.teacherAvatarGradient}
                        >
                          <Text style={styles.teacherAvatarText}>
                            {teacher.name?.charAt(0) || 'T'}
                          </Text>
                        </LinearGradient>
                      </View>
                      <View style={styles.teacherInfo}>
                        <Text style={styles.teacherName}>{teacher.name || 'Unknown'}</Text>
                        <Text style={styles.teacherDetail}>{teacher.department || 'Department'}</Text>
                        <Text style={styles.teacherDetail}>Year Incharge: {teacher.yearIncharge || 'N/A'}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Navigation Buttons */}
              <View style={styles.stepButtons}>
                <TouchableOpacity
                  style={[styles.stepButton, styles.backStepButton]}
                  onPress={() => setStep(1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backStepButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.stepButton, styles.submitStepButton]}
                  onPress={submitRequest}
                  disabled={loading || !selectedTeacher}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={selectedTeacher ? ['#11998e', '#38ef7d'] : ['#94a3b8', '#cbd5e1']}
                    style={styles.submitGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.buttonIcon}>📜</Text>
                        <Text style={styles.buttonText}>Submit Request</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Info Note */}
              <View style={styles.noteContainer}>
                <Text style={styles.noteIcon}>ℹ️</Text>
                <Text style={styles.noteText}>
                  Your request will be sent to the selected teacher for approval. 
                  Once approved, you will receive your bonafide certificate.
                </Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Teacher Selection Modal */}
        <Modal
          visible={showTeacherModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.teacherModalContainer}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.teacherModalHeader}
              >
                <Text style={styles.teacherModalTitle}>Select a Teacher</Text>
                <TouchableOpacity onPress={() => setShowTeacherModal(false)}>
                  <Text style={styles.teacherModalClose}>✕</Text>
                </TouchableOpacity>
              </LinearGradient>
              
              <FlatList
                data={teachers}
                keyExtractor={(item) => item.id}
                renderItem={renderTeacherItem}
                contentContainerStyle={styles.teacherModalList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No teachers available</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.successModal, { transform: [{ scale: scaleAnim }] }]}>
              <View style={styles.successIconContainer}>
                <LinearGradient
                  colors={['#11998e', '#38ef7d']}
                  style={styles.successIcon}
                >
                  <Text style={styles.successIconText}>✓</Text>
                </LinearGradient>
              </View>
              <Text style={styles.successTitle}>Request Submitted!</Text>
              <Text style={styles.successMessage}>
                Your bonafide certificate request has been successfully submitted to {selectedTeacher?.name}.
              </Text>
              <Text style={styles.requestIdText}>Request ID: {requestId}</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.goBack();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#11998e', '#38ef7d']}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  stepDotActive: {
    backgroundColor: '#11998e',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#11998e',
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  formSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 8,
  },
  subSectionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#11998e',
    borderColor: '#11998e',
  },
  chipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#1F2937',
    textAlignVertical: 'top',
  },
  textArea: {
    minHeight: 100,
  },
  button: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#11998e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedTeacherCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  selectedTeacherTitle: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 8,
  },
  selectedTeacherInfo: {
    marginBottom: 12,
  },
  selectedTeacherName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14532D',
  },
  selectedTeacherDept: {
    fontSize: 14,
    color: '#166534',
    marginTop: 4,
  },
  changeTeacherButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#DC2626',
    borderRadius: 8,
  },
  changeTeacherText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectTeacherButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  selectTeacherGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  selectTeacherIcon: {
    fontSize: 32,
  },
  selectTeacherText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  teacherListContainer: {
    marginBottom: 20,
  },
  teacherListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  teacherCardActive: {
    borderColor: '#11998e',
    backgroundColor: '#F0FDF4',
  },
  teacherAvatar: {
    marginRight: 12,
  },
  teacherAvatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  teacherDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  teacherCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#11998e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherCheckText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  stepButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  backStepButton: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backStepButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  submitStepButton: {
    flex: 2,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  noteIcon: {
    fontSize: 16,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width - 40,
    maxHeight: height * 0.8,
    overflow: 'hidden',
  },
  teacherModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  teacherModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  teacherModalClose: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  teacherModalList: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  successModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: width - 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  requestIdText: {
    fontSize: 12,
    color: '#11998e',
    fontWeight: '600',
    marginBottom: 24,
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ApplyBonafideScreen;