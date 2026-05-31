import { Button } from "@/components/ui";
import TextInput from "@/components/ui/TextInput";
import { CATEGORY_LABELS } from "@/features/support/types/support.types";
import { useTheme } from "@/hooks/useTheme";
import { useCreateRequestStore } from "@/stores/useCreateRequestStore";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

let WebView: any;
if (Platform.OS !== "web") {
  WebView = require("react-native-webview").WebView;
}

const HERE_API_KEY = process.env.EXPO_PUBLIC_HERE_API_KEY || "";

export default function CreateRequestDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const webViewRef = useRef<any>(null);

  const {
    category,
    title,
    setTitle,
    description,
    setDescription,
    address,
    setAddress,
    latitude,
    longitude,
    setCoordinates,
  } = useCreateRequestStore();

  const [latStr, setLatStr] = useState(
    latitude ? latitude.toString() : "10.762622",
  );
  const [lngStr, setLngStr] = useState(
    longitude ? longitude.toString() : "106.660172",
  );

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Khởi tạo tọa độ ban đầu nếu chưa có (Ví dụ: Trung tâm TP.HCM)
  useEffect(() => {
    if (!latitude || !longitude) {
      setCoordinates(10.762622, 106.660172);
    }
  }, []);

  // 1. Hàm gọi API tìm kiếm địa điểm (Autocomplete)
  const handleSearchLocation = async (query: string) => {
    setAddress(query);
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://autosuggest.search.hereapi.com/v1/autosuggest?at=${latStr},${lngStr}&limit=5&q=${encodeURIComponent(
          query,
        )}&apiKey=${HERE_API_KEY}&lang=vi`,
      );
      const data = await res.json();
      setSuggestions(data.items || []);
    } catch (error) {
      console.error("Autosuggest Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // 2. Hàm khi chọn 1 địa điểm trong danh sách gợi ý
  const handleSelectSuggestion = (item: any) => {
    if (item.position) {
      const { lat, lng } = item.position;

      setAddress(item.title);
      setCoordinates(lat, lng);
      setLatStr(lat.toString());
      setLngStr(lng.toString());
      setSuggestions([]); // Ẩn danh sách gợi ý

      // Bắn tọa độ mới vào WebView để Map tự cập nhật mà không cần load lại
      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: "SET_LOCATION",
            lat: lat,
            lng: lng,
          }),
        );
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // 3. Script HTML cho bản đồ
  const getHereMapHtml = (lat: string, lng: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" type="text/css" href="https://js.api.here.com/v3/3.2/mapsjs-ui.css" />
        <script src="https://js.api.here.com/v3/3.2/mapsjs-core.js"></script>
        <script src="https://js.api.here.com/v3/3.2/mapsjs-service.js"></script>
        <script src="https://js.api.here.com/v3/3.2/mapsjs-mapevents.js"></script>
        <script src="https://js.api.here.com/v3/3.2/mapsjs-ui.js"></script>
        <style>
          body { margin: 0; padding: 0; overflow: hidden; background-color: ${theme.appBG || "#0F172A"}; }
          #map { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const apiKey = '${HERE_API_KEY}';
          if(apiKey && apiKey !== 'your_api_key_here') {
            const platform = new H.service.Platform({ apikey: apiKey });
            const defaultLayers = platform.createDefaultLayers();
            
            // Khởi tạo Map
            const map = new H.Map(document.getElementById('map'), defaultLayers.raster.normal.map, {
              center: { lat: ${lat}, lng: ${lng} },
              zoom: 15,
              pixelRatio: window.devicePixelRatio || 1
            });
            
            window.addEventListener('resize', () => map.getViewPort().resize());
            const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
            H.ui.UI.createDefault(map, defaultLayers);

            // Thêm Marker
            let marker = new H.map.Marker({ lat: ${lat}, lng: ${lng} });
            map.addObject(marker);

            // Lắng nghe lệnh từ React Native (Khi chọn 1 Suggestion)
            window.addEventListener('message', (event) => {
              try {
                const data = JSON.parse(event.data);
                if (data.type === 'SET_LOCATION') {
                  const newCoord = { lat: data.lat, lng: data.lng };
                  marker.setGeometry(newCoord);
                  
                  // Chuyển động Map mượt mà dời tâm và zoom lại
                  map.getViewModel().setLookAtData({
                    position: newCoord,
                    zoom: 16
                  }, true); // tham số true để bật animation
                }
              } catch(e) {}
            });
          } else {
             document.getElementById('map').innerHTML = '<div style="padding: 20px; text-align: center; color: gray;">Map requires valid API Key</div>';
          }
        </script>
      </body>
    </html>
  `;

  return (
    <KeyboardAvoidingView
      style={[localStyles.container, { backgroundColor: theme.appBG }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* HEADER */}
      <View style={[localStyles.header, { borderColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={localStyles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[localStyles.headerTitle, { color: theme.text }]}>
          Request Details
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={localStyles.content}
        contentContainerStyle={localStyles.contentContainer}
        keyboardShouldPersistTaps="handled" // Cần thiết để bấm vào suggestion ko bị tắt bàn phím ngay lập tức
      >
        <Text style={[localStyles.stepTitle, { color: theme.text }]}>
          Details & Location
        </Text>

        <View style={localStyles.stepIndicator}>
          <View
            style={[localStyles.stepDot, { backgroundColor: theme.border }]}
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

        {category && (
          <View style={localStyles.categoryDisplay}>
            <Text
              style={[localStyles.fieldLabel, { color: theme.textSupporting }]}
            >
              Category
            </Text>
            <Text style={[localStyles.categoryValue, { color: theme.primary }]}>
              {CATEGORY_LABELS[category] || category}
            </Text>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <Text
            style={[localStyles.fieldLabel, { color: theme.textSupporting }]}
          >
            Title
          </Text>
          <TextInput
            placeholder="E.g. Need medical supplies"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text
            style={[localStyles.fieldLabel, { color: theme.textSupporting }]}
          >
            Description
          </Text>
          <TextInput
            placeholder="Describe the situation and what is needed..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: "top" }}
          />
        </View>

        {/* ================= MAP & LOCATION SECTION ================= */}
        <View style={{ gap: 8, zIndex: 10 }}>
          <Text
            style={[localStyles.fieldLabel, { color: theme.textSupporting }]}
          >
            Location Address
          </Text>

          <View style={{ position: "relative", zIndex: 20 }}>
            <TextInput
              placeholder="Search address..."
              value={address}
              onChangeText={handleSearchLocation}
            />
            {isSearching ? (
              <ActivityIndicator
                style={{ position: "absolute", right: 10, top: 15 }}
                color={theme.primary}
              />
            ) : null}

            {/* Dropdown Gợi ý nổi (Đã fix lỗi Text node rỗng) */}
            {suggestions.length > 0 ? (
              <View
                style={[
                  localStyles.suggestionDropdown,
                  {
                    backgroundColor: theme.componentBG,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ScrollView keyboardShouldPersistTaps="handled">
                  {suggestions.map((item: any, index: number) => (
                    <Pressable
                      key={item.id || index.toString()}
                      style={[
                        localStyles.suggestionItem,
                        {
                          borderBottomColor: theme.border,
                          borderBottomWidth:
                            index === suggestions.length - 1
                              ? 0
                              : StyleSheet.hairlineWidth,
                        },
                      ]}
                      onPress={() => handleSelectSuggestion(item)}
                    >
                      <MaterialIcons
                        name="place"
                        size={20}
                        color={theme.textSupporting}
                      />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ color: theme.text, fontWeight: "500" }}>
                          {item.title}
                        </Text>
                        {/* Toán tử ba ngôi bắt buộc để tránh crash app */}
                        {typeof item.address?.label === "string" &&
                        item.address.label.length > 0 ? (
                          <Text
                            style={{
                              color: theme.textSupporting,
                              fontSize: 12,
                            }}
                          >
                            {item.address.label}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>

          {/* Bản đồ */}
          <View
            style={[
              localStyles.mapContainer,
              {
                borderColor: theme.border,
                height: 250,
                borderRadius: 12,
                overflow: "hidden",
                marginTop: 10,
              },
            ]}
          >
            {Platform.OS === "web" ? (
              <iframe
                id="map-iframe"
                srcDoc={getHereMapHtml(latStr, lngStr)}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            ) : WebView ? (
              <WebView
                ref={webViewRef}
                originWhitelist={["*"]}
                source={{ html: getHereMapHtml(latStr, lngStr) }}
                style={{ flex: 1 }}
              />
            ) : null}
          </View>
        </View>

        <Button
          title="Continue"
          onPress={() => router.push("/create-request/urgency")}
          disabled={!title || !description || !address}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStaticMapHtml = (lat: number, lng: number) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <script src="https://js.api.here.com/v3/3.2/mapsjs-core.js"></script>
      <script src="https://js.api.here.com/v3/3.2/mapsjs-service.js"></script>
      <script src="https://js.api.here.com/v3/3.2/mapsjs-mapevents.js"></script>
      <style>
        body { margin: 0; background-color: #0F172A; }
        #map { width: 100vw; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const platform = new H.service.Platform({ apikey: '${HERE_API_KEY}' });
        const defaultLayers = platform.createDefaultLayers();
        const map = new H.Map(
          document.getElementById('map'),
          defaultLayers.raster.normal.map, // Đảm bảo đồng bộ kiểu bản đồ
          { center: { lat: ${lat}, lng: ${lng} }, zoom: 15 }
        );
        new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
        map.addObject(new H.map.Marker({ lat: ${lat}, lng: ${lng} }));
      </script>
    </body>
  </html>
`;

const localStyles = StyleSheet.create({
  container: { flex: 1 },
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
  content: { flex: 1 },
  contentContainer: { padding: 20, gap: 16, paddingBottom: 40 },
  stepTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  categoryDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  fieldLabel: { fontSize: 13, fontWeight: "600" },
  categoryValue: { fontSize: 15, fontWeight: "500" },
  suggestionDropdown: {
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
    maxHeight: 220,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 999,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  mapContainer: {
    borderWidth: 1,
  },
});
