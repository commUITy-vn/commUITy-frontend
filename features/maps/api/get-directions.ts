import { Linking, Platform } from "react-native";

type DirectionTarget = {
  latitude: number;
  longitude: number;
  label?: string;
};

type DirectionOrigin = {
  latitude: number;
  longitude: number;
};

export async function openDirections(
  target: DirectionTarget,
  origin?: DirectionOrigin | null,
): Promise<void> {
  const { latitude, longitude, label } = target;
  const latLng = `${latitude},${longitude}`;
  const originLatLng = origin ? `${origin.latitude},${origin.longitude}` : "";
  const encodedLabel = label ? encodeURIComponent(label) : "";
  const nativeLabel = encodedLabel ? `(${encodedLabel})` : "";
  const googleDirectionsUrl =
    `https://www.google.com/maps/dir/?api=1&destination=${latLng}` +
    `${originLatLng ? `&origin=${originLatLng}` : ""}` +
    "&travelmode=driving&dir_action=navigate";

  const urls =
    Platform.OS === "ios"
      ? [googleDirectionsUrl, `maps://0,0?q=${latLng}${nativeLabel}`]
      : Platform.OS === "android"
        ? [googleDirectionsUrl, `geo:0,0?q=${latLng}${nativeLabel}`]
        : [];

  urls.push(googleDirectionsUrl);

  for (const url of urls) {
    try {
      if (Platform.OS === "web" || (await Linking.canOpenURL(url))) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // Try the next URL fallback.
    }
  }
}
