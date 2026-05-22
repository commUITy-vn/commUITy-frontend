import React from 'react';
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
import { useConversations } from '@/features/communication/hooks/useConversations';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';

export default function GroupDetailsScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { data: conversations, isLoading } = useConversations();

  // Find this conversation
  const conversation = React.useMemo(() => {
    return (conversations as any)?.find((c: any) => c.id === id);
  }, [conversations, id]);

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleMemberPress = async (memberId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/profile/[userId]', params: { userId: memberId } } as any);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <MaterialIcons name="error-outline" size={48} color={theme.textSupporting} style={{ marginBottom: 12 }} />
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Group not found</Text>
        <Pressable
          onPress={handleBack}
          style={{ backgroundColor: theme.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 }}
        >
          <Text style={{ color: theme.textLight, fontWeight: '600' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const groupName = conversation.name || 'Group Chat';
  const groupLetter = groupName.charAt(0).toUpperCase();
  const members = conversation.members || [];

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
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>Group details</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 32,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Avatar & Info */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.highlightBG,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: theme.primary,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: theme.primary, fontSize: 32, fontWeight: '700' }}>
              {groupLetter}
            </Text>
          </View>
          <Text
            style={{
              color: theme.text,
              fontSize: 20,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            {groupName}
          </Text>
          <Text
            style={{
              color: theme.textSupporting,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            {members.length} members
          </Text>
        </View>

        {/* Group Description/Settings */}
        <View
          style={{
            backgroundColor: theme.componentBG,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text style={{ color: theme.textSupporting, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            Description
          </Text>
          <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20 }}>
            {conversation.description || 'Welcome to the group conversation! Use this chat to coordinate and discuss help requests, community funds, or locations.'}
          </Text>
        </View>

        {/* Members List Header */}
        <Text
          style={{
            color: theme.textSupporting,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 12,
            paddingLeft: 4,
            fontWeight: '600',
          }}
        >
          Members ({members.length})
        </Text>

        {/* Members List */}
        <View
          style={{
            backgroundColor: theme.componentBG,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: 'hidden',
          }}
        >
          {members.map((member: any, index: number) => {
            const isMe = member.userId === currentUser?.id;
            const displayName = member.fullName || 'Group Member';
            const initial = displayName.charAt(0).toUpperCase();

            return (
              <Pressable
                key={member.userId}
                onPress={() => handleMemberPress(member.userId)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: pressed ? theme.highlightBG : 'transparent',
                  borderBottomWidth: index < members.length - 1 ? 1 : 0,
                  borderBottomColor: theme.border,
                  gap: 12,
                })}
              >
                {/* Member Avatar */}
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: theme.highlightBG,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>
                    {initial}
                  </Text>
                </View>

                {/* Member Details */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>
                    {displayName} {isMe && '(You)'}
                  </Text>
                  <Text style={{ color: theme.textSupporting, fontSize: 12, marginTop: 1 }}>
                    {member.role === 'ADMIN' ? 'Admin' : 'Member'}
                  </Text>
                </View>

                <MaterialIcons name="chevron-right" size={18} color={theme.textSupporting} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
