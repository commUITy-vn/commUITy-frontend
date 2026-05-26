import { View, Text, Modal, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { SupportItem } from '@/features/support/types/support.types';
import TextInput from '@/components/ui/TextInput';
import { MaterialIcons } from '@expo/vector-icons';

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
        <Pressable
          style={[
            styles.modal,
            {
              backgroundColor: theme.componentBG,
              borderColor: theme.border,
              shadowColor: theme.inverse,
            },
          ]}
          onPress={(e) => e.stopPropagation()} // Stop propagation to prevent auto-close on modal click
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              Contribute Item
            </Text>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={theme.textSupporting} />
            </Pressable>
          </View>

          <View style={styles.content}>
            {item && (
              <View style={[styles.itemCard, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}>
                <MaterialIcons name="card-giftcard" size={24} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: theme.text }]}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textSupporting, marginTop: 2 }}>
                    Help fulfill this required support item
                  </Text>
                </View>
              </View>
            )}

            {/* Quantity Selector Section */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Quantity to Contribute</Text>
              <View style={[styles.quantityContainer, { borderColor: theme.border, backgroundColor: theme.highlightBG }]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.quantityButton,
                    {
                      backgroundColor: pressed ? theme.border : theme.componentBG,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => handleQuantityChange(-1)}
                >
                  <MaterialIcons name="remove" size={18} color={theme.text} />
                </Pressable>
                
                <View style={styles.quantityValueContainer}>
                  <Text style={[styles.quantityValue, { color: theme.text }]}>
                    {quantity}
                  </Text>
                  {item?.unit ? (
                    <Text style={{ fontSize: 12, color: theme.textSupporting, fontWeight: '600', textTransform: 'uppercase' }}>
                      {item.unit}
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.quantityButton,
                    {
                      backgroundColor: pressed ? theme.border : theme.componentBG,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => handleQuantityChange(1)}
                >
                  <MaterialIcons name="add" size={18} color={theme.text} />
                </Pressable>
              </View>
            </View>

            {/* Notes Section (using custom TextInput with floating label, no placeholder) */}
            <View style={styles.section}>
              <TextInput
                label="Delivery & Handover Notes"
                value={notes}
                onChangeText={setNotes}
                multiline
                height={80}
              />
            </View>
          </View>

          {/* Footer Buttons */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  borderColor: theme.border,
                  backgroundColor: pressed ? theme.highlightBG : 'transparent',
                },
              ]}
              onPress={handleClose}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                Cancel
              </Text>
            </Pressable>
            
            <Pressable
              style={({ pressed }) => [
                styles.confirmButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              onPress={handleConfirm}
            >
              <Text style={[styles.confirmButtonText, { color: theme.textLight }]}>
                Confirm Help
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  quantityValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});