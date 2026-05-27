import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { GroupMessage } from '../../types/groups';
import { useAppTheme } from '../../theme/appTheme';

type ChatBubbleProps = {
  message: GroupMessage;
  isOwn: boolean;
  showSenderName: boolean;
  timeLabel: string;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isOwn, showSenderName, timeLabel }) => {
  const { colors } = useAppTheme();
  const bubbleColor = isOwn ? colors.primary : colors.surface;
  const textColor = isOwn ? '#FFFFFF' : colors.text;
  const subtitleColor = isOwn ? 'rgba(255,255,255,0.85)' : colors.textSecondary;
  const hasAttachment = !!message.attachmentUrl;

  const renderAttachment = () => {
    if (!hasAttachment) {
      return null;
    }

    if (message.attachmentResourceType === 'image' && message.attachmentUrl) {
      return <Image source={{ uri: message.attachmentUrl }} style={styles.imageAttachment} resizeMode="cover" />;
    }

    return (
      <View style={[styles.fileBox, { backgroundColor: isOwn ? 'rgba(255,255,255,0.16)' : colors.cardAlt }]}>
        <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
          {message.attachmentName || 'Attachment'}
        </Text>
        <Text style={[styles.fileMeta, { color: subtitleColor }]} numberOfLines={1}>
          {message.attachmentMimeType || 'file'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.row, isOwn ? styles.rowRight : styles.rowLeft]}>
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleRight : styles.bubbleLeft,
          {
            backgroundColor: bubbleColor,
            borderColor: isOwn ? bubbleColor : colors.border,
          },
        ]}
      >
        {showSenderName && !isOwn ? (
          <Text style={[styles.sender, { color: colors.accent }]} numberOfLines={1}>
            {message.senderName}
          </Text>
        ) : null}
        {renderAttachment()}
        {message.text ? (
          <Text style={[styles.messageText, { color: textColor }]}>{message.text}</Text>
        ) : null}
        <Text style={[styles.timeText, { color: subtitleColor }]}>{timeLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginBottom: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },
  bubbleLeft: {
    borderTopLeftRadius: 6,
  },
  bubbleRight: {
    borderTopRightRadius: 6,
  },
  sender: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeText: {
    marginTop: 4,
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  imageAttachment: {
    width: 220,
    maxWidth: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 8,
  },
  fileBox: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
  },
  fileMeta: {
    fontSize: 11,
    marginTop: 2,
  },
});

export default ChatBubble;
