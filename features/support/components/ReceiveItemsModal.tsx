// Receive Items Modal Component
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  onClose: () => void;
};

// Dummy item types – replace with real data when available
const ITEM_TYPES = [
  { label: 'Blankets', value: 'blankets' },
  { label: 'Water Bottles', value: 'water' },
  { label: 'Food Packs', value: 'food' },
];

export default function ReceiveItemsModal({ onClose }: Props) {
  const theme = useTheme();
  const [itemType, setItemType] = useState(ITEM_TYPES[0].value);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onClose();
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { backgroundColor: theme.appBG }]}>
        <Text style={[styles.title, { color: theme.text }]}>Receive Items</Text>
        {/* Item Type Picker */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSupporting }]}>Item Type</Text>
          <Picker
            selectedValue={itemType}
            onValueChange={(value) => setItemType(value as string)}
            style={{ color: theme.text }}
            dropdownIconColor={theme.text}
          >
            {ITEM_TYPES.map((it) => (
              <Picker.Item key={it.value} label={it.label} value={it.value} />
            ))}
          </Picker>
        </View>
        {/* Quantity Input */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSupporting }]}>Quantity Received</Text>
          <TextInput
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Enter quantity"
            placeholderTextColor={theme.textSupporting}
            style={[
              styles.input,
              {
                backgroundColor: theme.appBG,
                borderColor: theme.border,
                color: theme.text,
                padding: 12,
              }
            ]}
          />
        </View>
        {/* Delivery Notes */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textSupporting }]}>Delivery Notes</Text>
          <TextInput
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            placeholderTextColor={theme.textSupporting}
            style={[
              styles.textArea,
              {
                backgroundColor: theme.appBG,
                borderColor: theme.border,
                color: theme.text,
                padding: 12,
              }
            ]}
          />
        </View>
        {/* Confirm Button */}
        <Pressable
          style={[styles.confirmButton, { backgroundColor: theme.success }]}
          onPress={handleConfirm}
        >
          <Text style={[styles.confirmText, { color: theme.textLight }]}>Confirm Receipt</Text>
        </Pressable>
        {/* Cancel */}
        <Pressable style={styles.cancelLink} onPress={onClose}>
          <Text style={{ color: theme.link }}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  confirmButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelLink: {
    marginTop: 12,
    alignSelf: 'center',
  },
});
