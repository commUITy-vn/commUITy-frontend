import React from 'react';
import { View, Text, FlatList, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ReceiveItemsModal from '@/features/support/components/ReceiveItemsModal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import * as Haptics from 'expo-haptics';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSupportLocation } from '@/features/maps/hooks/useSupportLocation';

// Dummy inventory data for coordination flow
const inventory = [
  { id: 'a', name: 'Blankets', currentQty: 30, targetQty: 50 },
  { id: 'b', name: 'Water Bottles', currentQty: 80, targetQty: 80 },
];

export default function LocationDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [modalVisible, setModalVisible] = React.useState(false);

  const { data: location, isLoading, isError } = useSupportLocation(id);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError || !location) {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialIcons name="error-outline" size={48} color={theme.danger} />
        <Text style={{ color: theme.text, marginTop: 12, fontSize: 16 }}>Failed to load location details</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.primary, fontWeight: '600' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      {/* Header (Back chevron + title) */}
      <View
        style={[
          styles.headerBar,
          { borderBottomColor: theme.border },
        ]}
      >
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Location Details</Text>
        <View style={{ width: 52 }} />
      </View>

      <View style={{ padding: 16, flex: 1, gap: 16 }}>
        {/* Header Info Card */}
        <View style={[styles.headerCard, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>{location.name}</Text>
          
          {location.description ? (
            <Text style={[styles.description, { color: theme.textSupporting }]}>
              {location.description}
            </Text>
          ) : null}

          <View style={styles.detailRow}>
            <Ionicons name="pin" size={18} color={theme.primary} />
            <Text style={[styles.detailText, { color: theme.text }]}>{location.address}</Text>
          </View>

          {location.contactPhone ? (
            <View style={styles.detailRow}>
              <Ionicons name="call" size={18} color={theme.primary} />
              <Text style={[styles.detailText, { color: theme.text }]}>{location.contactPhone}</Text>
            </View>
          ) : null}
        </View>

        {/* Inventory Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Inventory</Text>
          <FlatList
            data={inventory}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.inventoryItem}>
                <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.itemQty, { color: theme.textSupporting }]}>{`${item.currentQty}/${item.targetQty}`}</Text>
                {item.currentQty < item.targetQty && (
                  <ProgressBar
                    progress={(item.currentQty / item.targetQty) * 100}
                  />
                )}
              </View>
            )}
          />
        </View>

        {/* FAB */}
        <Pressable
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={() => setModalVisible(true)}
          accessibilityLabel="Receive Items"
        >
          <Text style={[styles.fabText, { color: theme.textLight }]}>+</Text>
        </Pressable>

        {/* Receive Items Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <ReceiveItemsModal
            onClose={() => setModalVisible(false)}
          />
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 15,
    flex: 1,
  },
  section: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  inventoryItem: { marginBottom: 12 },
  itemName: { fontSize: 16 },
  itemQty: { fontSize: 12 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: { fontSize: 28, fontWeight: 'bold' },
});
