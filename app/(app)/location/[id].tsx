import React from 'react';
import { View, Text, FlatList, StyleSheet, Modal, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ReceiveItemsModal from '@/features/support/components/ReceiveItemsModal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';

// Dummy location data
const locationData = {
  id: '1',
  name: 'Central Hub',
  address: '123 Main St',
  operatingHours: '9am - 5pm',
  contactInfo: '555-1234',
};

// Dummy inventory data
const inventory = [
  { id: 'a', name: 'Blankets', currentQty: 30, targetQty: 50 },
  { id: 'b', name: 'Water Bottles', currentQty: 80, targetQty: 80 },
];

export default function LocationDetail() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [modalVisible, setModalVisible] = React.useState(false);

  // In real impl, fetch data based on params.id

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

      <View style={{ padding: 16, flex: 1 }}>
        {/* Header Info */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>{locationData.name}</Text>
          <Text style={[styles.sub, { color: theme.textSupporting }]}>{locationData.address}</Text>
          <Text style={[styles.sub, { color: theme.textSupporting }]}>{`Hours: ${locationData.operatingHours}`}</Text>
          <Text style={[styles.sub, { color: theme.textSupporting }]}>{`Contact: ${locationData.contactInfo}`}</Text>
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
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold' },
  sub: { fontSize: 14 },
  section: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
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
