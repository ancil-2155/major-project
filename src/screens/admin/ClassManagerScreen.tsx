import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import { createDepartment, createSubject } from '../../services/admin/classManagerService';

const ClassManagerScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'dept' | 'subject'>('dept');
  const [loading, setLoading] = useState(false);

  // Dept state
  const [deptName, setDeptName] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);

  // Subject state
  const [subjName, setSubjName] = useState('');
  const [subjDept, setSubjDept] = useState('');
  const [subjYear, setSubjYear] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    const unsubDept = firestore().collection('departments').onSnapshot(snap => {
      if (!snap) return;
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setDepartments(list);
    });
    
    const unsubSubj = firestore().collection('subjects').onSnapshot(snap => {
      if (!snap) return;
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setSubjects(list);
    });

    return () => { unsubDept(); unsubSubj(); };
  }, []);

  const handleAddDept = async () => {
    if (!deptName.trim()) { Alert.alert('Error', 'Name required'); return; }
    setLoading(true);
    try {
      await createDepartment(deptName);
      setDeptName('');
      Alert.alert('Success', 'Department added');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const handleAddSubject = async () => {
    if (!subjName.trim() || !subjDept.trim()) { Alert.alert('Error', 'Name and Department required'); return; }
    setLoading(true);
    try {
      await createSubject(subjName, subjDept, subjYear);
      setSubjName(''); setSubjDept(''); setSubjYear('');
      Alert.alert('Success', 'Subject added');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E3A8A', '#312E81']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Class Manager</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'dept' && styles.activeTab]} onPress={() => setActiveTab('dept')}>
            <Text style={[styles.tabText, activeTab === 'dept' && styles.activeTabText]}>Departments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'subject' && styles.activeTab]} onPress={() => setActiveTab('subject')}>
            <Text style={[styles.tabText, activeTab === 'subject' && styles.activeTabText]}>Subjects</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'dept' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Add Department</Text>
            <TextInput style={styles.input} placeholder="e.g. Computer Science (CSE)" value={deptName} onChangeText={setDeptName} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleAddDept} disabled={loading}>
              <Text style={styles.submitText}>Add Department</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Existing Departments</Text>
            {departments.map(d => (
              <View key={d.id} style={styles.listItem}><Text style={styles.listText}>{d.name}</Text></View>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Add Subject</Text>
            <TextInput style={styles.input} placeholder="Subject Name (e.g. Data Structures)" value={subjName} onChangeText={setSubjName} />
            <TextInput style={styles.input} placeholder="Department (e.g. CSE)" value={subjDept} onChangeText={setSubjDept} />
            <TextInput style={styles.input} placeholder="Year (e.g. 2)" value={subjYear} onChangeText={setSubjYear} keyboardType="numeric" />
            <TouchableOpacity style={styles.submitBtn} onPress={handleAddSubject} disabled={loading}>
              <Text style={styles.submitText}>Add Subject</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Existing Subjects</Text>
            {subjects.map(s => (
              <View key={s.id} style={styles.listItem}>
                <Text style={styles.listText}>{s.name}</Text>
                <Text style={styles.subText}>{s.department} • Year {s.year}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default ClassManagerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingTop: 50, paddingBottom: 0, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  backText: { color: '#fff', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10 },
  tab: { paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#fff' },
  tabText: { color: '#93C5FD', fontWeight: '600' },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 14, color: '#1F2937', marginBottom: 12 },
  submitBtn: { backgroundColor: '#10B981', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  submitText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },
  listItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  listText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  subText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
});
