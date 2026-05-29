import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { TextInput, Button } from '@/components/ui';
import { useCreateCommunityFund } from '@/features/finance/hooks/useCommunityFunds';

export default function CreateFundScreen() {
  const router = useRouter();
  const theme = useTheme();

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createFundMutation = useCreateCommunityFund();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Fund name is required';
    if (!description.trim()) newErrors.description = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await createFundMutation.mutateAsync({
        name: name.trim(),
        description: description.trim(),
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      console.error('Failed to create community fund:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ submit: error?.message || 'Failed to save community fund. Please check your backend connection.' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: theme.appBG,
        height: (Platform.OS === 'web' ? '100vh' : '100%') as any,
        maxHeight: (Platform.OS === 'web' ? '100vh' : undefined) as any,
      }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View
        style={[
          localStyles.header,
          { borderBottomColor: theme.border, backgroundColor: theme.appBG },
        ]}
      >
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={localStyles.backButton}
        >
          <MaterialIcons
            name="chevron-left"
            size={28}
            color={theme.primary}
          />
        </Pressable>
        <Text style={[localStyles.headerTitle, { color: theme.text }]}>
          Create Fund
        </Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView
        style={localStyles.content}
        contentContainerStyle={localStyles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[localStyles.title, { color: theme.text }]}>
          Establish Community Fund
        </Text>
        <Text style={[localStyles.subtitle, { color: theme.textSupporting }]}>
          Create a transparent community vault. Donors will see how much has been raised and exactly what the resources are spent on.
        </Text>

        {errors.submit && (
          <View style={[localStyles.errorBanner, { backgroundColor: theme.danger + '22', borderColor: theme.danger }]}>
            <MaterialIcons name="error-outline" size={20} color={theme.danger} />
            <Text style={[localStyles.errorText, { color: theme.danger, marginLeft: 8, flex: 1 }]}>
              {errors.submit}
            </Text>
          </View>
        )}

        {/* Form Fields */}
        <TextInput
          label="Fund Name"
          value={name}
          onChangeText={setName}
          errorText={errors.name}
        />

        <TextInput
          label="Description / Purpose of Fund"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ height: 120, textAlignVertical: 'top', paddingTop: 16 }}
          errorText={errors.description}
        />

        {/* Submit Action */}
        <View style={localStyles.buttonContainer}>
          <Button
            text={createFundMutation.isPending ? 'Creating...' : 'Create Community Fund'}
            onPress={handleSubmit}
            size="large"
            primary
            isDisabled={createFundMutation.isPending}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const localStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1 },
  contentContainer: { flexGrow: 1, padding: 20, gap: 12, paddingBottom: 100 },

  title: { fontSize: 24, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  buttonContainer: { marginTop: 24 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: { fontSize: 14, fontWeight: '500' },
});
