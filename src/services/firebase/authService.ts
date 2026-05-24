import auth from '@react-native-firebase/auth';

export const signUpStudent = async (email: string, password: string) => {
  const userCredential = await auth().createUserWithEmailAndPassword(email, password);
  return userCredential.user;
};
