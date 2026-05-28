import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { useAppTheme } from '../../theme/appTheme';
import ChatHeader from '../../components/chat/ChatHeader';
import ChatBubble from '../../components/chat/ChatBubble';
import ChatInputBar from '../../components/chat/ChatInputBar';
import AttachmentPreview from '../../components/chat/AttachmentPreview';
import DateSeparator from '../../components/chat/DateSeparator';
import { ensureGroupMember, getGroupById } from '../../services/groups/groupService';
import {
  LocalAttachment,
  sendAttachmentMessage,
  sendTextMessage,
  subscribeGroupMessages,
} from '../../services/groups/messageService';
import { CurrentChatUser, GroupMessage } from '../../types/groups';

type ListRow = { type: 'date'; key: string; label: string } | { type: 'message'; key: string; message: GroupMessage };

const MAX_DOC_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const formatDateSeparator = (date: Date) => {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (timestamp: any) => {
  if (!timestamp?.toDate) {
    return '';
  }
  try {
    return timestamp.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const GroupChatScreen = ({ route, navigation }: any) => {
  const { groupId } = route.params || {};
  const { colors } = useAppTheme();
  const listRef = useRef<FlatList<ListRow>>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [groupName, setGroupName] = useState('Class Group');
  const [groupSubtitle, setGroupSubtitle] = useState('');
  const [currentUser, setCurrentUser] = useState<CurrentChatUser | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<LocalAttachment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = auth().currentUser?.uid || '';

  const buildRows = useMemo<ListRow[]>(() => {
    const rows: ListRow[] = [];
    let previousDate = '';
    messages.forEach(message => {
      const keyDate = message.createdAt?.toDate
        ? message.createdAt.toDate().toISOString().split('T')[0]
        : 'unknown';
      if (keyDate !== previousDate) {
        previousDate = keyDate;
        const date = message.createdAt?.toDate ? message.createdAt.toDate() : new Date();
        rows.push({
          type: 'date',
          key: `date-${keyDate}-${message.messageId}`,
          label: formatDateSeparator(date),
        });
      }
      rows.push({ type: 'message', key: message.messageId, message });
    });
    return rows;
  }, [messages]);

  const ensureReady = useCallback(async () => {
    if (!groupId) {
      setError('Group not found.');
      setLoading(false);
      return;
    }
    const user = auth().currentUser;
    if (!user) {
      setError('Please login again.');
      setLoading(false);
      return;
    }
    try {
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data() || {};
      const role = String(userData.role || 'student').toLowerCase();
      const chatUser: CurrentChatUser = {
        uid: user.uid,
        name: userData.name || 'User',
        role: role === 'teacher' ? 'teacher' : role === 'admin' ? 'admin' : 'student',
        photoUrl: userData.profilePhotoUrl || userData.localProfilePhotoUri || null,
      };
      setCurrentUser(chatUser);
      await ensureGroupMember(groupId, { uid: chatUser.uid, name: chatUser.name, role: chatUser.role });

      const group = await getGroupById(groupId);
      if (group) {
        setGroupName(group.groupName);
        const subtitleBits = [
          `${group.memberCount} members`,
          group.subject || group.classLevel || group.departmentCode || group.department || '',
        ].filter(Boolean);
        setGroupSubtitle(subtitleBits.join(' • '));
      }
    } catch (err: any) {
      console.error('group chat init error:', err);
      setError('Unable to open this group right now.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    ensureReady();
  }, [ensureReady]);

  useEffect(() => {
    if (!groupId || !currentUserId) {
      return;
    }
    const unsubscribe = subscribeGroupMessages(
      groupId,
      currentUserId,
      items => {
        setMessages(items);
      },
      err => {
        console.error('group message subscribe error:', err);
        setError('Unable to sync messages.');
      },
    );
    return () => unsubscribe();
  }, [groupId, currentUserId]);

  useEffect(() => {
    if (buildRows.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [buildRows.length]);

  const validateAttachmentSize = (size: number, kind: 'document' | 'image' | 'video') => {
    if (kind === 'document' && size > MAX_DOC_BYTES) {
      throw new Error('Document exceeds 50MB limit.');
    }
    if (kind === 'image' && size > MAX_IMAGE_BYTES) {
      throw new Error('Image exceeds 15MB limit.');
    }
    if (kind === 'video' && size > MAX_VIDEO_BYTES) {
      throw new Error('Video exceeds 100MB limit.');
    }
  };

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, response => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert('Attachment Error', response.errorMessage || 'Unable to pick image.');
        return;
      }
      const asset = response.assets?.[0];
      if (!asset?.uri) {
        return;
      }
      const size = Number(asset.fileSize || 0);
      try {
        validateAttachmentSize(size, 'image');
      } catch (validationError: any) {
        Alert.alert('Attachment Error', validationError.message);
        return;
      }
      setAttachment({
        uri: asset.uri,
        name: asset.fileName || 'image.jpg',
        mimeType: asset.type || 'image/jpeg',
        sizeBytes: size,
        kind: 'image',
      });
    });
  };

  const pickVideo = () => {
    launchImageLibrary({ mediaType: 'video', selectionLimit: 1 }, response => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert('Attachment Error', response.errorMessage || 'Unable to pick video.');
        return;
      }
      const asset = response.assets?.[0];
      if (!asset?.uri) {
        return;
      }
      const size = Number(asset.fileSize || 0);
      try {
        validateAttachmentSize(size, 'video');
      } catch (validationError: any) {
        Alert.alert('Attachment Error', validationError.message);
        return;
      }
      setAttachment({
        uri: asset.uri,
        name: asset.fileName || 'video.mp4',
        mimeType: asset.type || 'video/mp4',
        sizeBytes: size,
        kind: 'video',
      });
    });
  };

  const pickDocument = async () => {
    try {
      const files = await pick({
        allowMultiSelection: false,
        copyTo: 'cachesDirectory',
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ],
      });
      const file = files[0];
      const size = Number(file.size || 0);
      validateAttachmentSize(size, 'document');
      setAttachment({
        uri: file.uri,
        name: file.name || 'document',
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: size,
        kind: 'document',
      });
    } catch (pickerError: any) {
      if (isErrorWithCode(pickerError) && pickerError.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      Alert.alert('Attachment Error', pickerError?.message || 'Unable to pick document.');
    }
  };

  const handleAttach = () => {
    Alert.alert('Select Attachment', 'Choose file type', [
      { text: 'Pick Image', onPress: pickImage },
      { text: 'Pick Video', onPress: pickVideo },
      { text: 'Pick Document', onPress: pickDocument },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSend = async () => {
    if (!currentUser || !groupId) {
      return;
    }
    if (!text.trim() && !attachment) {
      return;
    }

    setSending(true);
    try {
      if (attachment) {
        await sendAttachmentMessage(groupId, currentUser, attachment, text);
      } else {
        await sendTextMessage(groupId, currentUser, text);
      }
      setText('');
      setAttachment(null);
      setError(null);
    } catch (err: any) {
      console.error('send message error:', err);
      setError('Message upload failed. Please try again.');
      Alert.alert('Send Failed', 'Unable to send this message right now.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colors.background === '#070A12' ? 'light-content' : 'dark-content'} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#070A12' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ChatHeader 
          title={groupName} 
          subtitle={groupSubtitle} 
          onBack={() => navigation.goBack()}
          onGroupInfo={() => navigation.navigate('GroupInfo', { groupId })}
        />

        {error ? (
          <View style={[styles.errorWrap, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
            <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={buildRows}
          keyExtractor={item => item.key}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            if (item.type === 'date') {
              return <DateSeparator label={item.label} />;
            }
            const message = item.message;
            const isOwn = message.senderId === currentUserId;
            return (
              <ChatBubble
                message={message}
                isOwn={isOwn}
                showSenderName={!isOwn}
                timeLabel={formatTime(message.createdAt)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={{ color: colors.textSecondary }}>No messages yet. Start the conversation.</Text>
            </View>
          }
        />

        {attachment ? (
          <View style={styles.attachmentWrap}>
            <AttachmentPreview
              fileName={attachment.name}
              mimeType={attachment.mimeType}
              sizeBytes={attachment.sizeBytes}
              uri={attachment.uri}
              kind={attachment.kind}
              onRemove={() => setAttachment(null)}
            />
          </View>
        ) : null}

        <ChatInputBar
          value={text}
          onChangeText={setText}
          onPressAttach={handleAttach}
          onPressSend={handleSend}
          disabled={sending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { paddingTop: 10, paddingBottom: 8 },
  emptyWrap: { alignItems: 'center', marginTop: 40 },
  attachmentWrap: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  errorWrap: {
    marginHorizontal: 10,
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});

export default GroupChatScreen;
