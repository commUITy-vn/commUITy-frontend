import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { openDirections } from "@/features/maps/api/get-directions";
import { useSupportLocations } from "@/features/maps/hooks/useSupportLocations";
import {
  calculateDistanceKm,
  formatDistance,
  type Coordinates,
} from "@/features/maps/utils/geo-calculations";
import { useSupportRequests } from "@/features/support/hooks/useSupportRequests";
import { useTheme } from "@/hooks/useTheme";

let WebView: any;
if (Platform.OS !== "web") {
  WebView = require("react-native-webview").WebView;
}

const HERE_API_KEY = process.env.EXPO_PUBLIC_HERE_API_KEY || "";
const DEFAULT_CENTER: Coordinates = { latitude: 10.8231, longitude: 106.6297 };

type MapItem = {
  id: string;
  type: "REQUEST" | "LOCATION";
  title: string;
  subtitle: string;
  status?: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  distanceLabel: string;
};

const getHereMapHtml = (
  apiKey: string,
  center: Coordinates,
  items: MapItem[],
) => {
  const serializedItems = JSON.stringify(items).replace(/</g, "\\u003c");

  return `
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
      body { margin: 0; padding: 0; overflow: hidden; background: #0F172A; }
      #map { width: 100%; height: 100vh; }
      .pin {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid #fff;
        box-shadow: 0 3px 8px rgba(15, 23, 42, 0.35);
      }
      .pin.request { background: #DC2626; }
      .pin.location { background: #2563EB; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const points = ${serializedItems};
      const platform = new H.service.Platform({ apikey: '${apiKey}' });
      const defaultLayers = platform.createDefaultLayers();
      const map = new H.Map(
        document.getElementById('map'),
        defaultLayers.raster.normal.map,
        {
          center: { lat: ${center.latitude}, lng: ${center.longitude} },
          zoom: 12,
          pixelRatio: window.devicePixelRatio || 1
        }
      );
      const mapEvents = new H.mapevents.MapEvents(map);
      new H.mapevents.Behavior(mapEvents);
      const ui = H.ui.UI.createDefault(map, defaultLayers);
      const group = new H.map.Group();
      map.addObject(group);

      points.forEach((point) => {
        const className = point.type === 'REQUEST' ? 'request' : 'location';
        const icon = new H.map.DomIcon('<div class="pin ' + className + '"></div>');
        const marker = new H.map.DomMarker(
          { lat: point.latitude, lng: point.longitude },
          { icon }
        );
        marker.setData(
          '<strong>' + point.title + '</strong><br />' +
          point.subtitle + '<br />' +
          point.distanceLabel
        );
        marker.addEventListener('tap', (evt) => {
          const bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
            content: evt.target.getData()
          });
          ui.addBubble(bubble);
        });
        group.addObject(marker);
      });

      if (points.length > 0) {
        map.getViewModel().setLookAtData({ bounds: group.getBoundingBox() }, true);
      }
    </script>
  </body>
</html>`;
};

