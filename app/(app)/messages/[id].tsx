import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Image,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { ExpensifyTextInput } from '@/components/ui';
import { StyleSheet } from 'react-native';

type Message = {
  id: string;
  text: string;
  isSent: boolean;
  timestamp: string;
};

const DUMMY_MESSAGES: Message[] = [
  { id: '1', text: 'Xin chào! Bạn có thể giúp tôi không?', isSent: false, timestamp: '09:00' },
  { id: '2', text: 'Chào bạn, tôi có thể giúp gì cho bạn?', isSent: true, timestamp: '09:02' },
  { id: '3', text: 'Tôi cần hỗ trợ về vấn đề sửa chữa điện nước trong nhà.', isSent: false, timestamp: '09:03' },
  { id: '4', text: 'Được rồi, tôi có thể đến vào chiều nay lúc 3 giờ được không?', isSent: true, timestamp: '09:05' },
  { id: '5', text: 'Tuyệt vời, cảm ơn bạn nhiều!', isSent: false, timestamp: '09:06' },
  { id: '6', text: 'Không có gì, hẹn gặp bạn chiều nay.', isSent: true, timestamp: '09:07' },
];

export default function ChatRoomScreen() {
  const theme = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [inputText, setInputText] = useState('');

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
  };

  const handleSubmit = (e: any) => {
    handleSend();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.appBG }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.appBG,
        }}
      >
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            {
              padding: 8,
              marginRight: 8,
              borderRadius: 8,
            },
            pressed && { backgroundColor: theme.highlightBG },
          ]}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600' }}>
            {id === '1' ? 'Nguyen Van A' : id === '3' ? 'Le Van C' : id === '5' ? 'Hoang Van E' : `User ${id}`}
          </Text>
        </View>
      </View>

      {/* Chat Messages */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {DUMMY_MESSAGES.map((message) => (
          <View
            key={message.id}
            style={{
              flexDirection: 'row',
              justifyContent: message.isSent ? 'flex-end' : 'flex-start',
            }}
          >
            <View
              style={{
                maxWidth: '80%',
                backgroundColor: message.isSent ? theme.primary : theme.componentBG,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 16,
                borderTopLeftRadius: !message.isSent ? 4 : 16,
                borderTopRightRadius: message.isSent ? 4 : 16,
              }}
            >
              <Text
                style={{
                  color: message.isSent ? theme.textLight : theme.text,
                  fontSize: 16,
                  lineHeight: 22,
                }}
              >
                {message.text}
              </Text>
              <Text
                style={{
                  color: message.isSent ? theme.textLight : theme.textSupporting,
                  fontSize: 11,
                  marginTop: 4,
                  textAlign: message.isSent ? 'right' : 'left',
                }}
              >
                {message.timestamp}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input Bar - Expensify Composer Layout */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          padding: 12,
          backgroundColor: theme.appBG,
          // Expensify-style background: subtle pattern or image
          // For now, we'll use a slight elevation and border
          borderTopWidth: 1,
          borderTopColor: theme.border,
          gap: 8,
        }}
      >
        {/* Left: Circular + Button */}
        <Pressable
          onPress={() => {
            // TODO: Add attachments/media functionality
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.componentBG,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <MaterialIcons name="add" size={24} color={theme.text} />
        </Pressable>

        {/* Middle: TextInput with focus state */}
        <ExpensifyTextInput
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSubmit}
          returnKeyType="send"
          disableFloatingLabel
          height={48}
          style={{
            flex: 1,
          }}
        />

        {/* Right: Emoji and Send Buttons */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {/* Emoji Button */}
          <Pressable
            onPress={() => {
              // TODO: Add emoji picker functionality
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.componentBG,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MaterialIcons name="insert-emoticon" size={20} color={theme.textSupporting} />
          </Pressable>

          {/* Send Button */}
          <Pressable
            onPress={handleSend}
            style={({ pressed }) => [
              {
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: inputText.trim() ? theme.primary : theme.componentBG,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: inputText.trim() ? 1 : 0.5,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <MaterialIcons
              name="send"
              size={20}
              color={inputText.trim() ? theme.textLight : theme.textSupporting}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}