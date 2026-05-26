import firestore from '@react-native-firebase/firestore';

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  pendingTeachers: number;
  totalParents: number;
  todayTotalRecords: number;
  todayPresent: number;
  todayAbsent: number;
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const db = firestore();
  const stats: DashboardStats = {
    totalStudents: 0,
    totalTeachers: 0,
    pendingTeachers: 0,
    totalParents: 0,
    todayTotalRecords: 0,
    todayPresent: 0,
    todayAbsent: 0,
  };

  try {
    // Basic counts could be optimized with Firebase Aggregation queries in production
    // For this implementation, we'll fetch basic sizes where possible
    const usersSnap = await db.collection('users').get();
    usersSnap.forEach(doc => {
      const data = doc.data();
      if (data.role === 'student') stats.totalStudents++;
      if (data.role === 'teacher') {
        stats.totalTeachers++;
        if (data.status === 'pending' || (!data.status && data.isApproved === false)) {
          stats.pendingTeachers++;
        }
      }
      if (data.role === 'parent') stats.totalParents++;
    });

    const dateKey = new Date().toISOString().split('T')[0];
    const attendanceSnap = await db.collection('attendance').where('dateKey', '==', dateKey).get();
    
    attendanceSnap.forEach(doc => {
      stats.todayTotalRecords++;
      if (doc.data().status === 'present') stats.todayPresent++;
      else stats.todayAbsent++;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return stats;
  }
};
