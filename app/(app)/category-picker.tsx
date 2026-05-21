import React, { useState, useMemo } from "react"
import {
    View,
    Text,
    Pressable,
    FlatList,
    TextInput,
    StyleSheet,
    Modal,
} from "react-native"
import { TextInput as TextInputUI } from "@/components/ui"
import { useRouter, useLocalSearchParams } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useTheme } from "@/hooks/useTheme"
import { useThemeStyles } from "@/hooks/useThemeStyles"
import {
    SupportCategory,
    CATEGORY_LABELS,
    ItemCategory,
    ITEM_CATEGORY_LABELS,
} from "@/features/support/types/support.types"

type CategoryValue = SupportCategory | ItemCategory

export default function CategoryPickerScreen() {
    const router = useRouter()
    const theme = useTheme()
    const themeStyles = useThemeStyles()
    const params = useLocalSearchParams<{
        selected?: string
        mode?: "support" | "item"
        backTo?: string
    }>()

    const mode = params.mode || "support"
    const categories =
        mode === "item"
            ? Object.values(ItemCategory)
            : Object.values(SupportCategory)
    const categoryLabels =
        mode === "item"
            ? (ITEM_CATEGORY_LABELS as Record<string, string>)
            : (CATEGORY_LABELS as Record<string, string>)

    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        params.selected || null,
    )
    const [searchQuery, setSearchQuery] = useState("")
    const [localCategories, setLocalCategories] = useState<string[]>(categories)
    const [isAddModalVisible, setIsAddModalVisible] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")

    // Filter categories based on search
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return localCategories
        const query = searchQuery.toLowerCase()
        return localCategories.filter((cat) =>
            (categoryLabels[cat] || cat).toLowerCase().includes(query),
        )
    }, [localCategories, searchQuery, categoryLabels])

    const handleCategorySelect = async (category: string) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        setSelectedCategory(category)

        // Return the selected category and navigate back
        if (params.backTo) {
            router.replace(
                `/(app)/${params.backTo}?category=${category}` as any,
            )
        } else {
            router.back()
        }
    }

    const handleAddCategory = () => {
        setIsAddModalVisible(true)
    }

    const handleConfirmAddCategory = async () => {
        if (!newCategoryName.trim()) return
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        const name = newCategoryName.trim()
        const newCatVal = name.toUpperCase().replace(/\s+/g, '_')
        
        // Add to labels dictionary dynamically
        categoryLabels[newCatVal] = name
        
        setLocalCategories(prev => [newCatVal, ...prev])
        setIsAddModalVisible(false)
        setNewCategoryName("")
        handleCategorySelect(newCatVal)
    }

    const renderCategoryItem = ({ item }: { item: string }) => {
        const isSelected = selectedCategory === item
        return (
            <Pressable
                onPress={() => handleCategorySelect(item)}
                style={({ pressed }) => [
                    localStyles.categoryItem,
                    {
                        backgroundColor: pressed
                            ? theme.highlightBG
                            : "transparent",
                        borderColor: theme.border,
                    },
                ]}
            >
                <View style={localStyles.categoryContent}>
                    <MaterialIcons
                        name={
                            isSelected
                                ? "radio-button-checked"
                                : "radio-button-unchecked"
                        }
                        size={24}
                        color={isSelected ? theme.primary : theme.icon}
                    />
                    <Text
                        style={[
                            localStyles.categoryLabel,
                            {
                                color: isSelected ? theme.primary : theme.text,
                                fontWeight: isSelected ? "600" : "400",
                            },
                        ]}
                    >
                        {categoryLabels[item] || item}
                    </Text>
                </View>
            </Pressable>
        )
    }

    const ListEmptyComponent = () => (
        <View style={localStyles.emptyContainer}>
            <MaterialIcons
                name="search-off"
                size={48}
                color={theme.textSupporting}
            />
            <Text
                style={[localStyles.emptyText, { color: theme.textSupporting }]}
            >
                {"No categories found for \""}{searchQuery}{"\""}
            </Text>
        </View>
    )

    return (
        <View
            style={[
                themeStyles.container,
                { backgroundColor: theme.appBG, flex: 1 },
            ]}
        >
            {/* Header with back chevron and Add Category button */}
            <View
                style={[
                    localStyles.header,
                    {
                        backgroundColor: theme.appBG,
                        borderBottomColor: theme.border,
                    },
                ]}
            >
                <Pressable
                    onPress={async () => {
                        await Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                        )
                        router.back()
                    }}
                    style={localStyles.backButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <MaterialIcons
                        name="chevron-left"
                        size={28}
                        color={theme.primary}
                    />
                </Pressable>

                <Text style={[localStyles.headerTitle, { color: theme.text }]}>
                    Select Category
                </Text>

                <Pressable
                    onPress={handleAddCategory}
                    style={localStyles.addButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Text
                        style={[
                            localStyles.addButtonText,
                            { color: theme.primary },
                        ]}
                    >
                        Add
                    </Text>
                </Pressable>
            </View>

            {/* Search Bar */}
            <View
                style={[
                    localStyles.searchContainer,
                    { backgroundColor: theme.appBG },
                ]}
            >
                <View
                    style={[
                        localStyles.searchInputWrapper,
                        {
                            backgroundColor: theme.highlightBG,
                            borderColor: theme.border,
                        },
                    ]}
                >
                    <MaterialIcons name="search" size={20} color={theme.icon} />
                    <TextInput
                        style={[localStyles.searchInput, { color: theme.text }]}
                        placeholder="Search categories..."
                        placeholderTextColor={theme.placeholderText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus={false}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 ? (
                        <Pressable
                            onPress={() => setSearchQuery("")}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <MaterialIcons
                                name="close"
                                size={20}
                                color={theme.icon}
                            />
                        </Pressable>
                    ) : null}
                </View>
            </View>

            {/* Category List */}
            <FlatList
                data={filteredCategories}
                keyExtractor={(item) => item}
                renderItem={renderCategoryItem}
                contentContainerStyle={localStyles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={ListEmptyComponent}
                keyboardShouldPersistTaps="handled"
            />

            {/* Add Category Modal */}
            <Modal
                visible={isAddModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <Pressable 
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 24,
                    }} 
                    onPress={() => setIsAddModalVisible(false)}
                >
                    <Pressable
                        style={{
                            width: '100%',
                            maxWidth: 320,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme.border,
                            backgroundColor: theme.componentBG,
                            padding: 20,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                            elevation: 5,
                        }}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center', color: theme.text }}>
                            Add Category
                        </Text>
                        <Text style={{ fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 16, color: theme.textSupporting }}>
                            Enter a new category name:
                        </Text>

                        <TextInputUI
                            label="Category Name"
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                            containerStyle={{ marginBottom: 20 }}
                        />
                        
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Pressable
                                onPress={handleConfirmAddCategory}
                                style={{
                                    flex: 1,
                                    height: 44,
                                    borderRadius: 8,
                                    backgroundColor: theme.primary,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Add</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                    setIsAddModalVisible(false)
                                    setNewCategoryName("")
                                }}
                                style={{
                                    flex: 1,
                                    height: 44,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    backgroundColor: theme.highlightBG,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Cancel</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    )
}

const localStyles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 4,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        padding: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        flex: 1,
        textAlign: "center",
    },
    addButton: {
        padding: 12,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        paddingVertical: 0,
    },
    listContent: {
        paddingBottom: 40,
        paddingHorizontal: 16,
    },
    categoryItem: {
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    categoryContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    categoryLabel: {
        fontSize: 16,
        flex: 1,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        textAlign: "center",
        paddingHorizontal: 40,
    },
})
