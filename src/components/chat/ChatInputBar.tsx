import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/appTheme';

type ChatInputBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onPressAttach: () => void;
  onPressSend: () => void;
  disabled?: boolean;
};

const ChatInputBar: React.FC<ChatInputBarProps> = ({
  value,
  onChangeText,
  onPressAttach,
  onPressSend,
  disabled,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
      <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
        <TouchableOpacity onPress={onPressAttach} style={styles.iconButton} disabled={disabled}>
          <Icon name="attach-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Type a message"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={1000}
          style={[styles.input, { color: colors.text }]}
        />
      </View>
      <TouchableOpacity
        onPress={onPressSend}
        disabled={disabled}
        style={[styles.sendButton, { backgroundColor: disabled ? colors.muted : colors.primary }]}
      >
        <Icon name="send" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    paddingRight: 8,
    maxHeight: 120,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default ChatInputBar;

