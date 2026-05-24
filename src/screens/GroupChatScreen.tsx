import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
  LogBox,
  TextInput,
  useColorScheme
} from 'react-native';

LogBox.ignoreLogs(['This method is deprecated (as well as all React Native Firebase namespaced API)']);

import { GiftedChat, Bubble, IMessage, Actions, Send } from 'react-native-gifted-chat';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import ReactNativeBlobUtil from 'react-native-blob-util';

const GroupChatScreen = ({ route, navigation }: any) => {
  const { groupId } = route.params;

  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  
  // New State for WhatsApp-like features
  const [inputText, setInputText] = useState('');
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clearedAt, setClearedAt] = useState<number>(0);

  const currentUser = auth().currentUser;

  const theme = isDarkMode ? {
    bg: '#0B141A',
    headerBg: '#1F2C34',
    headerText: '#E9EDEF',
    bubbleRight: '#005C4B',
    bubbleLeft: '#202C33',
    textRight: '#E9EDEF',
    textLeft: '#E9EDEF',
    inputBg: '#1F2C34',
    inputText: '#E9EDEF',
    menuBg: '#233138',
    menuText: '#E9EDEF',
    timestamp: '#8696A0'
  } : {
    bg: '#EFEAE2',
    headerBg: '#075E54',
    headerText: '#FFFFFF',
    bubbleRight: '#D9FDD3',
    bubbleLeft: '#FFFFFF',
    textRight: '#111B21',
    textLeft: '#111B21',
    inputBg: '#FFFFFF',
    inputText: '#111B21',
    menuBg: '#FFFFFF',
    menuText: '#111B21',
    timestamp: '#667781'
  };

  useEffect(() => {
    // Check if current user is the Teacher (creator) of the group
    const checkCreator = async () => {
      const groupDoc = await firestore().collection('groupChats').doc(groupId).get();
      if (groupDoc.data()?.createdBy === currentUser?.uid) {
        setIsCreator(true);
      }
    };
    checkCreator();

    // Fetch when this user last cleared the chat
    const fetchClearedAt = async () => {
      try {
        const doc = await firestore().collection('groupChats').doc(groupId)
          .collection('clearedChats').doc(currentUser?.uid).get();
        if (doc.exists) {
          setClearedAt(doc.data()?.timestamp || 0);
        }
      } catch (e) {}
    };
    fetchClearedAt();

    const unsubscribe = firestore()
      .collection('groupMessages')
      .where('groupId', '==', groupId)
      .onSnapshot(
        snapshot => {
          if (!snapshot) return;

          let data: IMessage[] = snapshot.docs.map(doc => {
            const fbData = doc.data();
            const createdAt = fbData.createdAt?.toDate ? fbData.createdAt.toDate() : new Date();

            // Auto-read receipt logic
            if (fbData.sender !== currentUser?.uid && fbData.seenBy && !fbData.seenBy.includes(currentUser?.uid)) {
              firestore().collection('groupMessages').doc(doc.id).update({
                seenBy: firestore.FieldValue.arrayUnion(currentUser?.uid)
              }).catch(() => {});
            }

            return {
              _id: doc.id,
              text: fbData.text || '',
              createdAt: createdAt,
              user: {
                _id: fbData.sender,
                name: fbData.senderEmail?.split('@')[0] || 'User',
              },
              image: fbData.type === 'image' ? fbData.fileUrl : undefined,
              type: fbData.type,
              fileUrl: fbData.fileUrl,
              fileName: fbData.fileName,
              isEdited: fbData.isEdited || false,
              seenBy: fbData.seenBy || [],
            };
          });

          // Sort messages descending (newest first)
          data.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
          setMessages(data);
        },
        error => {
          console.log("FIRESTORE ERROR:", error);
        }
      );

    return unsubscribe;
  }, [groupId, currentUser]);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    const msg = newMessages[0];
    if (!msg || !currentUser) return;

    if (editingMessage) {
      await firestore().collection('groupMessages').doc(editingMessage._id).update({
        text: msg.text,
        isEdited: true,
      });
      setEditingMessage(null);
      setInputText('');
      return;
    }

    await firestore().collection('groupMessages').add({
      groupId: groupId,
      text: msg.text,
      sender: currentUser.uid,
      senderEmail: currentUser.email,
      type: 'text',
      seenBy: [currentUser.uid],
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    setInputText('');
  }, [groupId, currentUser, editingMessage]);

  const handleUpload = async (uri: string, fileName: string, type: 'image' | 'pdf') => {
    if (!currentUser) return;
    setUploading(true);
    try {
      const reference = storage().ref(`group_chats/${groupId}/${Date.now()}_${fileName}`);
      
      if (Platform.OS === 'android' && uri.startsWith('content://')) {
        const base64Data = await ReactNativeBlobUtil.fs.readFile(uri, 'base64');
        await reference.putString(base64Data, 'base64');
      } else {
        await reference.putFile(uri);
      }
      
      const url = await reference.getDownloadURL();

      await firestore().collection('groupMessages').add({
        groupId: groupId,
        text: '',
        sender: currentUser.uid,
        senderEmail: currentUser.email,
        type: type,
        fileUrl: url,
        fileName: fileName,
        seenBy: [currentUser.uid],
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (e: any) {
      console.log('Upload error:', e);
      Alert.alert('Upload Error', `Details: ${e?.message || e}`);
    } finally {
      setUploading(false);
    }
  };

  const selectFile = async () => {
    try {
      const result = await pick({
        type: [types.pdf, types.images],
        allowMultiSelection: false,
        copyTo: 'cachesDirectory',
      });
      const file = result[0];
      if (file && file.uri && file.name) {
        const fileType = file.type?.includes('image') ? 'image' : 'pdf';
        handleUpload(file.uri, file.name, fileType);
      }
    } catch (err: any) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      Alert.alert('Selection Error', err?.message || 'Failed to select the file.');
    }
  };

  const handleEditMessage = (message: any) => {
    setEditingMessage(message);
    setInputText(message.text);
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await firestore().collection('groupMessages').doc(messageId).delete();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete message.');
    }
  };

  const handleClearChat = async () => {
    Alert.alert('Clear Chat', 'Are you sure you want to clear the chat history for yourself?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        const now = Date.now();
        setClearedAt(now);
        setShowMenu(false);
        try {
          await firestore().collection('groupChats').doc(groupId)
            .collection('clearedChats').doc(currentUser?.uid).set({ timestamp: now });
        } catch (e) {}
      }}
    ]);
  };

  const onLongPress = (context: any, message: any) => {
    const isMyMessage = message.user._id === currentUser?.uid;
    const canDelete = isMyMessage || isCreator;
    const canEdit = isMyMessage && message.type === 'text';

    const buttons: any[] = [{ text: 'Cancel', style: 'cancel' }];
    if (canEdit) buttons.push({ text: 'Edit', onPress: () => handleEditMessage(message) });
    if (canDelete) buttons.push({ text: 'Delete', style: 'destructive', onPress: () => deleteMessage(message._id) });

    if (buttons.length > 1) {
      Alert.alert('Options', 'What would you like to do?', buttons);
    } else {
      Alert.alert('Action Denied', 'You can only edit or delete your own messages.');
    }
  };

  const renderActions = (props: any) => (
    <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 10, marginBottom: 10 }} onPress={selectFile}>
      <Text style={{ fontSize: 24 }}>📎</Text>
    </TouchableOpacity>
  );

  const renderSend = (props: any) => (
    <Send {...props}>
      <View style={styles.sendBtn}>
        <Text style={{ fontSize: 22 }}>🚀</Text>
      </View>
    </Send>
  );

  const renderMessageText = (props: any) => {
    const { currentMessage } = props;
    const isLeft = props.position === 'left';
    
    if (currentMessage.type === 'pdf') {
      return (
        <TouchableOpacity
          style={[styles.pdfContainer, { backgroundColor: isLeft ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.1)' }]}
          onPress={() => Linking.openURL(currentMessage.fileUrl)}
          onLongPress={() => onLongPress(null, currentMessage)}
        >
          <View style={styles.pdfIconBox}>
            <Text style={{ fontSize: 26 }}>📄</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.pdfText, { color: isLeft ? theme.textLeft : theme.textRight }]} numberOfLines={2}>
              {currentMessage.fileName || 'Document.pdf'}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ fontSize: 11, color: isLeft ? '#6B7280' : 'rgba(255,255,255,0.7)' }}>
                PDF Document
              </Text>
              {!isLeft && (
                <Text style={{ fontSize: 12, color: (currentMessage.seenBy && currentMessage.seenBy.length > 1) ? '#3B82F6' : theme.timestamp }}>
                  {(currentMessage.seenBy && currentMessage.seenBy.length > 1) ? '✓✓' : '✓'}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity 
        style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: currentMessage.isEdited ? 4 : 8 }}
        onLongPress={() => onLongPress(null, currentMessage)}
        delayLongPress={250}
      >
        <Text style={{ fontSize: 16, color: isLeft ? theme.textLeft : theme.textRight, lineHeight: 22 }}>
          {currentMessage.text}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 2 }}>
          {currentMessage.isEdited && (
            <Text style={{ fontSize: 10, color: theme.timestamp, fontStyle: 'italic', marginRight: 4 }}>
              Edited
            </Text>
          )}
          {!isLeft && (
            <Text style={{ fontSize: 12, color: (currentMessage.seenBy && currentMessage.seenBy.length > 1) ? '#3B82F6' : theme.timestamp }}>
              {(currentMessage.seenBy && currentMessage.seenBy.length > 1) ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderBubble = (props: any) => (
    <Bubble
      {...props}
      onLongPress={onLongPress}
      wrapperStyle={{
        right: { 
          backgroundColor: theme.bubbleRight, 
          borderTopLeftRadius: 16, 
          borderTopRightRadius: 16, 
          borderBottomLeftRadius: 16, 
          borderBottomRightRadius: 4, 
          marginBottom: 6,
          paddingVertical: 2,
          paddingHorizontal: 2,
          elevation: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 1,
        },
        left: { 
          backgroundColor: theme.bubbleLeft, 
          borderTopLeftRadius: 16, 
          borderTopRightRadius: 16, 
          borderBottomRightRadius: 16, 
          borderBottomLeftRadius: 4, 
          marginBottom: 6,
          paddingVertical: 2,
          paddingHorizontal: 2,
          elevation: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 1,
        },
      }}
      renderMessageText={renderMessageText}
    />
  );

  const displayMessages = messages.filter(m => {
    const msgTime = m.createdAt instanceof Date ? m.createdAt.getTime() : Number(m.createdAt);
    if (msgTime < clearedAt) return false;
    if (isSearching && searchQuery) {
      if (!m.text) return false;
      return m.text.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 30}>
        
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
          {isSearching ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }} style={{ padding: 8 }}>
                <Text style={{ fontSize: 20 }}>⬅️</Text>
              </TouchableOpacity>
              <TextInput
                style={{ flex: 1, backgroundColor: theme.inputBg, color: theme.inputText, borderRadius: 20, paddingHorizontal: 15, marginHorizontal: 10, height: 40 }}
                placeholder="Search messages..."
                placeholderTextColor={theme.timestamp}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
                <Text style={{ fontSize: 20 }}>⬅️</Text>
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={[styles.headerTitle, { color: theme.headerText }]}>Class Group</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setIsSearching(true)} style={{ padding: 10 }}>
                  <Text style={{ fontSize: 18 }}>🔍</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={{ padding: 10 }}>
                  <Text style={{ fontSize: 22, color: theme.headerText }}>⋮</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Absolute Menu */}
        {showMenu && !isSearching && (
          <View style={[styles.menuBox, { backgroundColor: theme.menuBg }]}>
            <TouchableOpacity onPress={() => { setShowMenu(false); navigation.navigate('GroupMembers', { groupId }); }} style={styles.menuItem}>
              <Text style={{ color: theme.menuText, fontSize: 16 }}>Group Info</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearChat} style={styles.menuItem}>
              <Text style={{ color: theme.menuText, fontSize: 16 }}>Clear Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowMenu(false); setIsDarkMode(!isDarkMode); }} style={styles.menuItem}>
              <Text style={{ color: theme.menuText, fontSize: 16 }}>{isDarkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {uploading && (
          <View style={styles.uploadingBar}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.uploadingText}>Uploading file securely...</Text>
          </View>
        )}

        {editingMessage && (
          <View style={[styles.editingBar, { backgroundColor: theme.menuBg }]}>
            <Text style={{ color: theme.menuText, fontStyle: 'italic', flex: 1 }}>Editing Message: {editingMessage.text}</Text>
            <TouchableOpacity onPress={() => { setEditingMessage(null); setInputText(''); }} style={{ marginLeft: 10 }}>
              <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <GiftedChat
            messages={displayMessages}
            // @ts-ignore
            onLongPress={onLongPress}
            onSend={newMessages => onSend(newMessages)}
            user={{ _id: currentUser?.uid || '' }}
            renderBubble={renderBubble}
            renderActions={renderActions}
            renderSend={renderSend}
            renderUsernameOnMessage={true}
            renderAvatarOnTop={true}
            textInputProps={{
              value: inputText,
              onChangeText: setInputText,
              style: { color: theme.inputText, flex: 1, paddingHorizontal: 10, fontSize: 16 },
              placeholderTextColor: theme.timestamp
            }}
          />
        </View>

      </KeyboardAvoidingView>
    </View>
  );
};

export default GroupChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 10,
  },
  headerCenter: { flex: 1, paddingLeft: 10 },
  headerTitle: { fontSize: 19, fontWeight: '700' },
  menuBox: {
    position: 'absolute',
    top: 60,
    right: 10,
    borderRadius: 8,
    paddingVertical: 5,
    minWidth: 150,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 20,
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 15 },
  editingBar: { padding: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  uploadingBar: { backgroundColor: '#3B82F6', padding: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  uploadingText: { color: '#fff', marginLeft: 8, fontWeight: '600', fontSize: 13 },
  sendBtn: { marginBottom: 5, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  pdfContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, width: 250, borderRadius: 12, margin: 5 },
  pdfIconBox: { backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: 10, borderRadius: 10 },
  pdfText: { fontSize: 15, fontWeight: '600' },
});