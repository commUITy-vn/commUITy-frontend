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
        return theme.highlightBG;
      case 'APPROVED':
        return theme.success + '20'; // 12% alpha green
      case 'IN_PROGRESS':
        return theme.primary + '20'; // 12% alpha primary
      case 'FULFILLED':
        return theme.success + '20';
      case 'REJECTED':
        return theme.danger + '20';
      case 'CANCELLED':
        return theme.border;
      default:
        return theme.highlightBG;
    }
  };

  const getStatusColorText = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return theme.textSupporting;
      case 'APPROVED':
        return theme.success;
      case 'IN_PROGRESS':
        return theme.primary;
      case 'FULFILLED':
        return theme.success;
      case 'REJECTED':
        return theme.danger;
      case 'CANCELLED':
        return theme.textSupporting;
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
        <View style={[localStyles.badge, { backgroundColor: theme.highlightBG, borderColor: theme.border, borderWidth: 1 }]}>
          <Text style={[localStyles.badgeText, { color: theme.primary, fontWeight: '700' }]}>
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
          <Text style={[localStyles.badgeText, { color: getStatusColorText(request.status), fontWeight: '700' }]}>
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