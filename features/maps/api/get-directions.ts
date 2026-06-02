import { Linking, Platform } from "react-native";

type DirectionTarget = {
  latitude: number;
  longitude: number;
  label?: string;
};

export async function openDirections(target: DirectionTarget): Promise<void> {
  const { latitude, longitude, label } = target;
  const latLng = `${latitude},${longitude}`;
  const encodedLabel = label ? encodeURIComponent(label) : "";
  const nativeLabel = encodedLabel ? `(${encodedLabel})` : "";

  const urls =
    Platform.OS === "ios"
      ? [`maps://0,0?q=${latLng}${nativeLabel}`]
      : Platform.OS === "android"
        ? [`geo:0,0?q=${latLng}${nativeLabel}`]
        : [];

  urls.push(`https://www.google.com/maps/dir/?api=1&destination=${latLng}`);

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
