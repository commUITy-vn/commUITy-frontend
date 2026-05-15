import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TextInput, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';

const HERE_API_KEY = process.env.EXPO_PUBLIC_HERE_API_KEY || '';

const getHereMapHtml = (apiKey: string) => `
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
      body { margin: 0; padding: 0; overflow: hidden; }
      #map { width: 100%; height: 100vh; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const platform = new H.service.Platform({ apikey: '${apiKey}' });
      const defaultLayers = platform.createDefaultLayers();
      const map = new H.Map(
        document.getElementById('map'),
        defaultLayers.raster.normal.map,
        { center: { lat: 10.8231, lng: 106.6297 }, zoom: 12 }
      );
      const mapEvents = new H.mapevents.MapEvents(map);
      new H.mapevents.Behavior(mapEvents);
      H.ui.UI.createDefault(map, defaultLayers);
    </script>
  </body>
</html>
`;

const DUMMY_LOCATIONS = [
  { id: 1, name: 'District 1 Support Center', address: '123 Nguyen Hue, D1, HCMC' },
  { id: 2, name: 'District 7 Support Hub', address: '456 Phu My Hung, D7, HCMC' },
];

const NativeWebView = WebView as any;

export default function MapScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const htmlContent = getHereMapHtml(HERE_API_KEY);

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <iframe
          src={`/here-map.html?apikey=${HERE_API_KEY}`}
          style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
        />
      ) : (
        <NativeWebView
          source={{ html: htmlContent }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
        />
      )}

      {/* Search Bar Overlay */}
      <View style={[styles.searchBar, { backgroundColor: theme.componentBG, zIndex: 10 }]}>
        <MaterialIcons name="search" size={20} color={theme.textSupporting} style={{ marginRight: 8 }} />
        <TextInput
          style={[
            { flex: 1, color: theme.text, padding: 0 },
            Platform.OS === 'web' && { outlineStyle: 'none' } as any
          ]}
          placeholder="Search locations..."
          placeholderTextColor={theme.textSupporting}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Bottom Support Locations ScrollView */}
      <View style={[styles.bottomContainer, { pointerEvents: 'box-none', zIndex: 10 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          pointerEvents="box-none"
        >
          {DUMMY_LOCATIONS.map((location) => (
            <View key={location.id} style={[styles.card, { backgroundColor: theme.componentBG, pointerEvents: 'auto' }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{location.name}</Text>
              <Text style={[styles.cardAddress, { color: theme.textSupporting }]}>{location.address}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  webview: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  searchBar: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
  },
  scrollContent: { paddingHorizontal: 16, gap: 12 },
  card: {
    width: 200,
    padding: 16,
    borderRadius: 8,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  cardAddress: { fontSize: 12 },
});