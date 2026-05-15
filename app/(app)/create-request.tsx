import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import Input from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/icon-symbol';

import {
  UrgencyLevel,
  SupportCategory,
  CreateSupportRequestDTO,
  ItemCategory,
  SupportItem,
} from '@/features/support/types/support.types';

export default function CreateRequestScreen() {
  const theme = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<CreateSupportRequestDTO>>({
    title: '',
    description: '',
    location: '',
    urgency: UrgencyLevel.MEDIUM,
    category: SupportCategory.OTHER,
  });

  // Local items state for request creation
  const [items, setItems] = useState<SupportItem[]>([]);
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>(ItemCategory.OTHER);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');

  const handleSubmit = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Implement API call to create request
    console.log('Submitting request:', formData);
    router.back();
  };

  const updateField = <K extends keyof CreateSupportRequestDTO>(
    field: K,
    value: CreateSupportRequestDTO[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    if (newItemName.trim() && newItemQuantity) {
      const newItem: SupportItem = {
        id: `new-${Date.now()}`,
        category: newItemCategory,
        name: newItemName.trim(),
        neededQuantity: parseInt(newItemQuantity, 10) || 1,
        receivedQuantity: 0,
      };
      setItems([...items, newItem]);
      setNewItemName('');
      setNewItemQuantity('1');
    }
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.appBG, paddingHorizontal: 24 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ gap: 24, paddingBottom: 40 }}>
        <View style={localStyles.formContainer}>
          <Text style={[styles.heading, { color: theme.text }]}>Create Support Request</Text>

          {/* Title Input */}
          <View style={localStyles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Title</Text>
            <Input
              placeholder="Enter request title"
              value={formData.title}
              onChangeText={(text) => updateField('title', text)}
              style={{ minHeight: 56 }} // Pass minHeight through style prop
            />
          </View>

          {/* Description Input */}
          <View style={localStyles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Description</Text>
            <Input
              placeholder="Describe what you need..."
              value={formData.description}
              onChangeText={(text) => updateField('description', text)}
              multiline
              style={{ minHeight: 120 }} // Pass minHeight through style prop
            />
          </View>

          {/* Location Input */}
          <View style={localStyles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Location</Text>
            <Input
              placeholder="Enter location"
              value={formData.location}
              onChangeText={(text) => updateField('location', text)}
              style={{ minHeight: 56 }} // Pass minHeight through style prop
            />
          </View>

          {/* Category Picker - Pressable button like Expensify */}
          <View style={localStyles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Category</Text>
            <Pressable
              onPress={() => {
                // Navigate to category picker screen
                router.push('/(app)/category-picker');
              }}
              style={[
                localStyles.categoryPicker,
                { borderColor: theme.border },
              ]}
            >
              <View style={localStyles.categoryPickerContent}>
                <Text style={[
                  localStyles.categoryPickerText,
                  { color: formData.category ? theme.text : theme.placeholderText },
                ]}>
                  {getCategoryLabel(formData.category)}
                </Text>
                <IconSymbol name="chevron.right" size={16} color={theme.icon} />
              </View>
            </Pressable>
          </View>

          {/* Urgency Picker */}
          <View style={localStyles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Urgency</Text>
            <Input
              // Using Input as a temporary solution - in a real implementation,
              // we'd have a custom picker component or use a modal
              placeholder="Select urgency level"
              value={getUrgencyLabel(formData.urgency)}
              editable={false}
              style={{ minHeight: 56 }} // Pass minHeight through style prop
            />
          </View>

          {/* Items Section */}
          <View style={localStyles.section}>
            <Text style={[styles.heading, { color: theme.text, fontSize: 20 }]}>Items Needed</Text>

            {/* Item Form */}
            <View style={localStyles.itemForm}>
              {/* Category selector for new item - Pressable like above */}
              <Pressable
                onPress={() => {
                  // In a real implementation, this would open a category picker modal
                  // For now, we'll cycle through categories
                  const categories = Object.values(ItemCategory);
                  const currentIndex = categories.indexOf(newItemCategory);
                  const nextIndex = (currentIndex + 1) % categories.length;
                  setNewItemCategory(categories[nextIndex]);
                }}
                style={[
                  localStyles.categoryPicker,
                  { borderColor: theme.border },
                ]}
              >
                <View style={localStyles.categoryPickerContent}>
                  <Text style={[
                    localStyles.categoryPickerText,
                    { color: newItemCategory ? theme.text : theme.placeholderText },
                  ]}>
                    {getItemCategoryLabel(newItemCategory)}
                  </Text>
                  <IconSymbol name="chevron.right" size={16} color={theme.icon} />
                </View>
              </Pressable>

              {/* Item name input */}
              <Input
                placeholder="Item name"
                value={newItemName}
                onChangeText={setNewItemName}
                style={{ minHeight: 56 }} // Pass minHeight through style prop
              />

              {/* Quantity selector - Expensify style stepper */}
              <View style={localStyles.quantitySelector}>
                <Text style={[localStyles.quantityLabel, { color: theme.text }]}>Quantity</Text>
                <View style={localStyles.quantityStepper}>
                  <Pressable
                    onPress={() => {
                      const newQty = Math.max(1, parseInt(newItemQuantity) - 1);
                      setNewItemQuantity(newQty.toString());
                    }}
                    style={localStyles.quantityButton}
                  >
                    <Text style={localStyles.quantityButtonText}>−</Text>
                  </Pressable>
                  <Text style={localStyles.quantityValue}>{newItemQuantity}</Text>
                  <Pressable
                    onPress={() => {
                      const newQty = parseInt(newItemQuantity) + 1;
                      setNewItemQuantity(newQty.toString());
                    }}
                    style={localStyles.quantityButton}
                  >
                    <Text style={localStyles.quantityButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <Button
                text="Add Item"
                onPress={addItem}
                size="large"
                primary
              />
            </View>

            {/* Items List */}
            {items.length > 0 && (
              <View style={localStyles.itemsList}>
                {items.map((item) => (
                  <View key={item.id} style={[localStyles.itemRow, { borderColor: theme.border }]}>
                    <View style={localStyles.itemInfo}>
                      <Text style={[localStyles.itemName, { color: theme.text }]}>{item.name}</Text>
                      <Text style={[localStyles.itemQuantity, { color: theme.textSupporting }]}>
                        {item.neededQuantity} needed
                      </Text>
                    </View>
                    <Button
                      text="✕"
                      onPress={() => removeItem(item.id)}
                      size="extraSmall"
                      danger
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <Button
            text="Submit Request"
            onPress={handleSubmit}
            size="large"
            primary
          />
        </View>
      </ScrollView>
    </View>
  );
}

// Helper functions to get labels
const getCategoryLabel = (category: SupportCategory): string => {
  switch (category) {
    case SupportCategory.FOOD: return 'Food';
    case SupportCategory.SHELTER: return 'Shelter';
    case SupportCategory.MEDICAL: return 'Medical';
    case SupportCategory.EDUCATION: return 'Education';
    case SupportCategory.TRANSPORT: return 'Transport';
    case SupportCategory.OTHER: return 'Other';
    default: return 'Other';
  }
};

const getUrgencyLabel = (urgency: UrgencyLevel): string => {
  switch (urgency) {
    case UrgencyLevel.HIGH: return 'High';
    case UrgencyLevel.MEDIUM: return 'Medium';
    case UrgencyLevel.LOW: return 'Low';
    default: return 'Medium';
  }
};

const getItemCategoryLabel = (category: ItemCategory): string => {
  switch (category) {
    case ItemCategory.FOOD: return 'Food';
    case ItemCategory.CLOTHING: return 'Clothing';
    case ItemCategory.MEDICAL_SUPPLIES: return 'Medical Supplies';
    case ItemCategory.HYGIENE: return 'Hygiene';
    case ItemCategory.BABY_CARE: return 'Baby Care';
    case ItemCategory.EDUCATION: return 'Education';
    case ItemCategory.ELECTRONICS: return 'Electronics';
    case ItemCategory.OTHER: return 'Other';
    default: return 'Other';
  }
};

const localStyles = StyleSheet.create({
  formContainer: {
    paddingVertical: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 12,
  },
  // Category picker styles matching Expensify
  categoryPicker: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
  },
  categoryPickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    width: '100%',
  },
  categoryPickerText: {
    fontSize: 16,
  },
  // Quantity selector styles matching Expensify reference
  quantitySelector: {
    marginTop: 12,
  },
  quantityLabel: {
    fontSize: 16,
    marginBottom: 6,
  },
  quantityStepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 12,
  },
  // Missing styles that were referenced
  section: {
    marginTop: 24,
  },
  itemForm: {
    gap: 12,
  },
});