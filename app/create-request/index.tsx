import React, { useState, useMemo } from "react"
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useTheme } from "@/hooks/useTheme"
import { useThemeStyles } from "@/hooks/useThemeStyles"
import { useCreateRequestStore } from "@/stores/useCreateRequestStore"
import TextInput from "@/components/ui/TextInput"
import Button from "@/components/ui/Button"
import { useAuthStore } from "@/features/auth/stores/useAuthStore"
import { UserRole } from "@/features/auth/types"
import {
    SupportCategory,
    CATEGORY_LABELS,
} from "@/features/support/types/support.types"
import { useCategories } from "@/features/support/hooks/useCategories"
import { ActivityIndicator } from "react-native"

export default function CreateRequestCategoryScreen() {
    const router = useRouter()
    const theme = useTheme()
    const themeStyles = useThemeStyles()
    const { user } = useAuthStore()
    const { categoryId: selectedCategoryId, setCategory, setCategoryId, setCategoryName } = useCreateRequestStore()
    const { data: serverCategories, isLoading } = useCategories(true)

    const [searchQuery, setSearchQuery] = useState("")

    // Map server categories to list items
    const categoriesList = useMemo(() => {
        if (!serverCategories || serverCategories.length === 0) {
            // Fallback to static values if no categories are fetched
            return Object.values(SupportCategory).map(cat => ({
                id: cat,
                name: CATEGORY_LABELS[cat],
                code: cat,
            }))
        }
        return serverCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            code: cat.code,
        }))
    }, [serverCategories])

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categoriesList
        const query = searchQuery.toLowerCase()
        return categoriesList.filter((cat) =>
            cat.name.toLowerCase().includes(query),
        )
    }, [categoriesList, searchQuery])

    if (user?.role !== UserRole.REQUESTER) {
        return (
            <View style={[themeStyles.container, localStyles.restrictedContainer]}>
                <MaterialIcons name="lock-outline" size={42} color={theme.textSupporting} />
                <Text style={[localStyles.restrictedTitle, { color: theme.text }]}>
                    Requester only
                </Text>
                <Text style={[localStyles.restrictedText, { color: theme.textSupporting }]}>
                    Support requests are created by requesters. Admins and collaborators review or manage existing requests.
                </Text>
                <Button text="Go back" onPress={() => router.back()} primary style={{ marginTop: 18 }} />
            </View>
        )
    }

    const handleSelect = async (item: { id: string, name: string, code: string }) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        
        const enumValue = item.code as SupportCategory
            
        setCategory(enumValue)
        setCategoryId(item.id)
        setCategoryName(item.name)
        
        setTimeout(() => {
            router.push("/create-request/details")
        }, 0)
    }

    return (
        <View style={[{ flex: 1, backgroundColor: theme.appBG }]}>
            {/* Header */}
            <View
                style={[
                    localStyles.header,
                    { borderBottomColor: theme.border },
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
                >
                    <MaterialIcons name="close" size={24} color={theme.icon} />
                </Pressable>
                <Text style={[localStyles.headerTitle, { color: theme.text }]}>
                    New Request
                </Text>
                <View style={{ width: 48 }} />
            </View>

            {/* Step indicator */}
            <View style={localStyles.stepIndicator}>
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.primary },
                    ]}
                />
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.border },
                    ]}
                />
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.border },
                    ]}
                />
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.border },
                    ]}
                />
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.border },
                    ]}
                />
            </View>

            <Text style={[localStyles.stepTitle, { color: theme.text }]}>
                What do you need help with?
            </Text>

            {/* Search */}
            <View style={localStyles.searchContainer}>
                <TextInput
                    label="Search categories..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Category list */}
            {isLoading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredCategories}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const isSelected = selectedCategoryId === item.id
                        return (
                            <Pressable
                                onPress={() => handleSelect(item)}
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
                                        color={
                                            isSelected ? theme.primary : theme.icon
                                        }
                                    />
                                    <Text
                                        style={[
                                            localStyles.categoryLabel,
                                            {
                                                color: isSelected
                                                    ? theme.primary
                                                    : theme.text,
                                                fontWeight: isSelected
                                                    ? "600"
                                                    : "400",
                                            },
                                        ]}
                                    >
                                        {item.name}
                                    </Text>
                                    <MaterialIcons
                                        name="chevron-right"
                                        size={20}
                                        color={theme.icon}
                                    />
                                </View>
                            </Pressable>
                        )
                    }}
                    contentContainerStyle={localStyles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View style={localStyles.emptyContainer}>
                            <Text
                                style={{
                                    color: theme.textSupporting,
                                    fontSize: 15,
                                }}
                            >
                                No categories found
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    )
}

const localStyles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backButton: {
        padding: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    stepIndicator: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: "700",
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    searchWrapper: {
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
    },
    categoryItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
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
        paddingTop: 40,
    },
    restrictedContainer: {
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    restrictedTitle: {
        marginTop: 14,
        fontSize: 20,
        fontWeight: "800",
    },
    restrictedText: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        textAlign: "center",
    },
})
