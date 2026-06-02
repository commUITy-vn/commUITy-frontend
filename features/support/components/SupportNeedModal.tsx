import { BottomSheet, Button } from "@/components/ui";
import TextInput from "@/components/ui/TextInput";
import { useTheme } from "@/hooks/useTheme";
import { MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { createSupportNeed } from "../api/create-support-need";
import { updateSupportNeed } from "../api/update-support-need";

// Khai báo chuẩn xác list Enum theo schema db.txt
const SUPPORT_NEED_UNITS = [
  "VND",
  "PIECE",
  "KG",
  "LITER",
  "BOX",
  "PACKAGE",
  "SET",
  "PERSON",
  "OTHER",
];

const GOODS_SUPPORT_NEED_UNITS = SUPPORT_NEED_UNITS.filter((u) => u !== "VND");

interface Props {
  visible: boolean;
  onClose: () => void;
  requestId: string;
  initialData?: any;
}

export const SupportNeedModal = ({
  visible,
  onClose,
  requestId,
  initialData,
}: Props) => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // Dùng string nguyên bản để tránh lỗi Enum
  const [category, setCategory] = useState("GOODS");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("PIECE");
  const [quantity, setQuantity] = useState("1");

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const availableUnits =
    category === "MONEY" ? ["VND"] : GOODS_SUPPORT_NEED_UNITS;

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.supportType || "GOODS");
      setName(initialData.needName || "");
      setUnit(initialData.unit || "PIECE");
      setQuantity(initialData.requiredQuantity?.toString() || "1");
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setCategory("GOODS");
    setName("");
    setUnit("PIECE");
    setQuantity("1");
  };

  const mutation = useMutation({
    mutationFn: (data: any) =>
      initialData
        ? updateSupportNeed(initialData.id, data)
        : createSupportNeed(requestId, data),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["supportNeeds", requestId] });
      queryClient.invalidateQueries({
        queryKey: ["supportRequest", requestId],
      });
      onClose();
      resetForm();
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Failed to save support need:", error);
    },
  });

  const handleSubmit = async () => {
    if (!name.trim() || !quantity) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const supportType = category.toUpperCase() === "MONEY" ? "MONEY" : "GOODS";

    // Chuẩn hóa chuẩn Payload cho backend Prisma
    const payload = {
      supportType,
      needName: name.trim(),
      unit: supportType === "MONEY" ? "VND" : unit.toUpperCase(),
      requiredQuantity: parseFloat(quantity) || 1, // Ép kiểu Float
    };

    mutation.mutate(payload);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.content, { backgroundColor: theme.appBG }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {initialData ? "Edit Need" : "Add Item Need"}
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <MaterialIcons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[
                styles.addForm,
                {
                  backgroundColor: theme.highlightBG,
                  borderColor: theme.border,
                },
              ]}
            >
              <Pressable
                onPress={() => setShowCategoryPicker(true)}
                style={[styles.pickerRow, { borderColor: theme.border }]}
              >
                <Text
                  style={[styles.fieldLabel, { color: theme.textSupporting }]}
                >
                  Category
                </Text>
                <View style={styles.pickerValueGroup}>
                  <Text style={{ color: theme.text, fontSize: 16 }}>
                    {category}
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={theme.icon}
                  />
                </View>
              </Pressable>

              <TextInput label="Name" value={name} onChangeText={setName} />

              <Pressable
                onPress={() => setShowUnitPicker(true)}
                style={[styles.pickerRow, { borderColor: theme.border }]}
              >
                <Text
                  style={[styles.fieldLabel, { color: theme.textSupporting }]}
                >
                  Unit
                </Text>
                <View style={styles.pickerValueGroup}>
                  <Text style={{ color: theme.text, fontSize: 16 }}>
                    {unit}
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={theme.icon}
                  />
                </View>
              </Pressable>

              <View style={styles.quantityRow}>
                <Text
                  style={[styles.fieldLabel, { color: theme.textSupporting }]}
                >
                  Quantity
                </Text>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() =>
                      setQuantity(
                        Math.max(1, parseInt(quantity) - 1).toString(),
                      )
                    }
                    style={[styles.stepperBtn, { borderColor: theme.border }]}
                  >
                    <Text style={{ color: theme.text, fontSize: 18 }}>−</Text>
                  </Pressable>
                  <Text style={[styles.stepperValue, { color: theme.text }]}>
                    {quantity}
                  </Text>
                  <Pressable
                    onPress={() =>
                      setQuantity((parseInt(quantity) + 1).toString())
                    }
                    style={[styles.stepperBtn, { borderColor: theme.border }]}
                  >
                    <Text style={{ color: theme.text, fontSize: 18 }}>+</Text>
                  </Pressable>
                </View>
              </View>

              <Button
                text={initialData ? "Update Item" : "Add Item"}
                onPress={handleSubmit}
                size="medium"
                primary
                isLoading={mutation.isPending}
                isDisabled={!name.trim()}
                style={{ marginTop: 8 }}
              />
            </View>
          </ScrollView>
        </View>

        {/* Picker Category Type */}
        <BottomSheet
          isVisible={showCategoryPicker}
          onClose={() => setShowCategoryPicker(false)}
          options={[
            {
              key: "GOODS",
              label: "Goods",
              onPress: () => {
                setCategory("GOODS");
                if (unit === "VND") setUnit("PIECE");
                setShowCategoryPicker(false);
              },
            },
            {
              key: "MONEY",
              label: "Money",
              onPress: () => {
                setCategory("MONEY");
                setUnit("VND");
                setShowCategoryPicker(false);
              },
            },
          ]}
        />

        {/* Picker Unit */}
        <BottomSheet
          isVisible={showUnitPicker}
          onClose={() => setShowUnitPicker(false)}
          options={availableUnits.map((u) => ({
            key: u,
            label: u,
            onPress: () => {
              setUnit(u);
              setShowUnitPicker(false);
            },
          }))}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  content: { borderTopLeftRadius: 24, borderTopRightRadius: 24, height: "85%" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: 20, paddingBottom: 40 },
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
});
