import { Alert, View, Text, Modal, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { SupportItem, ItemCategory } from '@/features/support/types/support.types';
import TextInput from '@/components/ui/TextInput';
import { MaterialIcons } from '@expo/vector-icons';

interface ContributeItemModalProps {
  visible: boolean;
  onClose: () => void;
  item: SupportItem | null;
  onConfirm: (itemId: string, quantity: number, notes: string) => Promise<void> | void;
}

export const ContributeItemModal = ({
  visible,
  onClose,
  item,
  onConfirm,
}: ContributeItemModalProps) => {
  const theme = useTheme();
  const [quantity, setQuantity] = useState(1);
  const [quantityText, setQuantityText] = useState('1');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMoney = String(item?.category || '') === ItemCategory.MONEY;

  const remainingQuantity = item
    ? Math.max(
        0,
        item.remainingQuantity ??
          item.neededQuantity - item.receivedQuantity,
      )
    : 0;

  useEffect(() => {
    if (!visible) return;
    const initial = isMoney ? '' : String(Math.min(Math.max(1, quantity), remainingQuantity || quantity || 1));
    setQuantity(Number(initial || 1));
    setQuantityText(initial || '');
    setNotes('');
  }, [visible, item?.id, isMoney]);

  const handleQuantityChange = async (delta: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const maxQuantity = remainingQuantity > 0 ? remainingQuantity : Number.MAX_SAFE_INTEGER;
    const newQuantity = Math.min(maxQuantity, Math.max(1, quantity + delta));
    setQuantity(newQuantity);
    setQuantityText(String(newQuantity));
  };

  const handleQuantityTextChange = (text: string) => {
    const sanitized = text.replace(/[^\d]/g, '');
    setQuantityText(sanitized);
    const parsed = Number(sanitized || 0);
    if (parsed > 0) {
      const maxQuantity = isMoney || remainingQuantity <= 0 ? Number.MAX_SAFE_INTEGER : remainingQuantity;
      setQuantity(Math.min(maxQuantity, parsed));
    }
  };

  const handleConfirm = async () => {
    if (!item) return;
    const parsedQuantity = Number(quantityText || quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert('Invalid amount', isMoney ? 'Please enter a valid VND amount.' : 'Please enter a valid quantity.');
      return;
    }
    const finalQuantity = isMoney
      ? parsedQuantity
      : Math.min(parsedQuantity, remainingQuantity || parsedQuantity);

    setIsSubmitting(true);
    try {
      await onConfirm(item.id, finalQuantity, notes);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setQuantity(1);
      setQuantityText(isMoney ? '' : '1');
      setNotes('');
    } catch (error: any) {
      Alert.alert(
        'Unable to contribute',
        error?.message || 'Please try again after your volunteer request is accepted.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity(1);
    setQuantityText(isMoney ? '' : '1');
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
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              {isMoney ? 'Contribute Money' : 'Contribute Item'}
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
                    {isMoney
                      ? `${item.receivedQuantity || 0} / ${item.neededQuantity || 0} VND received`
                      : remainingQuantity > 0
                        ? `${remainingQuantity} ${item.unit || ''} remaining`
                        : 'This support item is already fulfilled'}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>
                {isMoney ? 'Amount to Contribute' : 'Quantity to Contribute'}
              </Text>
              <View style={[styles.quantityContainer, { borderColor: theme.border, backgroundColor: theme.highlightBG }]}>
                {!isMoney && (
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
                )}

                <View style={styles.quantityValueContainer}>
                  <TextInput
                    label={isMoney ? 'Amount (VND)' : 'Quantity'}
                    value={quantityText}
                    onChangeText={handleQuantityTextChange}
                    keyboardType="number-pad"
                    style={styles.quantityInput}
                  />
                  <Text style={{ fontSize: 12, color: theme.textSupporting, fontWeight: '600', textTransform: 'uppercase' }}>
                    {isMoney ? 'VND' : item?.unit || ''}
                  </Text>
                </View>

                {!isMoney && (
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
                )}
              </View>
            </View>

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
                  opacity: pressed || isSubmitting ? 0.9 : 1,
                },
              ]}
              disabled={isSubmitting || (!isMoney && remainingQuantity <= 0)}
              onPress={handleConfirm}
            >
              <Text style={[styles.confirmButtonText, { color: theme.textLight }]}>
                {isSubmitting ? 'Sending...' : 'Confirm Help'}
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
    gap: 10,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    textAlign: 'center',
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
