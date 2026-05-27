import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
  LayoutAnimation,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface FAQItem {
  question: string;
  answer: string;
  icon: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'What is ACAMS?',
    answer:
      'ACAMS (Automated Camera-based Attendance Management System) is a smart digital platform designed for educational institutions. It automates attendance using face recognition, and provides tools for managing leave requests, bonafide certificates, results, assignments, and more — all in one unified app for students, teachers, parents, and administrators.',
    icon: '📱',
  },
  {
    question: 'How does face attendance work?',
    answer:
      'Teachers scan students using the live camera. The app compares the live face embedding with enrolled face embeddings to mark attendance automatically. The process is quick, contactless, and eliminates manual roll calls.',
    icon: '🤖',
  },
  {
    question: 'Why do I need face enrollment?',
    answer:
      'Face enrollment creates a unique face embedding that is used to identify you during live attendance scanning. Without enrollment, the system cannot verify your identity. You only need to enroll once, and the data is securely stored.',
    icon: '📸',
  },
  {
    question: 'How do I apply for leave?',
    answer:
      "Go to the Student Dashboard and tap 'Apply Leave'. Fill in the leave details including the date range, leave type, and reason, then submit. Your teacher will review and approve or reject the request. You can track the status from 'My Leaves'.",
    icon: '📝',
  },
  {
    question: 'How do I request a bonafide certificate?',
    answer:
      "Go to 'My Certificates' on the Student Dashboard and tap 'Apply Bonafide Certificate'. Fill in the required details such as the purpose of the certificate and submit. The admin will process your request and you'll be notified when it's ready.",
    icon: '📜',
  },
  {
    question: 'How do I view results?',
    answer:
      "Tap 'Results' on the Student Dashboard to view your uploaded results. Results are organized by semester and subject. Your teachers upload results which are then available for you to view anytime.",
    icon: '📊',
  },
  {
    question: 'How do I reset my password?',
    answer:
      "Go to Settings > Account > Change Password, or use the 'Forgot Password' option on the login screen. A password reset link will be sent to your registered email address. Follow the link to set a new password.",
    icon: '🔑',
  },
  {
    question: 'What happens if my face is not detected?',
    answer:
      'Ensure good lighting, face the camera directly, and remove any obstructions like hats or sunglasses. If issues persist, try re-enrolling your face from the enrollment screen. Make sure your face is clearly visible and centered in the camera frame.',
    icon: '⚠️',
  },
];

const FAQAccordionItem = ({
  item,
  index,
  isExpanded,
  onToggle,
}: {
  item: FAQItem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  const handleToggle = () => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        250,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );

    onToggle();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.faqCard}>
      <TouchableOpacity
        style={styles.faqHeader}
        activeOpacity={0.7}
        onPress={handleToggle}>
        <View style={styles.faqLeft}>
          <View style={styles.faqIconContainer}>
            <Text style={styles.faqIcon}>{item.icon}</Text>
          </View>
          <Text style={styles.faqQuestion}>{item.question}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Text style={styles.chevronIcon}>▼</Text>
        </Animated.View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.faqBody}>
          <View style={styles.answerDivider} />
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
};

const FAQScreen = ({ navigation }: any) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Gradient Header */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAQ</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>
          Frequently Asked Questions
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.introText}>
          Find answers to common questions about using ACAMS. Tap any question to expand.
        </Text>

        {FAQ_DATA.map((item, index) => (
          <FAQAccordionItem
            key={index}
            item={item}
            index={index}
            isExpanded={expandedIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}

        <View style={styles.helpCard}>
          <Text style={styles.helpIcon}>💬</Text>
          <Text style={styles.helpTitle}>Still have questions?</Text>
          <Text style={styles.helpText}>
            If you couldn't find what you're looking for, please contact your
            class teacher or the institution administrator for further
            assistance.
          </Text>
        </View>

        <Text style={styles.footerText}>ACAMS • v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#f8fafc',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  introText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },

  // FAQ Card
  faqCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  faqIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faqIcon: {
    fontSize: 18,
  },
  faqQuestion: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  chevronIcon: {
    fontSize: 12,
    color: '#64748b',
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  answerDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 14,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 22,
    paddingLeft: 50,
  },

  // Help Card
  helpCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  helpIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },

  footerText: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 12,
    marginTop: 24,
  },
});

export default FAQScreen;
