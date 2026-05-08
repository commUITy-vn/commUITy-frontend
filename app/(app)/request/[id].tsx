import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import { SupportRequest, SupportStatus, UrgencyLevel, SupportCategory, STATUS_LABELS, URGENCY_LABELS, CATEGORY_LABELS } from '@/features/support/types/support.types';

const DUMMY_REQUESTS: SupportRequest[] = [
  {
    id: '1',
    title: 'Need food supplies for family of 5',
    description: 'Our family has been affected by the recent floods and we need emergency food supplies including rice, canned goods, and clean water for the next week. We have 2 adults and 3 children under 12 who need assistance immediately.',
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
    description: 'My elderly neighbor needs help getting to medical appointments and picking up prescriptions. He is 78 years old and has mobility issues after a recent surgery.',
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
    description: 'Looking for temporary shelter for 2 adults and 1 child after apartment fire. We lost everything in the fire and need a place to stay for at least 2 weeks while we find permanent housing.',
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
    description: 'Requesting notebooks, pens, and textbooks for underprivileged students in our community. These supplies will help them continue their education without interruption.',
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
    description: 'Need help transporting 5 elderly residents to the nearest evacuation center. They have limited mobility and cannot use public transportation.',
    location: 'District 12, Ho Chi Minh City',
    urgency: UrgencyLevel.MEDIUM,
    status: SupportStatus.PENDING,
    category: SupportCategory.TRANSPORT,
    createdAt: '2026-05-07T12:00:00Z',
    updatedAt: '2026-05-07T12:00:00Z',
  },
];

const STATUS_COLORS = {
  [SupportStatus.PENDING]: 'warning',
  [SupportStatus.APPROVED]: 'success',
  [SupportStatus.IN_PROGRESS]: 'primary',
  [SupportStatus.FULFILLED]: 'success',
  [SupportStatus.REJECTED]: 'danger',
  [SupportStatus.CANCELLED]: 'textSupporting',
} as const;

const URGENCY_COLORS = {
  [UrgencyLevel.HIGH]: 'danger',
  [UrgencyLevel.MEDIUM]: 'warning',
  [UrgencyLevel.LOW]: 'success',
} as const;

export default function RequestDetailScreen() {
  const theme = useTheme();
  const styles = useThemeStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const request = DUMMY_REQUESTS.find((r) => r.id === id);

  if (!request) {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text, fontSize: 18 }}>Request not found</Text>
      </View>
    );
  }

  const handleHelpPress = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Implement volunteer API call
    console.log('Volunteering for request:', request.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      <ScrollView contentContainerStyle={localStyles.scrollContent}>
        <View style={[localStyles.card, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
          <Text style={[localStyles.title, { color: theme.text }]}>{request.title}</Text>

          <View style={localStyles.badgeContainer}>
            <View style={[localStyles.badge, { backgroundColor: theme[URGENCY_COLORS[request.urgency]] }]}>
              <Text style={[localStyles.badgeText, { color: theme.textLight }]}>
                {URGENCY_LABELS[request.urgency]} Urgency
              </Text>
            </View>
            <View style={[localStyles.badge, { backgroundColor: theme[STATUS_COLORS[request.status]] }]}>
              <Text style={[localStyles.badgeText, { color: theme.textLight }]}>
                {STATUS_LABELS[request.status]}
              </Text>
            </View>
          </View>

          <View style={[localStyles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[localStyles.detailLabel, { color: theme.textSupporting }]}>Category</Text>
            <Text style={[localStyles.detailValue, { color: theme.text }]}>
              {CATEGORY_LABELS[request.category]}
            </Text>
          </View>

          <View style={[localStyles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[localStyles.detailLabel, { color: theme.textSupporting }]}>Location</Text>
            <Text style={[localStyles.detailValue, { color: theme.text }]}>{request.location}</Text>
          </View>

          <View style={[localStyles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[localStyles.detailLabel, { color: theme.textSupporting }]}>Created</Text>
            <Text style={[localStyles.detailValue, { color: theme.text }]}>
              {formatDate(request.createdAt)}
            </Text>
          </View>

          <Text style={[localStyles.sectionTitle, { color: theme.text }]}>Description</Text>
          <Text style={[localStyles.description, { color: theme.textSupporting }]}>
            {request.description}
          </Text>
        </View>
      </ScrollView>

      <View style={localStyles.footer}>
        <Pressable
          style={({ pressed }) => [
            localStyles.helpButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.9 : 1,
              shadowColor: theme.inverse,
            },
          ]}
          onPress={handleHelpPress}
        >
          <Text style={[localStyles.helpButtonText, { color: theme.textLight }]}>
            I Want to Help
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'transparent',
  },
  helpButton: {
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  helpButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
