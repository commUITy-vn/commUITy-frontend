import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Platform, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BorderRadius, Spacing } from '@/constants/theme';
import TextInput from '@/components/ui/TextInput';
import { Button } from '@/components/ui';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useUpdateCategoryStatus,
} from '@/features/support/hooks/useCategories';

export default function CategoryManagementScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Queries & Mutations
  const { data: categories, isLoading, isError } = useCategories(false); // fetch all categories, active and inactive
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const updateStatusMutation = useUpdateCategoryStatus();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null); // null means "Add New"

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIconUrl, setFormIconUrl] = useState('');
  const [formError, setFormError] = useState('');

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleOpenAddModal = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingCategory(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormIconUrl('');
    setFormError('');
    setModalVisible(true);
  };

  const handleOpenEditModal = async (category: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingCategory(category);
    setFormName(category.name || '');
    setFormCode(category.code || '');
    setFormDescription(category.description || '');
    setFormIconUrl(category.iconUrl || '');
    setFormError('');
    setModalVisible(true);
  };

  const handleToggleStatus = async (category: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateStatusMutation.mutateAsync({
        id: category.id,
        data: { isActive: !category.isActive },
      });
    } catch (err) {
      console.error('Failed to toggle category status:', err);
    }
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formCode.trim()) {
      setFormError('Name and Code are required fields.');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const payload = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase().replace(/\s+/g, '_'),
      description: formDescription.trim() || undefined,
      iconUrl: formIconUrl.trim() || undefined,
    };

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          data: payload,
        });
      } else {
        await createCategoryMutation.mutateAsync(payload);
      }
      setModalVisible(false);
    } catch (err: any) {
      console.error('Failed to save category:', err);
      setFormError(err?.message || 'An error occurred while saving.');
    }
  };

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.code.toLowerCase().includes(query) ||
        (cat.description && cat.description.toLowerCase().includes(query))
    );
  }, [categories, searchQuery]);

  const renderItem = ({ item }: { item: any }) => {
    const isActive = item.isActive;
    return (
      <View style={[styles.card, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryInfo}>
            <View style={[styles.iconCircle, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}>
              <MaterialIcons name={item.iconUrl || 'label'} size={22} color={theme.primary} />
            </View>
            <View style={styles.meta}>
              <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.code, { color: theme.textSupporting }]}>{item.code}</Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: isActive ? '#E5F6EE' : '#FFE5E5', borderColor: isActive ? '#008040' : theme.danger }]}>
            <Text style={[styles.badgeText, { color: isActive ? '#008040' : theme.danger }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {item.description ? (
          <Text style={[styles.description, { color: theme.textSupporting }]}>
            {item.description}
          </Text>
        ) : null}

        <View style={[styles.actionsRow, { borderTopColor: theme.border }]}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                borderColor: theme.border,
                backgroundColor: pressed ? theme.highlightBG : 'transparent',
              },
            ]}
            onPress={() => handleOpenEditModal(item)}
          >
            <MaterialIcons name="edit" size={18} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.text }]}>Edit</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              {
                borderColor: theme.border,
                backgroundColor: pressed ? (isActive ? '#FFE5E5' : '#E5F6EE') : 'transparent',
              },
            ]}
            onPress={() => handleToggleStatus(item)}
          >
            <MaterialIcons
              name={isActive ? 'power-settings-new' : 'play-arrow'}
              size={18}
              color={isActive ? theme.danger : '#008040'}
            />
            <Text style={[styles.actionText, { color: isActive ? theme.danger : '#008040' }]}>
              {isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>

        <Pressable onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Category Management</Text>
        <Pressable onPress={handleOpenAddModal} style={styles.addButton}>
          <MaterialIcons name="add" size={26} color={theme.primary} />
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          label="Search Categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.text, marginTop: 12 }]}>
            Failed to load categories
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="category" size={48} color={theme.textSupporting} />
              <Text style={{ color: theme.textSupporting, fontSize: 16, marginTop: 12 }}>
                No categories found
              </Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.appBG }}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={24} color={theme.text} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </Text>
            <Pressable onPress={handleSubmit}>
              <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>
                Save
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {formError ? (
              <View style={[styles.errorBox, { backgroundColor: theme.danger + '10', borderColor: theme.danger }]}>
                <Text style={{ color: theme.danger, fontWeight: '600' }}>{formError}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <TextInput
                label="Category Name"
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Medical Aid"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Category Code (Unique)"
                value={formCode}
                onChangeText={setFormCode}
                placeholder="e.g. MEDICAL_AID"
                editable={!editingCategory} // lock code on editing
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Icon Name (MaterialIcons)"
                value={formIconUrl}
                onChangeText={setFormIconUrl}
                placeholder="e.g. local-hospital"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Description"
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="Brief description of the category..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <Button
                text={editingCategory ? 'Save Changes' : 'Create Category'}
                primary
                onPress={handleSubmit}
                isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        paddingTop: 12,
      },
    }),
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: Spacing.base,
    gap: Spacing.base,
    paddingBottom: 40,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 14,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  code: {
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 60,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  inputContainer: {
    width: '100%',
  },
});
