import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { printBonafideCertificate, CertificateData } from '../services/print/bonafidePdfService';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');

const BonafideCertificateViewScreen = ({ route, navigation }: any) => {
  const { certificate } = route.params;
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const data: CertificateData = {
        studentName: certificate.studentName,
        rollNo: certificate.rollNo,
        department: certificate.department,
        year: certificate.year,
        semester: certificate.section || certificate.semester,
        purpose: certificate.purpose,
        requestedAt: certificate.requestedAt?.toDate(),
        approvedAt: certificate.approvedAt?.toDate(),
        teacherName: certificate.reviewedByName || certificate.teacherName,
        teacherSignature: certificate.signature, // Expected to be base64 data URI
      };

      await printBonafideCertificate(data);
      
      // Update firestore to record that certificate was generated
      await firestore().collection('bonafide_requests').doc(certificate.id).update({
        certificateLastViewedAt: firestore.FieldValue.serverTimestamp(),
      });
      
    } catch (error) {
      console.log('Error printing:', error);
      Alert.alert('Error', 'Failed to generate print document.');
    } finally {
      setPrinting(false);
    }
  };

  const statusColor = 
    certificate.status === 'approved' ? '#10B981' : 
    certificate.status === 'rejected' ? '#EF4444' : '#F59E0B';

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certificate View</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            Status: {certificate.status.toUpperCase()}
          </Text>
          {certificate.status === 'approved' && certificate.signatureAttached && (
            <Text style={styles.signatureText}>✓ Digitally Signed</Text>
          )}
        </View>

        {/* Certificate Preview Card */}
        <View style={styles.certCard}>
          <Text style={styles.certHeader}>BONAFIDE CERTIFICATE</Text>
          <View style={styles.certDivider} />
          
          <View style={styles.certBody}>
            <Text style={styles.certText}>
              This is to certify that <Text style={styles.bold}>{certificate.studentName}</Text>, 
              Roll No <Text style={styles.bold}>{certificate.rollNo || '_____'}</Text>, 
              is a bonafide student of this institution, studying in the <Text style={styles.bold}>{certificate.year || '____'}</Text> year, 
              Department of <Text style={styles.bold}>{certificate.department || '_____'}</Text>.
            </Text>
            
            <Text style={[styles.certText, { marginTop: 20 }]}>
              This certificate is issued for the purpose of <Text style={styles.bold}>{certificate.purpose}</Text>.
            </Text>
          </View>

          <View style={styles.certFooter}>
            <View>
              <Text style={styles.certDateTitle}>Date</Text>
              <Text style={styles.certDateText}>
                {certificate.approvedAt ? certificate.approvedAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.signatureBox}>
              {certificate.signature ? (
                <Image 
                  source={{ uri: certificate.signature }} 
                  style={styles.signatureImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.placeholderSignature} />
              )}
              <View style={styles.signatureLine} />
              <Text style={styles.signatoryName}>{certificate.reviewedByName || certificate.teacherName || 'Authorized Signatory'}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {certificate.status === 'approved' ? (
          <TouchableOpacity 
            style={styles.printButton}
            onPress={handlePrint}
            disabled={printing}
          >
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              style={styles.printGradient}
            >
              {printing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.printIcon}>🖨️</Text>
                  <Text style={styles.printText}>Print / Save as PDF</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.disabledActionBox}>
            <Text style={styles.disabledActionText}>
              Printing is only available for approved certificates.
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: Platform.OS === 'ios' ? 50 : 20, 
    paddingBottom: 20, 
    paddingHorizontal: 20 
  },
  backButton: { 
    width: 40, height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15,
  },
  backIcon: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusText: { fontSize: 16, fontWeight: 'bold' },
  signatureText: { fontSize: 14, color: '#10B981', fontWeight: 'bold' },
  
  certCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 30,
  },
  certHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
    letterSpacing: 1,
  },
  certDivider: {
    height: 2,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  certBody: {
    marginBottom: 40,
  },
  certText: {
    fontSize: 16,
    lineHeight: 28,
    color: '#374151',
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 'bold',
    color: '#111827',
  },
  certFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  certDateTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  certDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  signatureBox: {
    alignItems: 'center',
    width: 140,
  },
  signatureImage: {
    width: 120,
    height: 60,
    marginBottom: 5,
  },
  placeholderSignature: {
    height: 65,
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#111827',
    marginBottom: 8,
  },
  signatoryName: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  printButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  printGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  printIcon: { fontSize: 20 },
  printText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  disabledActionBox: {
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabledActionText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default BonafideCertificateViewScreen;
