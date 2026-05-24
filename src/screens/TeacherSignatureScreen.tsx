import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import Signature from 'react-native-signature-canvas';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const TeacherSignatureScreen = () => {
  const signatureRef = useRef<any>(null);

  // 🔥 When user taps SAVE
  const handleSave = () => {
    if (!signatureRef.current) return;
    signatureRef.current.readSignature(); // triggers onOK
  };

  // 🔥 When signature is captured
  const handleOK = async (signature: string) => {
    try {
      const user = auth().currentUser;

      if (!user) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      await firestore().collection('users').doc(user.uid).update({
        signature: signature,
      });

      Alert.alert('Success ✅', 'Signature saved successfully');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to save signature');
    }
  };

  // 🔥 Clear signature
  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.signatureContainer}>
        <Signature
          ref={signatureRef}
          onOK={handleOK}
          descriptionText="Sign above"
          clearText="Clear"
          confirmText="Save"
          webStyle={`
            .m-signature-pad {
              box-shadow: none;
              border: none;
            }
            .m-signature-pad--footer {
              display: none;
            }
          `}
        />
      </View>

      {/* BUTTONS */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.btnText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.btnText}>Save Signature</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default TeacherSignatureScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  signatureContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },

  clearBtn: {
    backgroundColor: '#EF4444',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },

  saveBtn: {
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },

  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});