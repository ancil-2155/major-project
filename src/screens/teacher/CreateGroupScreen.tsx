import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AppBackButton from '../../components/common/AppBackButton';
import { useAppTheme } from '../../theme/appTheme';
import { createClassGroup } from '../../services/groups/groupService';
import { GroupEducationLevel, GroupType } from '../../types/groups';
import {
  getBtechDepartments,
  getBtechYears,
  getEducationLevels,
  getSchoolClasses,
  getValidSemestersForYear,
} from '../../services/academic/academicConfigService';

const CreateGroupScreen = ({ navigation }: any) => {
  const { colors } = useAppTheme();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [educationLevel, setEducationLevel] = useState<GroupEducationLevel>('btech');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [yearNumber, setYearNumber] = useState<number | null>(null);
  const [semesterNumber, setSemesterNumber] = useState<number | null>(null);
  const [classLevel, setClassLevel] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('class');
  const [creating, setCreating] = useState(false);

  const educationOptions = getEducationLevels();
  const deptOptions = getBtechDepartments();
  const yearOptions = getBtechYears();
  const semesterOptions = getValidSemestersForYear(yearNumber);
  const schoolOptions = getSchoolClasses();

  const onCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Missing', 'Please enter group name.');
      return;
    }

    if ((educationLevel === 'btech' || educationLevel === 'college') && (!departmentCode || !yearNumber || !semesterNumber)) {
      Alert.alert('Missing', 'Please select department, year and semester.');
      return;
    }

    if (educationLevel === 'school' && !classLevel) {
      Alert.alert('Missing', 'Please select class.');
      return;
    }

    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Error', 'Please login again.');
      return;
    }

    setCreating(true);
    try {
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data() || {};
      const roleValue = String(userData.role || 'teacher').toLowerCase();
      const createdByRole = roleValue === 'admin' ? 'admin' : 'teacher';
      await createClassGroup({
        groupName: groupName.trim(),
        description: description.trim() ? description.trim() : null,
        createdBy: user.uid,
        createdByName: userData.name || 'Teacher',
        createdByRole,
        educationLevel,
        departmentCode: departmentCode || null,
        department: departmentName || null,
        yearNumber: yearNumber ?? null,
        semesterNumber: semesterNumber ?? null,
        classLevel: classLevel || null,
        subject: subject.trim() ? subject.trim() : null,
        groupType,
        status: 'active',
      });

      Alert.alert('Success', 'Group created successfully.');
      navigation.replace('TeacherGroups');
    } catch (error: any) {
      console.error('create group error:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#070A12' ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <AppBackButton navigation={navigation} fallbackRoute="TeacherGroups" style={styles.backBtn} />
        <View style={styles.headerTextWrap}>
          <Text style={[styles.title, { color: colors.text }]}>Create Group</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Class / subject group setup</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Group Name</Text>
          <TextInput
            value={groupName}
            onChangeText={setGroupName}
            style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
            placeholder="e.g. CSE Sem 5 Data Structures"
            placeholderTextColor={colors.muted}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            style={[
              styles.input,
              styles.multiline,
              { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input },
            ]}
            placeholder="Optional notes for this group"
            placeholderTextColor={colors.muted}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Education Type</Text>
          <View style={styles.chipRow}>
            {educationOptions.map(item => (
              <TouchableOpacity
                key={item.value}
                onPress={() => {
                  setEducationLevel(item.value as GroupEducationLevel);
                  setDepartmentCode('');
                  setDepartmentName('');
                  setClassLevel('');
                  setYearNumber(null);
                  setSemesterNumber(null);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: educationLevel === item.value ? colors.primarySoft : colors.cardAlt,
                    borderColor: educationLevel === item.value ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={{ color: educationLevel === item.value ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {(educationLevel === 'btech' || educationLevel === 'college') ? (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Department</Text>
              <View style={styles.chipRow}>
                {deptOptions.map(dep => (
                  <TouchableOpacity
                    key={dep.code}
                    onPress={() => {
                      setDepartmentCode(dep.code);
                      setDepartmentName(dep.name);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: departmentCode === dep.code ? colors.primarySoft : colors.cardAlt,
                        borderColor: departmentCode === dep.code ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: departmentCode === dep.code ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                      {dep.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Year</Text>
              <View style={styles.chipRow}>
                {yearOptions.map(year => (
                  <TouchableOpacity
                    key={year.number}
                    onPress={() => {
                      setYearNumber(year.number);
                      setSemesterNumber(null);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: yearNumber === year.number ? colors.primarySoft : colors.cardAlt,
                        borderColor: yearNumber === year.number ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: yearNumber === year.number ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                      {year.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {yearNumber ? (
                <>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Semester</Text>
                  <View style={styles.chipRow}>
                    {semesterOptions.map(sem => (
                      <TouchableOpacity
                        key={sem.number}
                        onPress={() => setSemesterNumber(sem.number)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: semesterNumber === sem.number ? colors.primarySoft : colors.cardAlt,
                            borderColor: semesterNumber === sem.number ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text style={{ color: semesterNumber === sem.number ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                          {sem.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : null}
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Class</Text>
              <View style={styles.chipRow}>
                {schoolOptions.map(item => (
                  <TouchableOpacity
                    key={item.level}
                    onPress={() => setClassLevel(item.level)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: classLevel === item.level ? colors.primarySoft : colors.cardAlt,
                        borderColor: classLevel === item.level ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: classLevel === item.level ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={[styles.label, { color: colors.textSecondary }]}>Subject (Optional)</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            style={[styles.input, { color: colors.text, borderColor: colors.inputBorder, backgroundColor: colors.input }]}
            placeholder="e.g. Data Structures"
            placeholderTextColor={colors.muted}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Group Type</Text>
          <View style={styles.chipRow}>
            {(['class', 'subject', 'private'] as GroupType[]).map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setGroupType(type)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: groupType === type ? colors.primarySoft : colors.cardAlt,
                    borderColor: groupType === type ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={{ color: groupType === type ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            disabled={creating}
            onPress={onCreate}
            style={[styles.submitBtn, { backgroundColor: creating ? colors.muted : colors.primary }]}
          >
            <Text style={styles.submitText}>{creating ? 'Creating...' : 'Create Group'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22 },
  headerTextWrap: { marginLeft: 12, flex: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  content: { padding: 16, paddingBottom: 32 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multiline: { minHeight: 86, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, marginBottom: 8 },
  submitBtn: { marginTop: 14, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});

export default CreateGroupScreen;

