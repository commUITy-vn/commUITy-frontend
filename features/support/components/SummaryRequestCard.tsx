import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { SupportRequestSummaryResponse } from '@/features/support/api/get-support-requests';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

interface SummaryRequestCardProps {
  request: SupportRequestSummaryResponse;
  onPress?: (request: SupportRequestSummaryResponse) => void;
}

export const SummaryRequestCard = ({ request, onPress }: SummaryRequestCardProps) => {
  const theme = useTheme();

  const getStatusColorBg = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return '#E2E8F0';
      case 'APPROVED':
        return '#E5F6EE';
      case 'IN_PROGRESS':
        return '#E0F2FE';
      case 'FULFILLED':
        return '#E5F6EE';
      case 'REJECTED':
        return '#FFE5E5';
      case 'CANCELLED':
        return '#F0F0F0';
      default:
        return theme.border;
    }
  };

  const getStatusColorText = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return '#475569';
      case 'APPROVED':
        return '#008040';
      case 'IN_PROGRESS':
        return '#0369A1';
      case 'FULFILLED':
        return '#008040';
      case 'REJECTED':
        return '#CC0000';
      case 'CANCELLED':
        return '#666666';
      default:
        return theme.text;
    }
  };

  const handlePress = async () => {
    await impactAsync(ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress(request);
    }
  };

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
        <View style={[localStyles.badge, { backgroundColor: theme.highlightBG }]}>
          <Text style={[localStyles.badgeText, { color: theme.text }]}>
            {request.categoryName}
          </Text>
        </View>
      </View>

      <View style={localStyles.footer}>
        <View style={localStyles.locationContainer}>
          <Text style={[localStyles.locationText, { color: theme.textSupporting }]} numberOfLines={1}>
            {request.address || 'Location not available'}
          </Text>
        </View>
        <View style={[localStyles.badge, { backgroundColor: getStatusColorBg(request.status) }]}>
          <Text style={[localStyles.badgeText, { color: getStatusColorText(request.status) }]}>
            {request.status}
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