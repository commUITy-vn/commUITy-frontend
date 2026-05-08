import { View, Text, Modal, FlatList, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

interface PickerItem {
  label: string;
  value: string;
}

interface CustomPickerProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: PickerItem[];
  placeholder?: string;
}

export const CustomPicker = ({ selectedValue, onValueChange, items, placeholder = 'Select...' }: CustomPickerProps) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  const selectedItem = items.find(item => item.value === selectedValue);

  const handleSelect = async (value: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(value);
    setIsVisible(false);
  };

  const handleOpen = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsVisible(true);
  };

  return (
    <View>
      <Pressable
        style={({ pressed }) => [
          localStyles.trigger,
          {
            borderColor: theme.border,
            backgroundColor: theme.componentBG,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        onPress={handleOpen}
      >
        <Text style={[localStyles.triggerText, { color: selectedItem ? theme.text : theme.placeholderText }]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Text style={[localStyles.arrow, { color: theme.textSupporting }]}>▼</Text>
      </Pressable>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <Pressable
          style={[localStyles.overlay, { backgroundColor: theme.overlay }]}
          onPress={() => setIsVisible(false)}
        >
          <View style={[localStyles.modal, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    localStyles.option,
                    {
                      backgroundColor: pressed ? theme.hoverComponentBG : 'transparent',
                      borderBottomColor: theme.border,
                    },
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text style={[localStyles.optionText, { color: theme.text }]}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const localStyles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  triggerText: {
    fontSize: 16,
    flex: 1,
  },
  arrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  modal: {
    width: '100%',
    maxHeight: 300,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
});
