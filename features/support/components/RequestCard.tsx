import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { SupportRequest, SupportStatus, UrgencyLevel, STATUS_LABELS, URGENCY_LABELS } from '@/features/support/types/support.types';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

interface RequestCardProps {
  request: SupportRequest;
  onPress?: (request: SupportRequest) => void;
}

const URGENCY_COLORS = {
  [UrgencyLevel.HIGH]: 'danger',
  [UrgencyLevel.MEDIUM]: 'warning',
  [UrgencyLevel.LOW]: 'success',
} as const;

const STATUS_COLORS = {
  [SupportStatus.PENDING]: 'warning',
  [SupportStatus.APPROVED]: 'success',
  [SupportStatus.IN_PROGRESS]: 'primary',
  [SupportStatus.FULFILLED]: 'success',
  [SupportStatus.REJECTED]: 'danger',
  [SupportStatus.CANCELLED]: 'textSupporting',
} as const;

export const RequestCard = ({ request, onPress }: RequestCardProps) => {
  const theme = useTheme();

  const handlePress = async () => {
    await impactAsync(ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress(request);
    }
  };

  const descriptionPreview = request.description.length > 100
    ? `${request.description.substring(0, 100)}...`
    : request.description;

  const urgencyColorKey = URGENCY_COLORS[request.urgency];
  const statusColorKey = STATUS_COLORS[request.status];

  return (
    <Pressable
      style={({ pressed }) => [
        localStyles.card,
        { backgroundColor: theme.componentBG, borderColor: theme.border },
        pressed && { opacity: 0.9, backgroundColor: theme.hoverComponentBG },
      ]}
      onPress={handlePress}
    >
      <View style={localStyles.header}>
        <Text style={[localStyles.title, { color: theme.text }]} numberOfLines={1}>
          {request.title}
        </Text>
        <View style={[localStyles.badge, { backgroundColor: theme[urgencyColorKey] }]}>
          <Text style={[localStyles.badgeText, { color: theme.textLight }]}>{URGENCY_LABELS[request.urgency]}</Text>
        </View>
      </View>

      <Text style={[localStyles.description, { color: theme.textSupporting }]} numberOfLines={2}>
        {descriptionPreview}
      </Text>

      <View style={localStyles.footer}>
        <View style={localStyles.locationContainer}>
          <Text style={[localStyles.locationText, { color: theme.textSupporting }]} numberOfLines={1}>
            {request.location}
          </Text>
        </View>
        <View style={[localStyles.badge, { backgroundColor: theme[statusColorKey] }]}>
          <Text style={[localStyles.badgeText, { color: theme.textLight }]}>{STATUS_LABELS[request.status]}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const localStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flex: 1,
    marginRight: 12,
  },
  locationText: {
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
