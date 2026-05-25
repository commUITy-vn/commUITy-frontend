import { Button } from "@/components/ui";
import TextInput from "@/components/ui/TextInput";
import { CATEGORY_LABELS } from "@/features/support/types/support.types";
import { useTheme } from "@/hooks/useTheme";
import { useCreateRequestStore } from "@/stores/useCreateRequestStore";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function CreateRequestDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();

  // Giả sử bạn đã thêm latitude và longitude vào store
  const {
    category,
    title,
    setTitle,
    description,
    setDescription,
    location,
    setLocation,
    // latitude,
    // longitude,
    // setCoordinates
  } = useCreateRequestStore();

  // State tạm để giả lập việc mở HERE Map của đồng đội
  const [showMap, setShowMap] = useState(false);

  const canProceed =
    category && title.trim().length > 0 && location.trim().length > 0;

  const handleNext = async () => {
    if (!canProceed) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // 1. Ẩn trang urgency: Chuyển thẳng tới items
    router.push("/create-request/items");
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
          Details
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Step indicator: Giảm xuống còn 4 bước */}
      <View style={localStyles.stepIndicator}>
        <View
          style={[localStyles.stepDot, { backgroundColor: theme.success }]}
        />
        <View
          style={[localStyles.stepDot, { backgroundColor: theme.primary }]}
        />
        <View
          style={[localStyles.stepDot, { backgroundColor: theme.border }]}
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
        <Text style={[localStyles.stepTitle, { color: theme.text }]}>
          Describe your request
        </Text>

        {/* Category display (Fix lỗi TS bằng as keyof typeof) */}
        <View style={localStyles.categoryDisplay}>
          <Text
            style={[localStyles.fieldLabel, { color: theme.textSupporting }]}
          >
            Category
          </Text>
          <Text style={[localStyles.categoryValue, { color: theme.text }]}>
            {category
              ? CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]
              : "Not selected"}
          </Text>
        </View>

        {/* Title */}
        <TextInput
          label="What do you need?"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <TextInput
          label="Describe your situation in detail.."
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ height: 120, textAlignVertical: "top", paddingTop: 24 }}
        />

        {/* Location & HERE Map Integration */}
        <View style={localStyles.mapSection}>
          <Text
            style={[
              localStyles.fieldLabel,
              { color: theme.textSupporting, marginBottom: 8 },
            ]}
          >
            Location (Map)
          </Text>

          {/* TextInput hiển thị địa chỉ text */}
          <TextInput
            label="Address string..."
            value={location}
            onChangeText={setLocation}
          />

          {/* Nút để mở component HERE Map của đồng đội */}
          <Button
            text="Pin Location on HERE Map"
            variant="outline"
            icon={<MaterialIcons name="map" size={18} color={theme.primary} />}
            onPress={() => setShowMap(true)}
            style={{ marginTop: 8 }}
          />

          {/* Hiển thị tọa độ nếu có */}
          {/* {latitude && longitude && (
                        <Text style={{ color: theme.success, fontSize: 12, marginTop: 4 }}>
                            Pinned: Lat {latitude.toFixed(4)}, Long {longitude.toFixed(4)}
                        </Text>
                    )} */}
        </View>

        {/* Next button */}
        <View style={localStyles.buttonContainer}>
          <Button
            text="Next to Items"
            onPress={handleNext}
            size="large"
            primary
            isDisabled={!canProceed}
          />
        </View>
      </ScrollView>

      {/* TODO: Chèn Component HERE Map của bạn kia vào đây */}
      {/* {showMap && (
                <HereMapModal 
                    onClose={() => setShowMap(false)}
                    onSelect={(lat, long, address) => {
                        setCoordinates(lat, long);
                        setLocation(address);
                        setShowMap(false);
                    }}
                />
            )} */}
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
  stepTitle: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  categoryDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  fieldLabel: { fontSize: 13, fontWeight: "600" },
  categoryValue: { fontSize: 15, fontWeight: "500" },
  mapSection: { marginTop: 8 },
  buttonContainer: { marginTop: 24 },
});

// import React from "react"
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
// import { useThemeStyles } from "@/hooks/useThemeStyles"
// import { useCreateRequestStore } from "@/stores/useCreateRequestStore"
// import TextInput from "@/components/ui/TextInput"
// import { Button } from "@/components/ui"
// import { CATEGORY_LABELS } from "@/features/support/types/support.types"

// export default function CreateRequestDetailsScreen() {
//     const router = useRouter()
//     const theme = useTheme()
//     const themeStyles = useThemeStyles()
//     const {
//         category,
//         title,
//         setTitle,
//         description,
//         setDescription,
//         location,
//         setLocation,
//     } = useCreateRequestStore()

//     const canProceed = category && title.trim().length > 0

//     const handleNext = async () => {
//         if (!canProceed) return
//         await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
//         router.push("/create-request/urgency")
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
//                     Details
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
//                         { backgroundColor: theme.primary },
//                     ]}
//                 />
//                 <View
//                     style={[
//                         localStyles.stepDot,
//                         { backgroundColor: theme.border },
//                     ]}
//                 />
//                 <View
//                     style={[
//                         localStyles.stepDot,
//                         { backgroundColor: theme.border },
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
//                 <Text style={[localStyles.stepTitle, { color: theme.text }]}>
//                     Describe your request
//                 </Text>

//                 {/* Category display */}
//                 <View style={localStyles.categoryDisplay}>
//                     <Text
//                         style={[
//                             localStyles.fieldLabel,
//                             { color: theme.textSupporting },
//                         ]}
//                     >
//                         Category
//                     </Text>
//                     <Text
//                         style={[
//                             localStyles.categoryValue,
//                             { color: theme.text },
//                         ]}
//                     >
//                         {category ? CATEGORY_LABELS[category] : "Not selected"}
//                     </Text>
//                 </View>

//                 {/* Title */}
//                 <TextInput
//                     label="What do you need?"
//                     value={title}
//                     onChangeText={setTitle}
//                 />

//                 {/* Description */}
//                 <TextInput
//                     label="Describe your situation in detail.."
//                     value={description}
//                     onChangeText={setDescription}
//                     multiline
//                     style={{ height: 120, textAlignVertical: 'top', paddingTop: 24 }}
//                 />

//                 {/* Location */}
//                 <TextInput
//                     label="Location"
//                     value={location}
//                     onChangeText={setLocation}
//                 />

//                 {/* Next button */}
//                 <View style={localStyles.buttonContainer}>
//                     <Button
//                         text="Next"
//                         onPress={handleNext}
//                         size="large"
//                         primary
//                         isDisabled={!canProceed}
//                     />
//                 </View>
//             </ScrollView>
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
//     stepTitle: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
//     categoryDisplay: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//         paddingVertical: 8,
//     },
//     fieldLabel: { fontSize: 13, fontWeight: "600" },
//     categoryValue: { fontSize: 15, fontWeight: "500" },
//     buttonContainer: { marginTop: 24 },
// })