export default function MapScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "REQUEST" | "LOCATION">("ALL");
  const [userOrigin, setUserOrigin] = useState<Coordinates | null>(null);

  const { data: approvedRequests, isLoading: approvedLoading } =
    useSupportRequests("APPROVED");
  const { data: inProgressRequests, isLoading: inProgressLoading } =
    useSupportRequests("IN_PROGRESS");
  const { data: supportLocations, isLoading: locationsLoading } =
    useSupportLocations();

  useEffect(() => {
    if (Platform.OS !== "web" || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserOrigin({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setUserOrigin(null);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  const items = useMemo<MapItem[]>(() => {
    const requests = [...(approvedRequests || []), ...(inProgressRequests || [])]
      .filter((request) => request.latitude && request.longitude)
      .map((request) => {
        const target = {
          latitude: Number(request.latitude),
          longitude: Number(request.longitude),
        };
        return {
          id: request.id,
          type: "REQUEST" as const,
          title: request.title || "Support request",
          subtitle: request.address || request.categoryName || "Support request",
          status: request.status,
          latitude: target.latitude,
          longitude: target.longitude,
          distanceKm: userOrigin
            ? calculateDistanceKm(userOrigin, target)
            : undefined,
          distanceLabel: userOrigin
            ? formatDistance(calculateDistanceKm(userOrigin, target))
            : "Distance unavailable",
        };
      });

    const locations = (supportLocations || [])
      .filter((location) => location.latitude && location.longitude)
      .map((location) => {
        const target = {
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
        };
        return {
          id: location.id,
          type: "LOCATION" as const,
          title: location.name || "Support location",
          subtitle: location.address || "Support location",
          status: location.isActive === false ? "INACTIVE" : "ACTIVE",
          latitude: target.latitude,
          longitude: target.longitude,
          distanceKm: userOrigin
            ? calculateDistanceKm(userOrigin, target)
            : undefined,
          distanceLabel: userOrigin
            ? formatDistance(calculateDistanceKm(userOrigin, target))
            : "Distance unavailable",
        };
      });

    return [...requests, ...locations].sort((a, b) => {
      if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
      if (a.distanceKm === undefined) return 1;
      if (b.distanceKm === undefined) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [approvedRequests, inProgressRequests, supportLocations, userOrigin]);

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = filter === "ALL" || item.type === filter;
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query);
      return matchesType && matchesQuery;
    });
  }, [filter, items, searchQuery]);

  const htmlContent = useMemo(
    () => getHereMapHtml(HERE_API_KEY, userOrigin || DEFAULT_CENTER, visibleItems),
    [userOrigin, visibleItems],
  );

  const isLoading = approvedLoading || inProgressLoading || locationsLoading;

  const handleOpenItem = async (item: MapItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.type === "REQUEST") {
      router.push({ pathname: "/request/[id]", params: { id: item.id } } as any);
    } else {
      router.push(`/location/${item.id}` as any);
    }
  };

  const handleDirections = async (item: MapItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await openDirections({
      latitude: item.latitude,
      longitude: item.longitude,
      label: item.title,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      {Platform.OS === "web" ? (
        <iframe
          key={htmlContent}
          srcDoc={htmlContent}
          style={{ flex: 1, border: "none", width: "100%", height: "100%" }}
        />
      ) : WebView ? (
        <WebView
          key={htmlContent}
          source={{ html: htmlContent }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
        />
      ) : (
        <View style={styles.center}>
          <Text style={{ color: theme.textSupporting }}>Map unavailable</Text>
        </View>
      )}

      <View style={[styles.topPanel, { backgroundColor: theme.componentBG }]}>
        <View style={styles.searchRow}>
          <MaterialIcons
            name="search"
            size={20}
            color={theme.textSupporting}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: theme.text },
              Platform.OS === "web" && ({ outlineStyle: "none" } as any),
            ]}
            placeholder="Search map..."
            placeholderTextColor={theme.textSupporting}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.filters}>
          {(["ALL", "REQUEST", "LOCATION"] as const).map((value) => {
            const selected = filter === value;
            return (
              <Pressable
                key={value}
                onPress={() => setFilter(value)}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: selected
                      ? theme.primary
                      : theme.highlightBG,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? theme.textLight : theme.text,
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {value === "ALL"
                    ? "All"
                    : value === "REQUEST"
                      ? "Requests"
                      : "Locations"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={[styles.legendBadge, { backgroundColor: "#DC2626" }]} />
        <Text style={[styles.legendText, { color: theme.text }]}>SR</Text>
        <View style={[styles.legendBadge, { backgroundColor: "#2563EB" }]} />
        <Text style={[styles.legendText, { color: theme.text }]}>SL</Text>
      </View>

      <View style={styles.bottomContainer}>
        {isLoading ? (
          <View
            style={[
              styles.loadingCard,
              { backgroundColor: theme.componentBG },
            ]}
          >
            <ActivityIndicator color={theme.primary} />
            <Text style={{ color: theme.textSupporting, marginLeft: 8 }}>
              Loading map data...
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {visibleItems.map((item) => (
              <Pressable
                key={`${item.type}-${item.id}`}
                onPress={() => handleOpenItem(item)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: theme.componentBG,
                    borderColor: theme.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.typeDot,
                      {
                        backgroundColor:
                          item.type === "REQUEST" ? "#DC2626" : "#2563EB",
                      },
                    ]}
                  />
                  <Text style={[styles.cardType, { color: theme.textSupporting }]}>
                    {item.type === "REQUEST" ? "SupportRequest" : "SupportLocation"}
                  </Text>
                </View>
                <Text
                  style={[styles.cardTitle, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[styles.cardAddress, { color: theme.textSupporting }]}
                  numberOfLines={2}
                >
                  {item.subtitle}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={[styles.distance, { color: theme.primary }]}>
                    {item.distanceLabel}
                  </Text>
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      handleDirections(item);
                    }}
                    style={[
                      styles.directionButton,
                      { backgroundColor: theme.highlightBG },
                    ]}
                  >
                    <MaterialIcons
                      name="near-me"
                      size={17}
                      color={theme.primary}
                    />
                  </Pressable>
                </View>
              </Pressable>
            ))}
            {visibleItems.length === 0 && (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: theme.componentBG, borderColor: theme.border },
                ]}
              >
                <Text style={{ color: theme.textSupporting }}>
                  No map items found.
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  webview: { ...StyleSheet.absoluteFillObject, backgroundColor: "transparent" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topPanel: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  searchRow: {
    height: 42,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 15,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 8,
  },
  legend: {
    position: "absolute",
    top: 166,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  legendBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: { fontSize: 12, fontWeight: "800", marginRight: 4 },
  bottomContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
  },
  scrollContent: { paddingHorizontal: 16, gap: 12 },
  loadingCard: {
    marginHorizontal: 16,
    minHeight: 76,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  card: {
    width: 252,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  typeDot: { width: 9, height: 9, borderRadius: 5 },
  cardType: { fontSize: 11, fontWeight: "800" },
  cardTitle: { fontSize: 15, fontWeight: "800", marginBottom: 5 },
  cardAddress: { fontSize: 12, lineHeight: 17, minHeight: 34 },
  cardFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  distance: { fontSize: 13, fontWeight: "800" },
  directionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    width: 252,
    minHeight: 88,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  },
});
