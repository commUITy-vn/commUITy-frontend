import React, { useState, useMemo } from "react"
import {
    View,
    Text,
    Pressable,
    FlatList,
    TextInput,
    StyleSheet,
    Alert,
} from "react-native"
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

    // Filter categories based on search
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories
        const query = searchQuery.toLowerCase()
        return categories.filter((cat) =>
            (categoryLabels[cat] || cat).toLowerCase().includes(query),
        )
    }, [categories, searchQuery, categoryLabels])

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
        Alert.alert("Add Category", "Enter a new category name:", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Add",
                onPress: (text) => {
                    // In a real app, this would call an API
                    console.log("New category:", text)
                },
            },
        ])
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
                No categories found for "{searchQuery}"
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
