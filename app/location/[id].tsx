import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView, Platform, Linking } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSupportLocation } from '@/features/maps/hooks/useSupportLocation';
import { BottomSheet } from '@/components/ui';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';

// Conditional imports for WebView
let WebView: any;
if (Platform.OS !== "web") {
  try {
    WebView = require("react-native-webview").WebView;
  } catch (e) {
    console.warn("WebView failed to load on non-web platform:", e);
  }
}

const getFullMapHtml = (latitude: number, longitude: number, label: string, theme: any) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            html, body { margin: 0; padding: 0; height: 100%; width: 100%; background-color: ${theme.appBG}; overflow: hidden; }
            #map { height: 100%; width: 100%; }
            .leaflet-bar { border: none !important; box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important; }
            .leaflet-bar a { background-color: ${theme.componentBG} !important; color: ${theme.text} !important; border-bottom: 1px solid ${theme.border} !important; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            var map = L.map('map', {
                zoomControl: true,
                dragging: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                touchZoom: true
            }).setView([${latitude}, ${longitude}], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(map);
            L.marker([${latitude}, ${longitude}]).addTo(map)
                .bindPopup("<b>${label.replace(/"/g, '\\"')}</b>")
                .openPopup();
        </script>
    </body>
    </html>
  `;
};

export default function LocationDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isShareSheetVisible, setIsShareSheetVisible] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);

  const { data: location, isLoading, isError } = useSupportLocation(id);

  useEffect(() => {
    if (isShareSheetVisible) {
      setIsConversationsLoading(true);
      api.get<any>('/api/v1/conversations/me')
        .then((res) => {
          setConversations(res || []);
        })
        .catch((err) => {
          console.error('Failed to load conversations for sharing:', err);
        })
        .finally(() => {
          setIsConversationsLoading(false);
        });
    }
  }, [isShareSheetVisible]);

  const handleShareLocation = async (conversationId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const payload = {
        content: `[SHARED_ITEM:LOCATION:${id}:${location?.name || 'Location Hub'}]`,
      };
      await api.post(`/api/v1/conversations/${conversationId}/messages`, payload);
      Alert.alert('Success', 'Location shared successfully!');
      setIsShareSheetVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to share location.');
    }
  };

  const handleOpenDirections = async () => {
    if (!location || !location.latitude || !location.longitude) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const latLng = `${location.latitude},${location.longitude}`;
    const name = location.name ? encodeURIComponent(location.name) : '';
    
    const iosUrl = `maps://0,0?q=${latLng}(${name})`;
    const androidUrl = `geo:0,0?q=${latLng}(${name})`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    
    if (Platform.OS === 'ios') {
      try {
        const canOpen = await Linking.canOpenURL(iosUrl);
        if (canOpen) {
          await Linking.openURL(iosUrl);
          return;
        }
      } catch (e) {
        console.warn("Could not open native maps scheme:", e);
      }
    } else if (Platform.OS === 'android') {
      try {
        const canOpen = await Linking.canOpenURL(androidUrl);
        if (canOpen) {
          await Linking.openURL(androidUrl);
          return;
        }
      } catch (e) {
        console.warn("Could not open native maps scheme:", e);
      }
    }
    
    try {
      await Linking.openURL(webUrl);
    } catch (e) {
      console.error("Could not open web maps URL:", e);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError || !location) {
    return (
      <View style={[styles.container, { backgroundColor: theme.appBG, justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialIcons name="error-outline" size={48} color={theme.danger} />
        <Text style={{ color: theme.text, marginTop: 12, fontSize: 16 }}>Failed to load location details</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.primary, fontWeight: '600' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const options = [
    {
      key: 'share',
      label: 'Share Location Hub',
      icon: 'share' as any,
      onPress: () => {
        setIsOptionsVisible(false);
        requestAnimationFrame(() => {
          setIsShareSheetVisible(true);
        });
      },
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.appBG,
          height: (Platform.OS === 'web' ? '100vh' : '100%') as any,
          maxHeight: (Platform.OS === 'web' ? '100vh' : undefined) as any,
        },
      ]}
    >
      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border, backgroundColor: theme.appBG }]}>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Location Hub</Text>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsOptionsVisible(true);
          }}
          style={styles.backButton}
        >
          <MaterialIcons name="more-vert" size={24} color={theme.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title and details block */}
        <View style={styles.detailsBlock}>
          <Text style={[styles.title, { color: theme.text }]}>{location.name}</Text>
          
          {location.description ? (
            <Text style={[styles.description, { color: theme.textSupporting }]}>
              {location.description}
            </Text>
          ) : null}

          <View style={styles.infoRow}>
            <Ionicons name="pin" size={18} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>{location.address}</Text>
          </View>

          {location.contactPhone ? (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={18} color={theme.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>{location.contactPhone}</Text>
            </View>
          ) : null}
        </View>

        {/* Beautiful taller interactive Leaflet Map */}
        <View style={[styles.mapContainer, { borderColor: theme.border, backgroundColor: theme.highlightBG }]}>
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={getFullMapHtml(location.latitude, location.longitude, location.name, theme)}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : WebView ? (
            <WebView
              source={{ html: getFullMapHtml(location.latitude, location.longitude, location.name, theme) }}
              style={{ flex: 1 }}
              domStorageEnabled
              javaScriptEnabled
            />
          ) : (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: theme.textSupporting, fontSize: 12 }}>Map preview unavailable</Text>
            </View>
          )}
        </View>

        {/* Directions button */}
        <Pressable
          onPress={handleOpenDirections}
          style={({ pressed }) => [
            styles.directionsButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.9 : 1,
            }
          ]}
        >
          <Ionicons name="navigate-circle" size={20} color={theme.textLight} />
          <Text style={[styles.directionsButtonText, { color: theme.textLight }]}>
            Get Directions
          </Text>
        </Pressable>
      </ScrollView>

      {/* Options BottomSheet */}
      <BottomSheet
        isVisible={isOptionsVisible}
        onClose={() => setIsOptionsVisible(false)}
        title="Location Options"
        options={options}
      />

      {/* Share Target BottomSheet */}
      <BottomSheet
        isVisible={isShareSheetVisible}
        onClose={() => setIsShareSheetVisible(false)}
        title="Share Location Hub"
      >
        <View style={{ paddingBottom: 24, maxHeight: 400, width: '100%' }}>
          {isConversationsLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 20 }} />
          ) : conversations.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: theme.textSupporting, textAlign: 'center' }}>No active chats found</Text>
            </View>
          ) : (
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              {conversations.map((c: any) => {
                const otherMember = c.members?.find((m: any) => m.userId !== user?.id);
                const chatName = otherMember?.fullName || 'User';
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => handleShareLocation(c.id)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 14,
                      paddingHorizontal: 20,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.border,
                      backgroundColor: pressed ? theme.activeComponentBG : 'transparent',
                    })}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: theme.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ color: theme.textSupporting, fontSize: 14, fontWeight: '700' }}>
                        {chatName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '500' }}>
                      {chatName}
                    </Text>
                    <MaterialIcons name="send" size={18} color={theme.primary} />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailsBlock: {
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  mapContainer: {
    height: 350,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    minHeight: 48,
  },
  directionsButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
