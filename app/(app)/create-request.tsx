import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { UrgencyLevel, SupportCategory, CreateSupportRequestDTO } from '@/features/support/types/support.types';
import { CustomPicker } from '@/components/ui/CustomPicker';

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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.appBG }]}>
      <View style={localStyles.formContainer}>
        <Text style={[styles.heading, { color: theme.text }]}>Create Support Request</Text>

        {/* Title Input */}
        <View style={localStyles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Title</Text>
          <View style={[localStyles.inputContainer, { borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Enter request title"
              placeholderTextColor={theme.placeholderText}
              value={formData.title}
              onChangeText={(text) => updateField('title', text)}
            />
          </View>
        </View>

        {/* Description Input */}
        <View style={localStyles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Description</Text>
          <View style={[localStyles.inputContainer, { borderColor: theme.border, minHeight: 120 }]}>
            <TextInput
              style={[styles.input, { color: theme.text, textAlignVertical: 'top', paddingTop: 16 }]}
              placeholder="Describe what you need..."
              placeholderTextColor={theme.placeholderText}
              value={formData.description}
              onChangeText={(text) => updateField('description', text)}
              multiline
              numberOfLines={6}
            />
          </View>
        </View>

        {/* Location Input */}
        <View style={localStyles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Location</Text>
          <View style={[localStyles.inputContainer, { borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Enter location"
              placeholderTextColor={theme.placeholderText}
              value={formData.location}
              onChangeText={(text) => updateField('location', text)}
            />
          </View>
        </View>

        {/* Category Picker */}
        <View style={localStyles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Category</Text>
          <CustomPicker
            selectedValue={formData.category || SupportCategory.OTHER}
            onValueChange={(value) => updateField('category', value as SupportCategory)}
            items={[
              { label: 'Food', value: SupportCategory.FOOD },
              { label: 'Shelter', value: SupportCategory.SHELTER },
              { label: 'Medical', value: SupportCategory.MEDICAL },
              { label: 'Education', value: SupportCategory.EDUCATION },
              { label: 'Transport', value: SupportCategory.TRANSPORT },
              { label: 'Other', value: SupportCategory.OTHER },
            ]}
          />
        </View>

        {/* Urgency Picker */}
        <View style={localStyles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Urgency</Text>
          <CustomPicker
            selectedValue={formData.urgency || UrgencyLevel.MEDIUM}
            onValueChange={(value) => updateField('urgency', value as UrgencyLevel)}
            items={[
              { label: 'High', value: UrgencyLevel.HIGH },
              { label: 'Medium', value: UrgencyLevel.MEDIUM },
              { label: 'Low', value: UrgencyLevel.LOW },
            ]}
          />
        </View>

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [
            localStyles.submitButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={handleSubmit}
        >
          <Text style={[localStyles.submitButtonText, { color: theme.textLight }]}>Submit Request</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  formContainer: {
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
