import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { useChat } from '@/features/communication/hooks/useChat';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { TextInput } from '@/components/ui';

export default function ChatRoomScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const { messages, isLoading, sendMessage } = useChat(id as string);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const textToSend = inputText;
    setInputText('');
    try {
      await sendMessage(textToSend);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.appBG }}>
      {/* Header back button + title */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
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
              borderRadius: 8,
            },
            pressed && { backgroundColor: theme.highlightBG },
          ]}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text
          style={{
            color: theme.text,
            fontSize: 17,
            fontWeight: '600',
          }}
        >
          Messages
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Chat Messages */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: theme.textSupporting }}>No messages yet. Send a message to start the conversation!</Text>
            </View>
          ) : (
            messages.map((message: any) => {
              const isSent = message.senderId === user?.id;
              const formattedTime = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <View
                  key={message.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: isSent ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View
                    style={{
                      maxWidth: '80%',
                      backgroundColor: isSent ? theme.primary : theme.componentBG,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 16,
                      borderTopLeftRadius: !isSent ? 4 : 16,
                      borderTopRightRadius: isSent ? 4 : 16,
                    }}
                  >
                    <Text
                      style={{
                        color: isSent ? theme.textLight : theme.text,
                        fontSize: 16,
                        lineHeight: 22,
                      }}
                    >
                      {message.content}
                    </Text>
                    <Text
                      style={{
                        color: isSent ? theme.textLight : theme.textSupporting,
                        fontSize: 11,
                        marginTop: 4,
                        textAlign: isSent ? 'right' : 'left',
                      }}
                    >
                      {formattedTime}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Input Bar - Expensify Composer Layout */}
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: theme.appBG,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            borderWidth: 1,
            borderColor: theme.bordersBold,
            borderRadius: 12,
            backgroundColor: theme.componentBG,
            padding: 4,
          }}
        >
          {/* Half-circular "+" attachment button integrated on the left inside the box */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={{
              width: 36,
              height: 36,
              borderTopLeftRadius: 18,
              borderBottomLeftRadius: 18,
              borderTopRightRadius: 4,
              borderBottomRightRadius: 4,
              backgroundColor: theme.highlightBG,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 6,
              marginBottom: 2,
            }}
          >
            <MaterialIcons name="add" size={20} color={theme.text} />
          </Pressable>

          {/* Borderless text input inside the box */}
          <TextInput
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            disableFloatingLabel={true}
            borderless={true}
            height={40}
            containerStyle={{ flex: 1, marginBottom: 0, marginTop: 2 }}
            style={{
              fontSize: 16,
              color: theme.text,
              paddingVertical: 8,
            }}
          />

          {/* Right actions inside the box */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 6, marginBottom: 4 }}>
            {/* Emoji Button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MaterialIcons name="insert-emoticon" size={22} color={theme.textSupporting} />
            </Pressable>

            {/* Send Button: only highlighted circle after input appears */}
            {inputText.trim().length > 0 && (
              <Pressable
                onPress={handleSend}
                style={({ pressed }) => [
                  {
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: theme.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <MaterialIcons
                  name="send"
                  size={16}
                  color="#fff"
                />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}