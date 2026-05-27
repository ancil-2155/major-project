import firestore from '@react-native-firebase/firestore';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { uploadLocalFileToCloudinary } from '../cloudinary/cloudinaryUploadService';
import { CurrentChatUser, GroupAttachmentResourceType, GroupMessage, GroupMessageType } from '../../types/groups';
import { markGroupAsRead } from './groupService';

export type LocalAttachment = {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: 'image' | 'video' | 'document';
};

const normalizeMessage = (
  doc: FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>,
): GroupMessage => {
  const data = doc.data() || {};
  return {
    messageId: String(data.messageId || doc.id),
    groupId: String(data.groupId || ''),
    senderId: String(data.senderId || ''),
    senderName: String(data.senderName || 'User'),
    senderRole:
      data.senderRole === 'teacher' ? 'teacher' : data.senderRole === 'admin' ? 'admin' : 'student',
    senderPhotoUrl: data.senderPhotoUrl ?? null,
    text: String(data.text || ''),
    messageType:
      data.messageType === 'image'
        ? 'image'
        : data.messageType === 'video'
          ? 'video'
          : data.messageType === 'pdf'
            ? 'pdf'
            : data.messageType === 'file'
              ? 'file'
              : 'text',
    attachmentUrl: data.attachmentUrl ?? null,
    attachmentPublicId: data.attachmentPublicId ?? null,
    attachmentResourceType:
      data.attachmentResourceType === 'image'
        ? 'image'
        : data.attachmentResourceType === 'video'
          ? 'video'
          : data.attachmentResourceType === 'raw'
            ? 'raw'
            : null,
    attachmentName: data.attachmentName ?? null,
    attachmentMimeType: data.attachmentMimeType ?? null,
    attachmentSize: typeof data.attachmentSize === 'number' ? data.attachmentSize : null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    deletedAt: data.deletedAt ?? null,
  };
};

const pickMessageTypeForAttachment = (attachment: LocalAttachment): GroupMessageType => {
  if (attachment.kind === 'image') {
    return 'image';
  }
  if (attachment.kind === 'video') {
    return 'video';
  }
  if (attachment.mimeType.toLowerCase().includes('pdf')) {
    return 'pdf';
  }
  return 'file';
};

const preferredResourceType = (attachment: LocalAttachment): GroupAttachmentResourceType => {
  if (attachment.kind === 'image') {
    return 'image';
  }
  if (attachment.kind === 'video') {
    return 'video';
  }
  return 'raw';
};

const updateGroupLastMessage = async (
  groupId: string,
  messageText: string,
  senderId: string,
): Promise<void> => {
  await firestore().collection('classGroups').doc(groupId).set(
    {
      lastMessageText: messageText || 'Attachment',
      lastMessageAt: firestore.FieldValue.serverTimestamp(),
      lastMessageBy: senderId,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
};

export const subscribeGroupMessages = (
  groupId: string,
  userId: string,
  onUpdate: (messages: GroupMessage[]) => void,
  onError?: (error: any) => void,
) => {
  return firestore()
    .collection('classGroups')
    .doc(groupId)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .limitToLast(300)
    .onSnapshot(
      async snapshot => {
        const data = snapshot.docs
          .map(normalizeMessage)
          .filter(message => message.deletedAt === null);
        onUpdate(data);
        try {
          await markGroupAsRead(groupId, userId);
        } catch (error) {
          console.log('markGroupAsRead failed:', error);
        }
      },
      error => {
        if (onError) {
          onError(error);
        }
      },
    );
};

export const sendTextMessage = async (
  groupId: string,
  user: CurrentChatUser,
  text: string,
): Promise<string> => {
  const messageRef = firestore().collection('classGroups').doc(groupId).collection('messages').doc();
  const body = text.trim();
  await messageRef.set({
    messageId: messageRef.id,
    groupId,
    senderId: user.uid,
    senderName: user.name,
    senderRole: user.role,
    senderPhotoUrl: user.photoUrl ?? null,
    text: body,
    messageType: 'text',
    attachmentUrl: null,
    attachmentPublicId: null,
    attachmentResourceType: null,
    attachmentName: null,
    attachmentMimeType: null,
    attachmentSize: null,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
    deletedAt: null,
  });
  await updateGroupLastMessage(groupId, body, user.uid);
  // TODO: trigger push notification for matching group members from backend (FCM server-side).
  return messageRef.id;
};

export const sendAttachmentMessage = async (
  groupId: string,
  user: CurrentChatUser,
  attachment: LocalAttachment,
  text?: string,
): Promise<string> => {
  const cloudinary = await uploadLocalFileToCloudinary(
    {
      uri: attachment.uri,
      name: attachment.name,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
    },
    {
      folder: `acams/groups/${groupId}/messages`,
      preferredResourceType: preferredResourceType(attachment) || 'auto',
      useSignedUpload: false,
    },
  );

  const messageType = pickMessageTypeForAttachment(attachment);
  const messageRef = firestore().collection('classGroups').doc(groupId).collection('messages').doc();
  const textValue = String(text || '').trim();
  await messageRef.set({
    messageId: messageRef.id,
    groupId,
    senderId: user.uid,
    senderName: user.name,
    senderRole: user.role,
    senderPhotoUrl: user.photoUrl ?? null,
    text: textValue,
    messageType,
    attachmentUrl: cloudinary.cloudinarySecureUrl,
    attachmentPublicId: cloudinary.cloudinaryPublicId,
    attachmentResourceType: cloudinary.cloudinaryResourceType,
    attachmentName: attachment.name,
    attachmentMimeType: attachment.mimeType,
    attachmentSize: cloudinary.bytes || attachment.sizeBytes || null,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
    deletedAt: null,
  });

  await updateGroupLastMessage(groupId, textValue || attachment.name, user.uid);
  // TODO: trigger push notification for matching group members from backend (FCM server-side).
  return messageRef.id;
};
