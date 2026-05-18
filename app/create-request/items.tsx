import React, { useState } from "react"
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList,
} from "react-native"
import { useRouter } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useTheme } from "@/hooks/useTheme"
import { useCreateRequestStore } from "@/stores/useCreateRequestStore"
import { ExpensifyTextInput } from "@/components/ui"
import { Button } from "@/components/ui"
import {
    ItemCategory,
    ITEM_CATEGORY_LABELS,
    SupportItem,
} from "@/features/support/types/support.types"

export default function CreateRequestItemsScreen() {
    const router = useRouter()
    const theme = useTheme()
    const { items, addItem, removeItem } = useCreateRequestStore()

    const [showAddForm, setShowAddForm] = useState(false)
    const [itemName, setItemName] = useState("")
    const [itemQuantity, setItemQuantity] = useState("1")
    const [itemCategory, setItemCategory] = useState(ItemCategory.OTHER)
    const [showCategoryPicker, setShowCategoryPicker] = useState(false)

    const handleAddItem = async () => {
        if (!itemName.trim()) return
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

        const newItem: SupportItem = {
            id: `item-${Date.now()}`,
            category: itemCategory,
            name: itemName.trim(),
            neededQuantity: parseInt(itemQuantity, 10) || 1,
            receivedQuantity: 0,
        }

        addItem(newItem)
        setItemName("")
        setItemQuantity("1")
        setShowAddForm(false)
    }

    const handleNext = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        router.push("/create-request/confirmation")
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.appBG }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
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
                    <MaterialIcons
                        name="chevron-left"
                        size={24}
                        color={theme.primary}
                    />
                </Pressable>
                <Text style={[localStyles.headerTitle, { color: theme.text }]}>
                    Items
                </Text>
                <View style={{ width: 48 }} />
            </View>

            {/* Step indicator */}
            <View style={localStyles.stepIndicator}>
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.success },
                    ]}
                />
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.success },
                    ]}
                />
                <View
                    style={[
                        localStyles.stepDot,
                        { backgroundColor: theme.success },
                    ]}
                />
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
            </View>

            <ScrollView
                style={localStyles.content}
                contentContainerStyle={localStyles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={localStyles.titleRow}>
                    <Text
                        style={[localStyles.stepTitle, { color: theme.text }]}
                    >
                        Items needed
                    </Text>
                    <Pressable
                        onPress={() => {
                            setShowAddForm(!showAddForm)
                            if (showAddForm) {
                                setItemName("")
                                setItemQuantity("1")
                            }
                        }}
                        style={[
                            localStyles.addItemButton,
                            { backgroundColor: theme.primary },
                        ]}
                    >
                        <MaterialIcons
                            name={showAddForm ? "close" : "add"}
                            size={20}
                            color="#FFFFFF"
                        />
                    </Pressable>
                </View>

                {/* Add item form */}
                {showAddForm && (
                    <View
                        style={[
                            localStyles.addForm,
                            {
                                backgroundColor: theme.highlightBG,
                                borderColor: theme.border,
                            },
                        ]}
                    >
                        <ExpensifyTextInput
                            label="What do you need?"
                            value={itemName}
                            onChangeText={setItemName}
                        />

                        {/* Category selector */}
                        <Pressable
                            onPress={() => setShowCategoryPicker(true)}
                            style={[
                                localStyles.categorySelector,
                                { borderColor: theme.border },
                            ]}
                        >
                            <Text
                                style={[
                                    localStyles.fieldLabel,
                                    { color: theme.textSupporting },
                                ]}
                            >
                                Category
                            </Text>
                            <View style={localStyles.categoryValueRow}>
                                <Text
                                    style={{ color: theme.text, fontSize: 16 }}
                                >
                                    {ITEM_CATEGORY_LABELS[itemCategory]}
                                </Text>
                                <MaterialIcons
                                    name="chevron-right"
                                    size={20}
                                    color={theme.icon}
                                />
                            </View>
                        </Pressable>

                        {/* Quantity stepper */}
                        <View style={localStyles.quantityRow}>
                            <Text
                                style={[
                                    localStyles.fieldLabel,
                                    { color: theme.textSupporting },
                                ]}
                            >
                                Quantity
                            </Text>
                            <View style={localStyles.stepper}>
                                <Pressable
                                    onPress={() => {
                                        const q = Math.max(
                                            1,
                                            parseInt(itemQuantity) - 1,
                                        )
                                        setItemQuantity(q.toString())
                                    }}
                                    style={[
                                        localStyles.stepperBtn,
                                        { borderColor: theme.border },
                                    ]}
                                >
                                    <Text
                                        style={{
                                            color: theme.text,
                                            fontSize: 18,
                                        }}
                                    >
                                        −
                                    </Text>
                                </Pressable>
                                <Text
                                    style={[
                                        localStyles.stepperValue,
                                        { color: theme.text },
                                    ]}
                                >
                                    {itemQuantity}
                                </Text>
                                <Pressable
                                    onPress={() => {
                                        const q = parseInt(itemQuantity) + 1
                                        setItemQuantity(q.toString())
                                    }}
                                    style={[
                                        localStyles.stepperBtn,
                                        { borderColor: theme.border },
                                    ]}
                                >
                                    <Text
                                        style={{
                                            color: theme.text,
                                            fontSize: 18,
                                        }}
                                    >
                                        +
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        <Button
                            text="Add Item"
                            onPress={handleAddItem}
                            size="medium"
                            primary
                            isDisabled={!itemName.trim()}
                        />
                    </View>
                )}

                {/* Items list */}
                {items.length > 0 ? (
                    <View style={localStyles.itemsList}>
                        {items.map((item, index) => (
                            <View
                                key={item.id}
                                style={[
                                    localStyles.itemRow,
                                    { borderColor: theme.border },
                                    index === 0 && {
                                        borderTopWidth:
                                            StyleSheet.hairlineWidth,
                                    },
                                ]}
                            >
                                <View style={localStyles.itemInfo}>
                                    <Text
                                        style={[
                                            localStyles.itemName,
                                            { color: theme.text },
                                        ]}
                                    >
                                        {item.name}
                                    </Text>
                                    <Text
                                        style={[
                                            localStyles.itemMeta,
                                            { color: theme.textSupporting },
                                        ]}
                                    >
                                        {item.neededQuantity} needed ·{" "}
                                        {ITEM_CATEGORY_LABELS[item.category]}
                                    </Text>
                                </View>
                                <Pressable
                                    onPress={() => removeItem(item.id)}
                                    hitSlop={12}
                                    style={localStyles.removeBtn}
                                >
                                    <MaterialIcons
                                        name="close"
                                        size={20}
                                        color={theme.danger}
                                    />
                                </Pressable>
                            </View>
                        ))}
                    </View>
                ) : !showAddForm ? (
                    <View style={localStyles.emptyState}>
                        <MaterialIcons
                            name="inventory-2"
                            size={48}
                            color={theme.textSupporting}
                        />
                        <Text
                            style={[
                                localStyles.emptyText,
                                { color: theme.textSupporting },
                            ]}
                        >
                            No items added yet. Tap + to add what you need.
                        </Text>
                    </View>
                ) : null}

                {/* Next button */}
                <View style={localStyles.buttonContainer}>
                    <Button
                        text={items.length > 0 ? "Next" : "Skip"}
                        onPress={handleNext}
                        size="large"
                        primary
                    />
                </View>
            </ScrollView>

            {/* Category Picker Modal */}
            <Modal
                visible={showCategoryPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCategoryPicker(false)}
            >
                <Pressable
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: "rgba(0,0,0,0.5)" },
                    ]}
                    onPress={() => setShowCategoryPicker(false)}
                />
                <View
                    style={[
                        localStyles.pickerModal,
                        { backgroundColor: theme.componentBG },
                    ]}
                >
                    <View
                        style={[
                            localStyles.pickerHeader,
                            { borderBottomColor: theme.border },
                        ]}
                    >
                        <Text
                            style={[
                                localStyles.pickerTitle,
                                { color: theme.text },
                            ]}
                        >
                            Select Category
                        </Text>
                        <Pressable onPress={() => setShowCategoryPicker(false)}>
                            <MaterialIcons
                                name="close"
                                size={24}
                                color={theme.icon}
                            />
                        </Pressable>
                    </View>
                    <FlatList
                        data={Object.values(ItemCategory)}
                        keyExtractor={(cat) => cat}
                        renderItem={({ item: cat }) => (
                            <Pressable
                                onPress={() => {
                                    setItemCategory(cat)
                                    setShowCategoryPicker(false)
                                }}
                                style={({ pressed }) => [
                                    localStyles.pickerItem,
                                    {
                                        backgroundColor: pressed
                                            ? theme.highlightBG
                                            : "transparent",
                                        borderColor: theme.border,
                                    },
                                ]}
                            >
                                <MaterialIcons
                                    name={
                                        itemCategory === cat
                                            ? "radio-button-checked"
                                            : "radio-button-unchecked"
                                    }
                                    size={22}
                                    color={
                                        itemCategory === cat
                                            ? theme.primary
                                            : theme.icon
                                    }
                                />
                                <Text
                                    style={[
                                        localStyles.pickerItemText,
                                        {
                                            color:
                                                itemCategory === cat
                                                    ? theme.primary
                                                    : theme.text,
                                            fontWeight:
                                                itemCategory === cat
                                                    ? "600"
                                                    : "400",
                                        },
                                    ]}
                                >
                                    {ITEM_CATEGORY_LABELS[cat]}
                                </Text>
                            </Pressable>
                        )}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                </View>
            </Modal>
        </KeyboardAvoidingView>
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
    backButton: { padding: 12 },
    headerTitle: { fontSize: 18, fontWeight: "600" },
    stepIndicator: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
    },
    stepDot: { width: 8, height: 8, borderRadius: 4 },
    content: { flex: 1 },
    contentContainer: { padding: 20, gap: 12, paddingBottom: 40 },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    stepTitle: { fontSize: 22, fontWeight: "700", flex: 1 },
    addItemButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    addForm: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    categorySelector: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    fieldLabel: { fontSize: 13, fontWeight: "600" },
    categoryValueRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    quantityRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },
    stepper: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    stepperBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    stepperValue: {
        fontSize: 16,
        fontWeight: "600",
        minWidth: 24,
        textAlign: "center",
    },
    itemsList: { gap: 0 },
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    itemInfo: { flex: 1, gap: 2 },
    itemName: { fontSize: 16, fontWeight: "500" },
    itemMeta: { fontSize: 13 },
    removeBtn: { padding: 8 },
    emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
    emptyText: { fontSize: 15, textAlign: "center", paddingHorizontal: 20 },
    buttonContainer: { marginTop: 16 },
    // Category picker modal styles
    pickerModal: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "60%",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    pickerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    pickerTitle: { fontSize: 18, fontWeight: "600" },
    pickerItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    pickerItemText: { fontSize: 16, flex: 1 },
})
