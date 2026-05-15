import React from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { ItemCategory, ITEM_CATEGORY_LABELS } from '@/features/support/types/support.types';

export default function CategoryPickerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const globalStyles = useThemeStyles();

  const handleCategorySelect = (category: ItemCategory) => {
    router.replace(`/(app)/create-request?category=${category}`);
  };

  const renderItem = ({ item }: { item: ItemCategory }) => (
    <Pressable
      onPress={() => handleCategorySelect(item)}
      style={[localStyles.categoryItem, { borderColor: theme.border }]}
    >
      <Text style={[localStyles.categoryItemText, { color: theme.text }]}>
        {ITEM_CATEGORY_LABELS[item]}
      </Text>
    </Pressable>
  );

  return (
    <View style={[localStyles.container, { backgroundColor: theme.appBG }]}>
      <View style={localStyles.header}>
        <Pressable
          onPress={() => router.back()}
          style={localStyles.backButton}
        >
          <Text style={[localStyles.backButtonText, { color: theme.primary }]}>Cancel</Text>
        </Pressable>
        <Text style={[localStyles.headerText, { color: theme.text }]}>Select Category</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={Object.values(ItemCategory)}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        contentContainerStyle={localStyles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 80,
  },
  categoryItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryItemText: {
    fontSize: 16,
  },
});