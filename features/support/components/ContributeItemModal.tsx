import { View, Text, Modal, TextInput, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { SupportItem } from '@/features/support/types/support.types';

interface ContributeItemModalProps {
  visible: boolean;
  onClose: () => void;
  item: SupportItem | null;
  onConfirm: (itemId: string, quantity: number, notes: string) => void;
}

export const ContributeItemModal = ({
  visible,
  onClose,
  item,
  onConfirm,
}: ContributeItemModalProps) => {
  const theme = useTheme();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const handleQuantityChange = async (delta: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  const handleConfirm = async () => {
    if (!item) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(item.id, quantity, notes);
    setQuantity(1);
    setNotes('');
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity(1);
    setNotes('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        onPress={handleClose}
      >
        <View
          style={[
            styles.modal,
            { backgroundColor: theme.componentBG, padding: 24, borderRadius: 16 },
          ]}
        >
          <Text style={[styles.title, { color: theme.text }]}>
            Contribute Item
          </Text>

          {item && (
            <Text style={[styles.itemName, { color: theme.textSupporting }]}>
              {item.name}
            </Text>
          )}

          <View style={styles.quantitySection}>
            <Text style={[styles.label, { color: theme.text }]}>Quantity</Text>
            <View style={styles.quantityContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.quantityButton,
                  {
                    backgroundColor: theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => handleQuantityChange(-1)}
              >
                <Text style={[styles.quantityButtonText, { color: theme.text }]}>
                  -
                </Text>
              </Pressable>
              <Text style={[styles.quantityValue, { color: theme.text }]}>
                {quantity}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.quantityButton,
                  {
                    backgroundColor: theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => handleQuantityChange(1)}
              >
                <Text style={[styles.quantityButtonText, { color: theme.text }]}>
                  +
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.notesSection}>
            <Text style={[styles.label, { color: theme.text }]}>
              Delivery Notes
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.appBG,
                  color: theme.text,
                },
              ]}
              placeholder="Add notes for delivery..."
              placeholderTextColor={theme.placeholderText}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
            <Pressable
              style={[
                styles.cancelButton,
                {
                  borderColor: theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={handleClose}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.confirmButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              onPress={handleConfirm}
            >
              <Text style={[styles.confirmButtonText, { color: theme.textLight }]}>
                Confirm Contribution
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  itemName: {
    fontSize: 14,
    textAlign: 'center',
  },
  quantitySection: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  notesSection: {
    gap: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});