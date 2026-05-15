import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { SupportItem, ITEM_CATEGORY_LABELS } from '@/features/support/types/support.types';

interface SupportItemProgressProps {
  item: SupportItem;
}

export const SupportItemProgress = ({ item }: SupportItemProgressProps) => {
  const theme = useTheme();

  const progressPercentage = Math.min(
    (item.receivedQuantity / item.neededQuantity) * 100,
    100
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.itemName, { color: theme.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.category, { color: theme.textSupporting }]}>
          {ITEM_CATEGORY_LABELS[item.category]}
        </Text>
      </View>
      <Text style={[styles.quantity, { color: theme.textSupporting }]}>
        {item.receivedQuantity}/{item.neededQuantity} received
      </Text>
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.primary,
              width: `${progressPercentage}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  category: {
    fontSize: 12,
  },
  quantity: {
    fontSize: 14,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});