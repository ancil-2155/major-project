import auth from '@react-native-firebase/auth';

export const signUpStudent = async (email: string, password: string) => {
  const userCredential = await auth().createUserWithEmailAndPassword(email, password);
  return userCredential.user;
};

export const signInStudent = async (email: string, password: string) => {
  const userCredential = await auth().signInWithEmailAndPassword(email, password);
  return userCredential.user;
};
