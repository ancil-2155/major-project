import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type GroupEducationLevel = 'school' | 'btech' | 'college';
export type GroupType = 'class' | 'subject' | 'private';
export type GroupStatus = 'active' | 'archived' | 'deleted';
export type GroupMemberRole = 'student' | 'teacher' | 'admin';
export type GroupMessageType = 'text' | 'image' | 'video' | 'file' | 'pdf';
export type GroupAttachmentResourceType = 'image' | 'video' | 'raw' | null;

export interface ClassGroup {
  groupId: string;
  groupName: string;
  description: string | null;

  createdBy: string;
  createdByName: string;
  createdByRole: 'teacher' | 'admin';

  educationLevel: GroupEducationLevel;
  departmentCode: string | null;
  department: string | null;
  yearNumber: number | null;
  semesterNumber: number | null;
  classLevel: string | null;
  subject: string | null;

  groupType: GroupType;
  status: GroupStatus;

  lastMessageText: string | null;
  lastMessageAt: FirebaseFirestoreTypes.Timestamp | null;
  lastMessageBy: string | null;

  memberCount: number;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface GroupMessage {
  messageId: string;
  groupId: string;

  senderId: string;
  senderName: string;
  senderRole: GroupMemberRole;
  senderPhotoUrl: string | null;

  text: string;
  messageType: GroupMessageType;

  attachmentUrl: string | null;
  attachmentPublicId: string | null;
  attachmentResourceType: GroupAttachmentResourceType;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  attachmentSize: number | null;

  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
  deletedAt: FirebaseFirestoreTypes.Timestamp | null;
}

export interface GroupMember {
  userId: string;
  userName: string;
  role: GroupMemberRole;
  joinedAt: FirebaseFirestoreTypes.Timestamp;
  muted: boolean;
  lastReadAt?: FirebaseFirestoreTypes.Timestamp | null;
}

export interface CreateGroupInput {
  groupName: string;
  description?: string | null;
  createdBy: string;
  createdByName: string;
  createdByRole: 'teacher' | 'admin';
  educationLevel: GroupEducationLevel;
  departmentCode?: string | null;
  department?: string | null;
  yearNumber?: number | null;
  semesterNumber?: number | null;
  classLevel?: string | null;
  subject?: string | null;
  groupType: GroupType;
  status?: GroupStatus;
}

export interface CurrentChatUser {
  uid: string;
  name: string;
  role: GroupMemberRole;
  photoUrl?: string | null;
}

export interface StudentAcademicProfile {
  educationLevel?: string | null;
  departmentCode?: string | null;
  department?: string | null;
  yearNumber?: number | null;
  year?: string | null;
  semesterNumber?: number | null;
  semester?: string | null;
  classLevel?: string | null;
}

export interface GroupListItem extends ClassGroup {
  unreadCount?: number;
}

