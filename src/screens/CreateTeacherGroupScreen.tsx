import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const CreateTeacherGroupScreen = ({ navigation }: any) => {
  const [groupName, setGroupName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');

  const departments = ['CSE', 'ECE', 'MECH', 'CIVIL'];
  const years = ['1', '2', '3', '4'];

  const createGroup = async () => {
    if (!groupName || !department || !year) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const teacher = auth().currentUser;

      const snapshot = await firestore()
        .collection('users')
        .where('role', '==', 'Student')
        .where('department', '==', department)
        .where('year', '==', year)
        .get();

      const studentIds = snapshot.docs.map(doc => doc.id);

      await firestore().collection('groupChats').add({
        name: groupName,
        department,
        year,
        createdBy: teacher?.uid,
        members: [teacher?.uid, ...studentIds],
        createdAt: new Date(),
      });

      Alert.alert('Success', 'Group created 🎉');

      // 🔥 OPTIONAL: Auto redirect after create
      navigation.navigate('TeacherGroups');

    } catch (error: any) {
      console.log(error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Teacher Group</Text>

      {/* Group Name */}
      <TextInput
        placeholder="Enter Group Name"
        value={groupName}
        onChangeText={setGroupName}
        style={styles.input}
      />

      {/* Department */}
      <Text>Select Department</Text>
      <View style={styles.row}>
        {departments.map(dep => (
          <TouchableOpacity
            key={dep}
            style={[
              styles.option,
              department === dep && styles.selected,
            ]}
            onPress={() => setDepartment(dep)}
          >
            <Text>{dep}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Year */}
      <Text>Select Year</Text>
      <View style={styles.row}>
        {years.map(y => (
          <TouchableOpacity
            key={y}
            style={[
              styles.option,
              year === y && styles.selected,
            ]}
            onPress={() => setYear(y)}
          >
            <Text>Year {y}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CREATE BUTTON */}
      <TouchableOpacity style={styles.btn} onPress={createGroup}>
        <Text style={styles.btnText}>➕ Create Group</Text>
      </TouchableOpacity>

      {/* 🔥 NEW BUTTON */}
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => navigation.navigate('TeacherGroups')}
      >
        <Text style={styles.secondaryBtnText}>📚 View My Groups</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CreateTeacherGroupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },

  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  option: {
    borderWidth: 1,
    padding: 10,
    margin: 5,
    borderRadius: 8,
  },

  selected: {
    backgroundColor: '#BFDBFE',
  },

  btn: {
    backgroundColor: '#2563EB',
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
  },

  // 🔥 NEW STYLE
  secondaryBtn: {
    marginTop: 15,
    padding: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#2563EB',
  },
});