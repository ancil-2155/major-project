import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import Signature from 'react-native-signature-canvas';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';

const TeacherSignatureScreen = ({ navigation }: any) => {
  const signatureRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'draw'>('view'); // view existing or draw new

  useEffect(() => {
    fetchSignature();
  }, []);

  const fetchSignature = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;
      const doc = await firestore().collection('users').doc(user.uid).get();
      const sig = doc.data()?.signature;
      if (sig) {
        setSavedSignature(sig);
        setMode('view');
      } else {
        setMode('draw');
      }
    } catch (error) {
      console.log('Error fetching signature:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!signatureRef.current) return;
    signatureRef.current.readSignature();
  };

  const handleOK = async (signature: string) => {
    try {
      setSaving(true);
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      await firestore().collection('users').doc(user.uid).update({
        signature: signature,
      });

      setSavedSignature(signature);
      setMode('view');
      Alert.alert('Success ✅', 'Your digital signature has been saved and will be used for approvals.');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to save signature');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Digital Signature</Text>
          <View style={{ width: 60 }} />
        </View>
      </LinearGradient>

      {mode === 'view' && savedSignature ? (
        <View style={styles.viewModeContainer}>
          <Text style={styles.infoText}>
            This signature is used automatically when you approve Bonafide and Leave requests.
          </Text>
          <View style={styles.savedSignatureBox}>
            <Image 
              source={{ uri: savedSignature }} 
              style={styles.signatureImage} 
              resizeMode="contain" 
            />
          </View>
          <TouchableOpacity style={styles.redrawBtn} onPress={() => setMode('draw')}>
            <Text style={styles.redrawText}>Create New Signature</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Please draw your signature below. It will be attached to approved certificates.
            </Text>
          </View>

          <View style={styles.signatureContainer}>
            <Signature
              ref={signatureRef}
              onOK={handleOK}
              descriptionText=""
              clearText="Clear"
              confirmText="Save"
              webStyle={`
                .m-signature-pad {
                  box-shadow: none;
                  border: none;
                  width: 100%;
                  height: 100%;
                }
                .m-signature-pad--footer {
                  display: none;
                }
              `}
            />
          </View>

          <View style={styles.buttonContainer}>
            {savedSignature && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('view')}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.btnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Signature</Text>}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

export default TeacherSignatureScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 50, paddingBottom: 15, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  backText: { color: '#fff', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  viewModeContainer: { padding: 20, alignItems: 'center', marginTop: 20 },
  infoText: { textAlign: 'center', color: '#4B5563', fontSize: 15, marginBottom: 20, lineHeight: 22 },
  savedSignatureBox: { backgroundColor: '#fff', width: '100%', height: 200, borderRadius: 12, elevation: 2, justifyContent: 'center', alignItems: 'center', padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#E5E7EB' },
  signatureImage: { width: '100%', height: '100%' },
  redrawBtn: { backgroundColor: '#4F46E5', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  redrawText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  instructionsContainer: { padding: 20, paddingBottom: 10 },
  instructionsText: { color: '#4B5563', fontSize: 14, textAlign: 'center' },
  
  signatureContainer: { flex: 1, marginHorizontal: 20, marginBottom: 20, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#E5E7EB', elevation: 2 },
  
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#E5E7EB', gap: 10 },
  cancelBtn: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 10, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB' },
  cancelText: { color: '#374151', fontWeight: 'bold' },
  clearBtn: { backgroundColor: '#EF4444', padding: 15, borderRadius: 10, flex: 1, alignItems: 'center' },
  saveBtn: { backgroundColor: '#10B981', padding: 15, borderRadius: 10, flex: 1, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
});