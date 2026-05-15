import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const categories = ['Food', 'Transport', 'Medical', 'Education', 'Infrastructure', 'Other'];

export const CreateExpenseModal: React.FC<Props> = ({ visible, onClose }) => {
  const theme = useTheme();
  const styles = useThemeStyles();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');

  const submitExpense = () => {
    // Dummy submit - in real app would call API
    console.log('Submitting expense', { amount, category, description });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: '#fff', padding: 16 }]}>
          <Text style={[styles.text, { fontSize: 18, marginBottom: 8 }]}>Record Expense</Text>
          <TextInput
            placeholder="Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            style={[styles.input, { marginBottom: 8 }]}
          />
          <Picker selectedValue={category} onValueChange={setCategory} style={{ marginBottom: 8 }}>
            {categories.map((c) => (
              <Picker.Item label={c} value={c} key={c} />
            ))}
          </Picker>
          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { marginBottom: 8 }]}
          />
          <Pressable
            onPress={submitExpense}
            style={[styles.button, { backgroundColor: theme.primary, paddingVertical: 12, marginBottom: 8 }]}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>Submit Expense for Approval</Text>
          </Pressable>
          <Pressable onPress={onClose} style={[styles.button, { backgroundColor: theme.danger, paddingVertical: 12 }]}>
            <Text style={[styles.buttonText, { color: '#fff' }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
