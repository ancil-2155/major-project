/**
 * requestService.ts
 * Teacher-side Firebase service for bonafide and leave requests.
 * Collections: bonafide_requests, leave_requests
 */
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface BonafideRequest {
  id: string;
  studentId: string;
  studentName: string;
  rollNo?: string;
  department: string;
  year: string;
  section?: string;
  purpose: string;
  additionalInfo?: string;
  teacherId?: string;
  teacherName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
  requestedAt?: any;
  approvedAt?: any;
  rejectedAt?: any;
  rejectionReason?: string;
  signature?: string;          // base64 or URL
  signedBy?: string;
  signatureAttached?: boolean;
  reviewedBy?: string;
  reviewedByName?: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  rollNo?: string;
  department: string;
  year: string;
  teacherId?: string;
  teacherName?: string;
  fromDate: string;
  toDate: string;
  reason: string;
  leaveType?: string;
  halfDay?: boolean;
  halfDaySession?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
  approvedAt?: any;
  rejectedAt?: any;
  rejectionReason?: string;
  signature?: string;
  signedBy?: string;
  signatureAttached?: boolean;
  reviewedBy?: string;
  reviewedByName?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const getTeacherProfile = async (uid: string) => {
  const doc = await firestore().collection('users').doc(uid).get();
  return doc.exists ? { uid, ...doc.data() } as any : null;
};

// ─── Bonafide Requests ───────────────────────────────────────────────────────

/**
 * Get bonafide requests visible to the current teacher.
 * Strategy: match teacherId first; if empty, fall back to department match.
 */
export const getBonafideRequestsForTeacher = async (): Promise<BonafideRequest[]> => {
  try {
    const user = auth().currentUser;
    if (!user) return [];

    // Primary: requests directly assigned to this teacher
    const snapshot = await firestore()
      .collection('bonafide_requests')
      .where('teacherId', '==', user.uid)
      .get();

    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BonafideRequest));
    }

    // Fallback: get teacher's department and load all requests for that dept
    const teacher = await getTeacherProfile(user.uid);
    if (teacher?.department) {
      const deptSnapshot = await firestore()
        .collection('bonafide_requests')
        .where('department', '==', teacher.department)
        .get();
      return deptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BonafideRequest));
    }

    // Last resort: load all pending (TODO: restrict when school workflow is defined)
    const allSnapshot = await firestore()
      .collection('bonafide_requests')
      .where('status', '==', 'pending')
      .get();
    return allSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BonafideRequest));
  } catch (error) {
    console.error('getBonafideRequestsForTeacher error:', error);
    return [];
  }
};

/**
 * Real-time listener for bonafide requests for teacher.
 */
export const subscribeToBonafideRequests = (
  teacherUid: string,
  onData: (requests: BonafideRequest[]) => void,
  onError: (err: any) => void
) => {
  return firestore()
    .collection('bonafide_requests')
    .where('teacherId', '==', teacherUid)
    .onSnapshot(
      snapshot => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BonafideRequest));
        onData(list);
      },
      onError
    );
};

/**
 * Real-time listener for leave requests for teacher.
 */
export const subscribeToLeaveRequests = (
  teacherUid: string,
  onData: (requests: LeaveRequest[]) => void,
  onError: (err: any) => void
) => {
  return firestore()
    .collection('leave_requests')
    .where('teacherId', '==', teacherUid)
    .onSnapshot(
      snapshot => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
        onData(list);
      },
      onError
    );
};

// ─── Approve / Reject ────────────────────────────────────────────────────────

/**
 * Approve a bonafide request, optionally attaching teacher's saved signature.
 */
export const approveBonafideRequest = async (
  requestId: string,
  teacherName: string,
  savedSignature?: string
): Promise<void> => {
  const user = auth().currentUser;
  if (!user) throw new Error('Not authenticated');

  const updateData: any = {
    status: 'approved',
    approvedAt: firestore.FieldValue.serverTimestamp(),
    reviewedBy: user.uid,
    reviewedByName: teacherName,
    signatureAttached: false,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  if (savedSignature) {
    updateData.signature = savedSignature;
    updateData.signedBy = teacherName;
    updateData.signatureAttached = true;
    updateData.signedAt = firestore.FieldValue.serverTimestamp();
  }

  await firestore().collection('bonafide_requests').doc(requestId).update(updateData);
};

/**
 * Reject a bonafide request with a reason.
 */
export const rejectBonafideRequest = async (
  requestId: string,
  teacherName: string,
  reason: string
): Promise<void> => {
  const user = auth().currentUser;
  if (!user) throw new Error('Not authenticated');

  await firestore().collection('bonafide_requests').doc(requestId).update({
    status: 'rejected',
    rejectedAt: firestore.FieldValue.serverTimestamp(),
    reviewedBy: user.uid,
    reviewedByName: teacherName,
    rejectionReason: reason,
    signatureAttached: false,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

/**
 * Approve a leave request.
 */
export const approveLeaveRequest = async (
  requestId: string,
  teacherName: string,
  savedSignature?: string
): Promise<void> => {
  const user = auth().currentUser;
  if (!user) throw new Error('Not authenticated');

  const updateData: any = {
    status: 'approved',
    approvedAt: firestore.FieldValue.serverTimestamp(),
    reviewedBy: user.uid,
    reviewedByName: teacherName,
    signatureAttached: false,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  if (savedSignature) {
    updateData.signature = savedSignature;
    updateData.signedBy = teacherName;
    updateData.signatureAttached = true;
    updateData.signedAt = firestore.FieldValue.serverTimestamp();
  }

  await firestore().collection('leave_requests').doc(requestId).update(updateData);
};

/**
 * Reject a leave request.
 */
export const rejectLeaveRequest = async (
  requestId: string,
  teacherName: string,
  reason: string
): Promise<void> => {
  const user = auth().currentUser;
  if (!user) throw new Error('Not authenticated');

  await firestore().collection('leave_requests').doc(requestId).update({
    status: 'rejected',
    rejectedAt: firestore.FieldValue.serverTimestamp(),
    reviewedBy: user.uid,
    reviewedByName: teacherName,
    rejectionReason: reason,
    signatureAttached: false,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

// ─── Signature ───────────────────────────────────────────────────────────────

/**
 * Get teacher's saved signature (base64) from Firestore.
 * Returns null if not saved.
 */
export const getTeacherSavedSignature = async (uid: string): Promise<string | null> => {
  try {
    const doc = await firestore().collection('users').doc(uid).get();
    return doc.data()?.signature || null;
  } catch {
    return null;
  }
};
