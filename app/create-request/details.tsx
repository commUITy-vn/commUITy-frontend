import { Button } from "@/components/ui";
import { geocodeAddress } from "@/features/maps/api/geocode-address";
import TextInput from "@/components/ui/TextInput";
import { useTheme } from "@/hooks/useTheme";
import { useCreateRequestStore } from "@/stores/useCreateRequestStore";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
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
    latitude ? latitude.toString() : "10.8231",
  );
  const [lngStr, setLngStr] = useState(
    longitude ? longitude.toString() : "106.6297",
  );
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(address);

  useEffect(() => {
    if (!latitude || !longitude) {
      setCoordinates(10.8231, 106.6297);
    }
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    try {
      // Đặt limit=5 theo yêu cầu
      const res = await fetch(
        `https://autosuggest.search.hereapi.com/v1/autosuggest?at=${latStr},${lngStr}&limit=5&q=${encodeURIComponent(query)}&apiKey=${HERE_API_KEY}&lang=vi`,
      );
      const data = await res.json();
      const validItems = (data.items || []).filter(
        (item: any) => item.position,
      );
      setSuggestions(validItems);
    } catch (error) {
      console.error("Autosuggest Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchLocation = (text: string) => {
    setAddress(text);
    setSelectedAddress("");
    setIsSearching(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => fetchSuggestions(text), 600);
  };

  const handleSelectSuggestion = (item: any) => {
    const { lat, lng } = item.position;
    const fullAddress = item.address?.label || item.title;
    setAddress(fullAddress);
    setSelectedAddress(fullAddress);
    setCoordinates(lat, lng);
    setLatStr(lat.toString());
    setLngStr(lng.toString());
    setSuggestions([]);

    const message = JSON.stringify({ type: "SET_LOCATION", lat, lng });
    if (Platform.OS === "web") {
      const iframe = document.getElementById("map-iframe") as HTMLIFrameElement;
      iframe?.contentWindow?.postMessage(message, "*");
    } else {
      webViewRef.current?.postMessage(message);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleContinue = async () => {
    if (!title.trim() || !address.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (selectedAddress !== address || !latitude || !longitude) {
      setIsResolvingAddress(true);
      try {
        const resolved = await geocodeAddress(address);
        if (!resolved) {
          setIsResolvingAddress(false);
          Alert.alert(
            "Invalid address",
            "Could not resolve this address. Please choose a valid address from suggestions.",
          );
          return;
        }
        setAddress(resolved.address);
        setSelectedAddress(resolved.address);
        setCoordinates(resolved.latitude, resolved.longitude);
        setLatStr(resolved.latitude.toString());
        setLngStr(resolved.longitude.toString());
      } finally {
        setIsResolvingAddress(false);
      }
    }

    router.push("/create-request/items");
  };

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
          body { margin: 0; padding: 0; overflow: hidden; background-color: #0F172A; }
          #map { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const apiKey = '${HERE_API_KEY}';
          const platform = new H.service.Platform({ apikey: apiKey });
          const defaultLayers = platform.createDefaultLayers();
          
          // Dùng raster.normal.map như file here-map.html mẫu
          const map = new H.Map(
            document.getElementById('map'), 
            defaultLayers.raster.normal.map, 
            {
              center: { lat: ${lat}, lng: ${lng} },
              zoom: 15,
              pixelRatio: window.devicePixelRatio || 1
            }
          );
          
          const mapEvents = new H.mapevents.MapEvents(map);
          new H.mapevents.Behavior(mapEvents);
          H.ui.UI.createDefault(map, defaultLayers);

          let marker = new H.map.Marker({ lat: ${lat}, lng: ${lng} });
          map.addObject(marker);

          window.addEventListener('message', (event) => {
            try {
              const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              if (data.type === 'SET_LOCATION') {
                const newPos = { lat: data.lat, lng: data.lng };
                marker.setGeometry(newPos);
                // Hiệu ứng mượt mà (true)
                map.getViewModel().setLookAtData({ position: newPos, zoom: 16 }, true);
              }
            } catch(e) {}
          });
        </script>
      </body>
    </html>
  `;

  return (
    <KeyboardAvoidingView
      style={[localStyles.container, { backgroundColor: theme.appBG }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[localStyles.header, { borderColor: theme.border }]}>
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
          Request Details
        </Text>
        <View style={{ width: 48 }} />
      </View>
      {/* Step indicator: Bước 3/4 */}
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
          Details & Location
        </Text>

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
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text
            style={[localStyles.fieldLabel, { color: theme.textSupporting }]}
          >
            Description
          </Text>
          <TextInput
            placeholder="Describe the situation..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{ height: 80, textAlignVertical: "top" }}
          />
        </View>

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
            {isSearching && (
              <ActivityIndicator
                style={{ position: "absolute", right: 10, top: 15 }}
                color={theme.primary}
              />
            )}

            {suggestions.length > 0 && (
              <View
                style={[
                  localStyles.suggestionDropdown,
                  {
                    backgroundColor: theme.componentBG,
                    borderColor: theme.border,
                  },
                ]}
              >
                {suggestions.map((item, index) => (
                  <Pressable
                    key={item.id || index}
                    style={localStyles.suggestionItem}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <MaterialIcons
                      name="place"
                      size={18}
                      color={theme.primary}
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text
                        style={{ color: theme.text, fontWeight: "600" }}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={{ color: theme.textSupporting, fontSize: 12 }}
                        numberOfLines={1}
                      >
                        {item.address.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View
            style={[localStyles.mapContainer, { borderColor: theme.border }]}
          >
            {Platform.OS === "web" ? (
              <iframe
                id="map-iframe"
                srcDoc={getHereMapHtml(latStr, lngStr)}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            ) : (
              <WebView
                ref={webViewRef}
                originWhitelist={["*"]}
                source={{ html: getHereMapHtml(latStr, lngStr) }}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>

        <Button
          text={isResolvingAddress ? "Resolving address..." : "Continue"}
          onPress={handleContinue}
          disabled={!title.trim() || !address.trim() || isResolvingAddress}
          primary
          size="large"
          style={{ marginTop: 10 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 12 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  content: { flex: 1 },
  contentContainer: { padding: 20, gap: 16, paddingBottom: 40 },
  stepTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: "600" },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 12,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  suggestionDropdown: {
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 999,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  mapContainer: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginTop: 8,
  },
});
