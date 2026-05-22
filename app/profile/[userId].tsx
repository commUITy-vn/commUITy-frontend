import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '@/lib/api-client';
import { createPrivateConversation } from '@/features/communication/api/create-private-conversation';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      try {
        const res: any = await api.get(`/api/v1/users/${userId}`);
        if (active) {
          setProfileUser(res);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch user profile details:', err);
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchUser();
    return () => {
      active = false;
    };
  }, [userId]);

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleStartChat = async () => {
    if (chatLoading) return;
    setChatLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res: any = await createPrivateConversation({ recipientId: userId });
      if (res && res.id) {
        router.push({ pathname: '/messages/[id]', params: { id: res.id } } as any);
      } else {
        router.push('/(app)/messages' as any);
      }
    } catch (err) {
      console.error('Failed to create or navigate to private conversation:', err);
      // Fallback
      router.push('/(app)/messages' as any);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const fullName = profileUser?.fullName || 'Community Member';
  const avatarLetter = fullName.charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: theme.appBG }}>
      {/* ─── Header ─── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.appBG,
          zIndex: 10,
        }}
      >
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => ({
            padding: 8,
            borderRadius: 8,
            backgroundColor: pressed ? theme.highlightBG : 'transparent',
            marginRight: 8,
          })}
        >
          <MaterialIcons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>Details</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 32,
          paddingBottom: 40,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Avatar */}
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: theme.highlightBG,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 3,
            borderColor: theme.primary,
            marginBottom: 20,
            shadowColor: theme.inverse,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text style={{ color: theme.primary, fontSize: 38, fontWeight: '700' }}>
            {avatarLetter}
          </Text>
        </View>

        {/* User Name & Subtitle */}
        <Text
          style={{
            color: theme.text,
            fontSize: 22,
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          {fullName}
        </Text>
        <Text
          style={{
            color: theme.textSupporting,
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          {profileUser?.role === 'ADMIN' ? 'Administrator' : 'Community Member'}
        </Text>

        {/* Primary Message Action Button */}
        <Pressable
          onPress={handleStartChat}
          disabled={chatLoading}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? theme.primaryPressed : theme.primary,
            borderRadius: 24,
            paddingVertical: 12,
            paddingHorizontal: 32,
            width: '100%',
            maxWidth: 280,
            marginBottom: 32,
            gap: 8,
            shadowColor: theme.inverse,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
            opacity: chatLoading ? 0.8 : 1,
          })}
        >
          {chatLoading ? (
            <ActivityIndicator size="small" color={theme.textLight} />
          ) : (
            <>
              <MaterialIcons name="chat" size={18} color={theme.textLight} />
              <Text style={{ color: theme.textLight, fontSize: 15, fontWeight: '700' }}>Message</Text>
            </>
          )}
        </Pressable>

        {/* Profile Info Fields (Matches Expensify's details lists) */}
        <View
          style={{
            width: '100%',
            backgroundColor: theme.componentBG,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            gap: 16,
          }}
        >
          {/* Email */}
          <View>
            <Text style={{ color: theme.textSupporting, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Email Address
            </Text>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>
              {profileUser?.email || 'Not provided'}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: theme.border }} />

          {/* Status */}
          <View>
            <Text style={{ color: theme.textSupporting, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Status
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.success }} />
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>
                Active now
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: theme.border }} />

          {/* Role */}
          <View>
            <Text style={{ color: theme.textSupporting, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Role
            </Text>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>
              {profileUser?.role || 'USER'}
            </Text>
          </View>

          {profileUser?.createdAt && (
            <>
              <View style={{ height: 1, backgroundColor: theme.border }} />
              {/* Join Date */}
              <View>
                <Text style={{ color: theme.textSupporting, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Member Since
                </Text>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>
                  {new Date(profileUser.createdAt).toLocaleDateString([], {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
