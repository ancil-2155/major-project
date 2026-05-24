import auth from '@react-native-firebase/auth';

export const registerUser = async (email, password) => {
  return await auth().createUserWithEmailAndPassword(email, password);
};