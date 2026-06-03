import { BottomSheet, Button } from "@/components/ui";
import TextInput from "@/components/ui/TextInput";
import { useTheme } from "@/hooks/useTheme";
import { useCreateRequestStore } from "@/stores/useCreateRequestStore";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
// Giả định bạn đã update SupportItem có thêm trường `unit`
import {
    ITEM_CATEGORY_LABELS,
    ItemCategory,
    UnitOptions,
} from "@/features/support/types/support.types";

export default function CreateRequestItemsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { items, addItem, removeItem } = useCreateRequestStore();

  const [showAddForm, setShowAddForm] = useState(false);

  // 4 Trường theo đúng yêu cầu
  const [itemCategory, setItemCategory] = useState<ItemCategory>(
    ItemCategory.GOODS,
  );
  const [itemName, setItemName] = useState("");
  const [itemUnit, setItemUnit] = useState<UnitOptions>(UnitOptions.PIECE);
  const [itemQuantity, setItemQuantity] = useState("1");

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const availableUnits = Object.values(UnitOptions).filter((unit) =>
    itemCategory === ItemCategory.MONEY ? unit === UnitOptions.VND : unit !== UnitOptions.VND,
  );

  useEffect(() => {
    if (itemCategory === ItemCategory.MONEY) {
      setItemUnit(UnitOptions.VND);
    } else if (itemUnit === UnitOptions.VND) {
      setItemUnit(UnitOptions.PIECE);
    }
  }, [itemCategory, itemUnit]);

  const handleAddItem = async () => {
    const parsedQuantity = Number(itemQuantity.replace(/,/g, ""));
    if (!itemName.trim() || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newItem: any = {
      // Dùng any tạm nếu SupportItem chưa có trường unit
      id: `item-${Date.now()}`,
      category: itemCategory,
      name: itemName.trim(),
      unit: itemCategory === ItemCategory.MONEY ? UnitOptions.VND : itemUnit,
      neededQuantity: parsedQuantity,
      receivedQuantity: 0,
    };

    addItem(newItem);
    setItemName("");
    setItemQuantity("1");
    setItemCategory(ItemCategory.GOODS);
    setItemUnit(UnitOptions.PIECE);
    setShowAddForm(false);
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/create-request/confirmation");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.appBG }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[localStyles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={localStyles.backButton}
        >
          <MaterialIcons name="chevron-left" size={24} color={theme.primary} />
        </Pressable>
        <Text style={[localStyles.headerTitle, { color: theme.text }]}>
          Items
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Step indicator: Bước 3/4 */}
      <View style={localStyles.stepIndicator}>
        <View
          style={[localStyles.stepDot, { backgroundColor: theme.success }]}
        />
        <View
          style={[localStyles.stepDot, { backgroundColor: theme.success }]}
        />
        <View
          style={[localStyles.stepDot, { backgroundColor: theme.primary }]}
        />
        <View
          style={[localStyles.stepDot, { backgroundColor: theme.border }]}
        />
      </View>

      <ScrollView
        style={localStyles.content}
        contentContainerStyle={localStyles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={localStyles.titleRow}>
          <Text style={[localStyles.stepTitle, { color: theme.text }]}>
            Items needed
          </Text>
          <Pressable
            onPress={() => {
              setShowAddForm(!showAddForm);
              if (showAddForm) {
                setItemName("");
                setItemQuantity("1");
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
              { backgroundColor: theme.highlightBG, borderColor: theme.border },
            ]}
          >
            {/* 1. Category selector (Goods/Money) */}
            <Pressable
              onPress={() => setShowCategoryPicker(true)}
              style={[localStyles.pickerRow, { borderColor: theme.border }]}
            >
              <Text
                style={[
                  localStyles.fieldLabel,
                  { color: theme.textSupporting },
                ]}
              >
                Category
              </Text>
              <View style={localStyles.pickerValueGroup}>
                <Text style={{ color: theme.text, fontSize: 16 }}>
                  {ITEM_CATEGORY_LABELS[itemCategory] || itemCategory}
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={theme.icon}
                />
              </View>
            </Pressable>

            {/* 2. Name */}
            <TextInput
              label="Name"
              value={itemName}
              onChangeText={setItemName}
            />

            {/* 3. Unit selector */}
            <Pressable
              onPress={() => {
                if (itemCategory !== ItemCategory.MONEY) {
                  setShowUnitPicker(true);
                }
              }}
              style={[localStyles.pickerRow, { borderColor: theme.border }]}
            >
              <Text
                style={[
                  localStyles.fieldLabel,
                  { color: theme.textSupporting },
                ]}
              >
                Unit
              </Text>
              <View style={localStyles.pickerValueGroup}>
                <Text style={{ color: theme.text, fontSize: 16 }}>
                  {itemUnit}
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={theme.icon}
                />
              </View>
            </Pressable>

            {/* 4. Quantity input */}
            <View style={localStyles.quantityRow}>
              <View style={{ flex: 1 }}>
                <TextInput
                  label={itemCategory === ItemCategory.MONEY ? "Amount" : "Quantity"}
                  value={itemQuantity}
                  onChangeText={(text) =>
                    setItemQuantity(text.replace(/[^\d.]/g, ""))
                  }
                  keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                />
              </View>
              {itemCategory !== ItemCategory.MONEY && (
                <View style={localStyles.stepper}>
                  <Pressable
                    onPress={() =>
                      setItemQuantity(
                        Math.max(1, Math.floor(Number(itemQuantity) || 1) - 1).toString(),
                      )
                    }
                    style={[
                      localStyles.stepperBtn,
                      { borderColor: theme.border },
                    ]}
                  >
                    <Text style={{ color: theme.text, fontSize: 18 }}>−</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      setItemQuantity((Math.floor(Number(itemQuantity) || 0) + 1).toString())
                    }
                    style={[
                      localStyles.stepperBtn,
                      { borderColor: theme.border },
                    ]}
                  >
                    <Text style={{ color: theme.text, fontSize: 18 }}>+</Text>
                  </Pressable>
                </View>
              )}
            </View>

            <Button
              text="Add Item"
              onPress={handleAddItem}
              size="medium"
              primary
              isDisabled={
                !itemName.trim() ||
                !Number.isFinite(Number(itemQuantity)) ||
                Number(itemQuantity) <= 0
              }
            />
          </View>
        )}

        {/* Items list */}
        {items.length > 0 ? (
          <View style={localStyles.itemsList}>
            {items.map((item: any, index) => (
              <View
                key={item.id}
                style={[
                  localStyles.itemRow,
                  { borderColor: theme.border },
                  index === 0 && { borderTopWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <View style={localStyles.itemInfo}>
                  <Text style={[localStyles.itemName, { color: theme.text }]}>
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      localStyles.itemMeta,
                      { color: theme.textSupporting },
                    ]}
                  >
                    {item.neededQuantity} {item.unit} ·{" "}
                    {item.category === ItemCategory.MONEY ? "Money" : "Goods"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => removeItem(item.id)}
                  hitSlop={12}
                  style={localStyles.removeBtn}
                >
                  <MaterialIcons name="close" size={20} color={theme.danger} />
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
              style={[localStyles.emptyText, { color: theme.textSupporting }]}
            >
              No items added yet. Tap + to add.
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

      {/* BottomSheets */}
      <BottomSheet
        isVisible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        options={[
          {
            key: ItemCategory.GOODS,
            label: "Goods",
            onPress: () => {
              setItemCategory(ItemCategory.GOODS);
              setShowCategoryPicker(false);
            },
          },
          {
            key: ItemCategory.MONEY,
            label: "Money",
            onPress: () => {
              setItemCategory(ItemCategory.MONEY);
              setShowCategoryPicker(false);
            },
          },
        ]}
      />

      <BottomSheet
        isVisible={showUnitPicker}
        onClose={() => setShowUnitPicker(false)}
        options={availableUnits.map((unit) => ({
          key: unit,
          label: unit,
          onPress: () => {
            setItemUnit(unit);
            setShowUnitPicker(false);
          },
        }))}
      />
    </KeyboardAvoidingView>
  );
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
  contentContainer: { padding: 20, gap: 16, paddingBottom: 40 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  stepTitle: { fontSize: 22, fontWeight: "700", flex: 1 },
  addItemButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  addForm: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
  pickerRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: { fontSize: 13, fontWeight: "600" },
  pickerValueGroup: { flexDirection: "row", alignItems: "center", gap: 4 },
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 16 },
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
  buttonContainer: { marginTop: 24 },
});
// import React, { useState } from "react"
// import {
//     View,
//     Text,
//     Pressable,
//     ScrollView,
//     StyleSheet,
//     KeyboardAvoidingView,
//     Platform,
// } from "react-native"
// import { useRouter } from "expo-router"
// import { MaterialIcons } from "@expo/vector-icons"
// import * as Haptics from "expo-haptics"
// import { useTheme } from "@/hooks/useTheme"
// import { useCreateRequestStore } from "@/stores/useCreateRequestStore"
// import TextInput from "@/components/ui/TextInput"
// import { Button, BottomSheet } from "@/components/ui"
// import {
//     ItemCategory,
//     ITEM_CATEGORY_LABELS,
//     SupportItem,
// } from "@/features/support/types/support.types"

// export default function CreateRequestItemsScreen() {
//     const router = useRouter()
//     const theme = useTheme()
//     const { items, addItem, removeItem } = useCreateRequestStore()

//     const [showAddForm, setShowAddForm] = useState(false)
//     const [itemName, setItemName] = useState("")
//     const [itemQuantity, setItemQuantity] = useState("1")
//     const [itemCategory, setItemCategory] = useState(ItemCategory.OTHER)
//     const [showCategoryPicker, setShowCategoryPicker] = useState(false)

//     const handleAddItem = async () => {
//         if (!itemName.trim()) return
//         await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

//         const newItem: SupportItem = {
//             id: `item-${Date.now()}`,
//             category: itemCategory,
//             name: itemName.trim(),
//             neededQuantity: parseInt(itemQuantity, 10) || 1,
//             receivedQuantity: 0,
//         }

//         addItem(newItem)
//         setItemName("")
//         setItemQuantity("1")
//         setShowAddForm(false)
//     }

//     const handleNext = async () => {
//         await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
//         router.push("/create-request/confirmation")
//     }

//     return (
//         <KeyboardAvoidingView
//             style={{ flex: 1, backgroundColor: theme.appBG }}
//             behavior={Platform.OS === "ios" ? "padding" : undefined}
//         >
//             {/* Header */}
//             <View
//                 style={[
//                     localStyles.header,
//                     { borderBottomColor: theme.border },
//                 ]}
//             >
//                 <Pressable
//                     onPress={async () => {
//                         await Haptics.impactAsync(
//                             Haptics.ImpactFeedbackStyle.Light,
//                         )
//                         router.back()
//                     }}
//                     style={localStyles.backButton}
//                 >
//                     <MaterialIcons
//                         name="chevron-left"
//                         size={24}
//                         color={theme.primary}
//                     />
//                 </Pressable>
//                 <Text style={[localStyles.headerTitle, { color: theme.text }]}>
//                     Items
//                 </Text>
//                 <View style={{ width: 48 }} />
//             </View>

//             {/* Step indicator */}
//             <View style={localStyles.stepIndicator}>
//                 <View
//                     style={[
//                         localStyles.stepDot,
//                         { backgroundColor: theme.success },
//                     ]}
//                 />
//                 <View
//                     style={[
//                         localStyles.stepDot,
//                         { backgroundColor: theme.success },
//                     ]}
//                 />
//                 <View
//                     style={[
//                         localStyles.stepDot,
//                         { backgroundColor: theme.success },
//                     ]}
//                 />
//                 <View
//                     style={[
//                         localStyles.stepDot,
//                         { backgroundColor: theme.primary },
//                     ]}
//                 />
//                 <View
//                     style={[
//                         localStyles.stepDot,
//                         { backgroundColor: theme.border },
//                     ]}
//                 />
//             </View>

//             <ScrollView
//                 style={localStyles.content}
//                 contentContainerStyle={localStyles.contentContainer}
//                 keyboardShouldPersistTaps="handled"
//             >
//                 <View style={localStyles.titleRow}>
//                     <Text
//                         style={[localStyles.stepTitle, { color: theme.text }]}
//                     >
//                         Items needed
//                     </Text>
//                     <Pressable
//                         onPress={() => {
//                             setShowAddForm(!showAddForm)
//                             if (showAddForm) {
//                                 setItemName("")
//                                 setItemQuantity("1")
//                             }
//                         }}
//                         style={[
//                             localStyles.addItemButton,
//                             { backgroundColor: theme.primary },
//                         ]}
//                     >
//                         <MaterialIcons
//                             name={showAddForm ? "close" : "add"}
//                             size={20}
//                             color="#FFFFFF"
//                         />
//                     </Pressable>
//                 </View>

//                 {/* Add item form */}
//                 {showAddForm && (
//                     <View
//                         style={[
//                             localStyles.addForm,
//                             {
//                                 backgroundColor: theme.highlightBG,
//                                 borderColor: theme.border,
//                             },
//                         ]}
//                     >
//                         <TextInput
//                             label="What do you need?"
//                             value={itemName}
//                             onChangeText={setItemName}
//                         />

//                         {/* Category selector */}
//                         <Pressable
//                             onPress={() => setShowCategoryPicker(true)}
//                             style={[
//                                 localStyles.categorySelector,
//                                 { borderColor: theme.border },
//                             ]}
//                         >
//                             <Text
//                                 style={[
//                                     localStyles.fieldLabel,
//                                     { color: theme.textSupporting },
//                                 ]}
//                             >
//                                 Category
//                             </Text>
//                             <View style={localStyles.categoryValueRow}>
//                                 <Text
//                                     style={{ color: theme.text, fontSize: 16 }}
//                                 >
//                                     {ITEM_CATEGORY_LABELS[itemCategory]}
//                                 </Text>
//                                 <MaterialIcons
//                                     name="chevron-right"
//                                     size={20}
//                                     color={theme.icon}
//                                 />
//                             </View>
//                         </Pressable>

//                         {/* Quantity stepper */}
//                         <View style={localStyles.quantityRow}>
//                             <Text
//                                 style={[
//                                     localStyles.fieldLabel,
//                                     { color: theme.textSupporting },
//                                 ]}
//                             >
//                                 Quantity
//                             </Text>
//                             <View style={localStyles.stepper}>
//                                 <Pressable
//                                     onPress={() => {
//                                         const q = Math.max(
//                                             1,
//                                             parseInt(itemQuantity) - 1,
//                                         )
//                                         setItemQuantity(q.toString())
//                                     }}
//                                     style={[
//                                         localStyles.stepperBtn,
//                                         { borderColor: theme.border },
//                                     ]}
//                                 >
//                                     <Text
//                                         style={{
//                                             color: theme.text,
//                                             fontSize: 18,
//                                         }}
//                                     >
//                                         −
//                                     </Text>
//                                 </Pressable>
//                                 <Text
//                                     style={[
//                                         localStyles.stepperValue,
//                                         { color: theme.text },
//                                     ]}
//                                 >
//                                     {itemQuantity}
//                                 </Text>
//                                 <Pressable
//                                     onPress={() => {
//                                         const q = parseInt(itemQuantity) + 1
//                                         setItemQuantity(q.toString())
//                                     }}
//                                     style={[
//                                         localStyles.stepperBtn,
//                                         { borderColor: theme.border },
//                                     ]}
//                                 >
//                                     <Text
//                                         style={{
//                                             color: theme.text,
//                                             fontSize: 18,
//                                         }}
//                                     >
//                                         +
//                                     </Text>
//                                 </Pressable>
//                             </View>
//                         </View>

//                         <Button
//                             text="Add Item"
//                             onPress={handleAddItem}
//                             size="medium"
//                             primary
//                             isDisabled={!itemName.trim()}
//                         />
//                     </View>
//                 )}

//                 {/* Items list */}
//                 {items.length > 0 ? (
//                     <View style={localStyles.itemsList}>
//                         {items.map((item, index) => (
//                             <View
//                                 key={item.id}
//                                 style={[
//                                     localStyles.itemRow,
//                                     { borderColor: theme.border },
//                                     index === 0 && {
//                                         borderTopWidth:
//                                             StyleSheet.hairlineWidth,
//                                     },
//                                 ]}
//                             >
//                                 <View style={localStyles.itemInfo}>
//                                     <Text
//                                         style={[
//                                             localStyles.itemName,
//                                             { color: theme.text },
//                                         ]}
//                                     >
//                                         {item.name}
//                                     </Text>
//                                     <Text
//                                         style={[
//                                             localStyles.itemMeta,
//                                             { color: theme.textSupporting },
//                                         ]}
//                                     >
//                                         {item.neededQuantity} needed ·{" "}
//                                         {ITEM_CATEGORY_LABELS[item.category]}
//                                     </Text>
//                                 </View>
//                                 <Pressable
//                                     onPress={() => removeItem(item.id)}
//                                     hitSlop={12}
//                                     style={localStyles.removeBtn}
//                                 >
//                                     <MaterialIcons
//                                         name="close"
//                                         size={20}
//                                         color={theme.danger}
//                                     />
//                                 </Pressable>
//                             </View>
//                         ))}
//                     </View>
//                 ) : !showAddForm ? (
//                     <View style={localStyles.emptyState}>
//                         <MaterialIcons
//                             name="inventory-2"
//                             size={48}
//                             color={theme.textSupporting}
//                         />
//                         <Text
//                             style={[
//                                 localStyles.emptyText,
//                                 { color: theme.textSupporting },
//                             ]}
//                         >
//                             No items added yet. Tap + to add what you need.
//                         </Text>
//                     </View>
//                 ) : null}

//                 {/* Next button */}
//                 <View style={localStyles.buttonContainer}>
//                     <Button
//                         text={items.length > 0 ? "Next" : "Skip"}
//                         onPress={handleNext}
//                         size="large"
//                         primary
//                     />
//                 </View>
//             </ScrollView>

//             {/* Category Picker using shared BottomSheet */}
//             <BottomSheet
//                 isVisible={showCategoryPicker}
//                 onClose={() => setShowCategoryPicker(false)}
//                 options={Object.values(ItemCategory).map((cat) => ({
//                     key: cat,
//                     label: ITEM_CATEGORY_LABELS[cat],
//                     onPress: () => {
//                         setItemCategory(cat)
//                         setShowCategoryPicker(false)
//                     },
//                 }))}
//             />
//         </KeyboardAvoidingView>
//     )
// }

// const localStyles = StyleSheet.create({
//     header: {
//         flexDirection: "row",
//         alignItems: "center",
//         justifyContent: "space-between",
//         paddingHorizontal: 8,
//         paddingVertical: 12,
//         borderBottomWidth: StyleSheet.hairlineWidth,
//     },
//     backButton: { padding: 12 },
//     headerTitle: { fontSize: 18, fontWeight: "600" },
//     stepIndicator: {
//         flexDirection: "row",
//         justifyContent: "center",
//         gap: 8,
//         paddingVertical: 12,
//     },
//     stepDot: { width: 8, height: 8, borderRadius: 4 },
//     content: { flex: 1 },
//     contentContainer: { padding: 20, gap: 16, paddingBottom: 40 },
//     titleRow: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//         marginBottom: 16,
//     },
//     stepTitle: { fontSize: 22, fontWeight: "700", flex: 1 },
//     addItemButton: {
//         width: 36,
//         height: 36,
//         borderRadius: 18,
//         justifyContent: "center",
//         alignItems: "center",
//     },
//     addForm: {
//         padding: 16,
//         borderRadius: 12,
//         borderWidth: 1,
//         gap: 8,
//     },
//     categorySelector: {
//         borderWidth: 1,
//         borderRadius: 12,
//         paddingHorizontal: 12,
//         paddingVertical: 14,
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//     },
//     fieldLabel: { fontSize: 13, fontWeight: "600" },
//     categoryValueRow: {
//         flexDirection: "row",
//         alignItems: "center",
//         gap: 4,
//     },
//     quantityRow: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//         paddingVertical: 8,
//     },
//     stepper: {
//         flexDirection: "row",
//         alignItems: "center",
//         gap: 16,
//     },
//     stepperBtn: {
//         width: 32,
//         height: 32,
//         borderRadius: 16,
//         borderWidth: 1,
//         justifyContent: "center",
//         alignItems: "center",
//     },
//     stepperValue: {
//         fontSize: 16,
//         fontWeight: "600",
//         minWidth: 24,
//         textAlign: "center",
//     },
//     itemsList: { gap: 0 },
//     itemRow: {
//         flexDirection: "row",
//         alignItems: "center",
//         justifyContent: "space-between",
//         paddingVertical: 14,
//         paddingHorizontal: 4,
//         borderBottomWidth: StyleSheet.hairlineWidth,
//     },
//     itemInfo: { flex: 1, gap: 2 },
//     itemName: { fontSize: 16, fontWeight: "500" },
//     itemMeta: { fontSize: 13 },
//     removeBtn: { padding: 8 },
//     emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
//     emptyText: { fontSize: 15, textAlign: "center", paddingHorizontal: 20 },
//     buttonContainer: { marginTop: 24 },
// })
