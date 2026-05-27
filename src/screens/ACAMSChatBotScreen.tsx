import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  askOpenRouter,
  DEFAULT_OPENROUTER_MODEL,
  OpenRouterMessage,
} from '../services/ai/openRouterService';

const API_KEY_STORAGE_KEY = 'acams_openrouter_api_key';
const MODEL_STORAGE_KEY = 'acams_openrouter_model';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const systemPrompt: OpenRouterMessage = {
  role: 'system',
  content:
    'You are ACAMS Assistant, a helpful chatbot inside the ACAMS academic app. Help students and teachers with attendance, leave requests, bonafide requests, assignments, resources, results, event gallery, and general academic workflow questions. Keep answers short, clear, and practical. Do not claim to access Firebase or private user data unless the user provides it in the chat.',
};

const starterMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Hi, I am ACAMS Assistant. Ask me about attendance, leave requests, bonafide certificates, assignments, resources, results, or app help.',
  },
];

const ACAMSChatBotScreen = () => {
  const [apiKey, setApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_OPENROUTER_MODEL);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const storedKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
      const storedModel = await AsyncStorage.getItem(MODEL_STORAGE_KEY);

      if (storedKey) {
        setSavedApiKey(storedKey);
        setApiKey(storedKey);
      }
      if (storedModel) {
        setModel(storedModel);
      }
    };

    loadSettings();
  }, []);

  const saveApiKey = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      Alert.alert('OpenRouter API Key', 'Enter your OpenRouter API key first.');
      return;
    }

    await AsyncStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
    await AsyncStorage.setItem(MODEL_STORAGE_KEY, model.trim() || DEFAULT_OPENROUTER_MODEL);
    setSavedApiKey(trimmedKey);
    Alert.alert('Saved', 'OpenRouter API key saved on this device.');
  };

  const clearApiKey = async () => {
    await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
    setSavedApiKey('');
    setApiKey('');
    Alert.alert('Removed', 'OpenRouter API key removed from this device.');
  };

  const sendMessage = async () => {
    const text = input.trim();
    const key = savedApiKey || apiKey.trim();

    if (!key) {
      Alert.alert('OpenRouter API Key', 'Save your OpenRouter API key before chatting.');
      return;
    }

    if (!text || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: text,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const openRouterMessages: OpenRouterMessage[] = [
        systemPrompt,
        ...nextMessages
          .filter(message => message.id !== 'welcome')
          .slice(-12)
          .map(message => ({
            role: message.role,
            content: message.content,
          })),
      ];

      const reply = await askOpenRouter(
        key,
        openRouterMessages,
        model.trim() || DEFAULT_OPENROUTER_MODEL,
      );

      setMessages(current => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: reply,
        },
      ]);
    } catch (error: any) {
      Alert.alert('Chatbot Error', error.message || 'Failed to contact OpenRouter.');
      setMessages(current => [
        ...current,
        {
          id: `${Date.now()}-assistant-error`,
          role: 'assistant',
          content:
            'I could not connect to OpenRouter. Check your API key, internet connection, and selected model.',
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>ACAMS Assistant</Text>
        <Text style={styles.subtitle}>OpenRouter free model chatbot</Text>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.label}>OpenRouter API Key</Text>
        <TextInput
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="sk-or-v1-..."
          placeholderTextColor="#94A3B8"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Model</Text>
        <TextInput
          value={model}
          onChangeText={setModel}
          placeholder={DEFAULT_OPENROUTER_MODEL}
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          style={styles.input}
        />

        <View style={styles.keyActions}>
          <TouchableOpacity style={styles.saveButton} onPress={saveApiKey}>
            <Text style={styles.saveButtonText}>{savedApiKey ? 'Update Key' : 'Save Key'}</Text>
          </TouchableOpacity>
          {savedApiKey ? (
            <TouchableOpacity style={styles.clearButton} onPress={clearApiKey}>
              <Text style={styles.clearButtonText}>Remove</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask ACAMS Assistant..."
          placeholderTextColor="#94A3B8"
          style={styles.composerInput}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ACAMSChatBotScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: '#E0E7FF',
    fontSize: 13,
    marginTop: 4,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
  },
  label: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    marginBottom: 10,
  },
  keyActions: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  clearButton: {
    paddingHorizontal: 18,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#DC2626',
    fontWeight: '900',
  },
  chatList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  messageBubble: {
    maxWidth: '86%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#111827',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendButton: {
    width: 70,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
