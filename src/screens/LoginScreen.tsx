import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import ACAMSLogo from '../components/common/ACAMSLogo';
import { useAppTheme } from '../theme/appTheme';

const LoginScreen = ({ navigation }: any) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert('Error', 'Enter email and password');
        return;
      }

      setLoading(true);

      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const data = userDoc.data();

      if (!data) {
        Alert.alert('Error', 'User data not found');
        return;
      }

      if (data.role === 'teacher') {
        if (data.status === 'pending' || (!data.status && data.isApproved === false)) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'PendingApproval' }],
            })
          );
          return;
        } else if (data.status === 'rejected') {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'RejectedTeacher', params: { reason: data.rejectionReason } }],
            })
          );
          return;
        } else if (data.status === 'suspended') {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'SuspendedAccount' }],
            })
          );
          return;
        }
      }

      let routeName = '';
      if (data.role === 'admin') routeName = 'AdminHome';
      else if (data.role === 'teacher') routeName = 'TeacherHome';
      else if (data.role === 'student') routeName = 'StudentHome';
      else if (data.role === 'parent') routeName = 'ParentHome';

      if (routeName) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: routeName }],
          })
        );
      } else {
        Alert.alert('Error', 'Unknown role');
      }

    } catch (error: any) {
      console.log(error);
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <ACAMSLogo size={92} />
        </View>
        <Text style={styles.appName}>ACAMS</Text>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() => navigation.navigate('ForgotPassword')}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkHighlight}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.28 : 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.input,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  linkHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
});
