import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { RequestCard } from '@/features/support/components/RequestCard';
import { SupportRequest, SupportStatus, UrgencyLevel, SupportCategory } from '@/features/support/types/support.types';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';

const DUMMY_REQUESTS: SupportRequest[] = [
  {
    id: '1',
    title: 'Need food supplies for family of 5',
    description: 'Our family has been affected by the recent floods and we need emergency food supplies including rice, canned goods, and clean water for the next week.',
    location: 'District 1, Ho Chi Minh City',
    urgency: UrgencyLevel.HIGH,
    status: SupportStatus.PENDING,
    category: SupportCategory.FOOD,
    createdAt: '2026-05-07T10:00:00Z',
    updatedAt: '2026-05-07T10:00:00Z',
  },
  {
    id: '2',
    title: 'Medical assistance for elderly neighbor',
    description: 'My elderly neighbor needs help getting to medical appointments and picking up prescriptions.',
    location: 'District 3, Ho Chi Minh City',
    urgency: UrgencyLevel.MEDIUM,
    status: SupportStatus.APPROVED,
    category: SupportCategory.MEDICAL,
    createdAt: '2026-05-06T14:30:00Z',
    updatedAt: '2026-05-07T09:00:00Z',
  },
  {
    id: '3',
    title: 'Temporary shelter needed',
    description: 'Looking for temporary shelter for 2 adults and 1 child after apartment fire.',
    location: 'District 7, Ho Chi Minh City',
    urgency: UrgencyLevel.HIGH,
    status: SupportStatus.IN_PROGRESS,
    category: SupportCategory.SHELTER,
    createdAt: '2026-05-05T08:15:00Z',
    updatedAt: '2026-05-06T16:45:00Z',
  },
  {
    id: '4',
    title: 'School supplies for 10 students',
    description: 'Requesting notebooks, pens, and textbooks for underprivileged students in our community.',
    location: 'District 5, Ho Chi Minh City',
    urgency: UrgencyLevel.LOW,
    status: SupportStatus.FULFILLED,
    category: SupportCategory.EDUCATION,
    createdAt: '2026-05-04T11:20:00Z',
    updatedAt: '2026-05-07T08:30:00Z',
  },
  {
    id: '5',
    title: 'Transportation to evacuation center',
    description: 'Need help transporting 5 elderly residents to the nearest evacuation center.',
    location: 'District 12, Ho Chi Minh City',
    urgency: UrgencyLevel.MEDIUM,
    status: SupportStatus.PENDING,
    category: SupportCategory.TRANSPORT,
    createdAt: '2026-05-07T12:00:00Z',
    updatedAt: '2026-05-07T12:00:00Z',
  },
];

export default function HomeScreen() {
  const theme = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();

  const handleRequestPress = (request: SupportRequest) => {
    router.push(`/(app)/request/${request.id}`);
  };

  const handleCreatePress = () => {
    router.push('/(app)/create-request');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      <FlatList
        data={DUMMY_REQUESTS}
        renderItem={({ item }) => (
          <RequestCard request={item} onPress={handleRequestPress} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={localStyles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        style={({ pressed }) => [
          localStyles.fab,
          {
            backgroundColor: theme.primary,
            opacity: pressed ? 0.9 : 1,
            shadowColor: theme.inverse,
          },
        ]}
        onPress={handleCreatePress}
      >
        <Text style={[localStyles.fabIcon, { color: theme.textLight }]}>+</Text>
      </Pressable>
    </View>
  );
}

const localStyles = StyleSheet.create({
  listContent: {
    paddingTop: 16,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
