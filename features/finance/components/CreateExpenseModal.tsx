import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useSharedValue, useAnimatedStyle, withTiming, Easing, createAnimatedComponent } from 'react-native-reanimated';
import { TextInput, CustomPicker } from '@/components/ui';

const AnimatedText = createAnimatedComponent(Text);
const AnimatedView = createAnimatedComponent(View);

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

  // Animation for modal entrance (Expensify style)
  const scaleValue = useSharedValue(0);
  const opacityValue = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      scaleValue.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.exp),
      });
      opacityValue.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.exp),
      });
    } else {
      scaleValue.value = 0;
      opacityValue.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
      opacity: opacityValue.value,
    };
  });

  const submitExpense = () => {
    // Dummy submit - in real app would call API
    console.log('Submitting expense', { amount, category, description });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={localStyles.modalOverlay}>
        <AnimatedView style={[
                localStyles.modalContent,
                { backgroundColor: theme.componentBG || theme.appBG, borderColor: theme.border, borderWidth: 1 },
                animatedStyle
              ]}>
          <AnimatedText style={[
                localStyles.title,
                { color: theme.text }
              ]}>Record Expense</AnimatedText>
          
          <TextInput
            label="Amount"
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            containerStyle={{ marginBottom: 12 }}
          />
          
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSupporting, marginBottom: 6, marginLeft: 4 }}>
              Category
            </Text>
            <CustomPicker
              selectedValue={category}
              onValueChange={setCategory}
              items={categories.map(c => ({ label: c, value: c }))}
            />
          </View>

          <TextInput
            label="Description"
            placeholder="What was this expense for?"
            value={description}
            onChangeText={setDescription}
            multiline
            height={80}
            containerStyle={{ marginBottom: 16 }}
            style={{ textAlignVertical: 'top', paddingTop: 8 }}
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
        </AnimatedView>
      </View>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
});
