import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { SupportRequest, SupportStatus, UrgencyLevel, STATUS_LABELS, URGENCY_LABELS } from '@/features/support/types/support.types';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

interface RequestCardProps {
  request: SupportRequest;
  onPress?: (request: SupportRequest) => void;
}

// Exact badge colors from Strike 2 specification
const URGENCY_COLORS: Record<UrgencyLevel, { bg: string; text: string }> = {
  [UrgencyLevel.HIGH]: { bg: '#FFE5E5', text: '#CC0000' }, // High Urgency / Danger
  [UrgencyLevel.MEDIUM]: { bg: '#FFF4E5', text: '#B35900' }, // Medium Urgency / Warning
  [UrgencyLevel.LOW]: { bg: '#E5F6EE', text: '#008040' }, // Low Urgency / Success
};

const STATUS_COLORS: Record<SupportStatus, { bg: string; text: string }> = {
  [SupportStatus.PENDING]: { bg: '#E2E8F0', text: '#475569' }, // Pending / Neutral
  [SupportStatus.APPROVED]: { bg: '#E5F6EE', text: '#008040' }, // Low Urgency / Success / Approved
  [SupportStatus.IN_PROGRESS]: { bg: '#E0F2FE', text: '#0369A1' }, // In Progress / Info
  [SupportStatus.FULFILLED]: { bg: '#E5F6EE', text: '#008040' }, // Low Urgency / Success / Approved
  [SupportStatus.REJECTED]: { bg: '#FFE5E5', text: '#CC0000' }, // High Urgency / Danger
  [SupportStatus.CANCELLED]: { bg: '#F0F0F0', text: '#666666' }, // Default neutral
};

export const RequestCard = ({ request, onPress }: RequestCardProps) => {
  const theme = useTheme();

  const handlePress = async () => {
    await impactAsync(ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress(request);
    }
  };

  const descriptionPreview = (request.description || '').length > 100
    ? `${(request.description || '').substring(0, 100)}...`
    : (request.description || '');

  const urgencyColor = URGENCY_COLORS[request.urgency];
  const statusColor = STATUS_COLORS[request.status];

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
        <View style={[localStyles.badge, { backgroundColor: urgencyColor.bg }]}>
          <Text style={[localStyles.badgeText, { color: urgencyColor.text }]}>
            {URGENCY_LABELS[request.urgency]}
          </Text>
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
        <View style={[localStyles.badge, { backgroundColor: statusColor.bg }]}>
          <Text style={[localStyles.badgeText, { color: statusColor.text }]}>
            {STATUS_LABELS[request.status]}
          </Text>
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
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '600',
    fontSize: 12,
  },
  badgeText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});