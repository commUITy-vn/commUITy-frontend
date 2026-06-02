import type { Coordinates } from "@/features/maps/utils/geo-calculations";

const HERE_API_KEY = process.env.EXPO_PUBLIC_HERE_API_KEY || "";

export type GeocodedAddress = Coordinates & {
  address: string;
};

export async function geocodeAddress(query: string): Promise<GeocodedAddress | null> {
  const trimmed = query.trim();
  if (!trimmed || !HERE_API_KEY) return null;

  const response = await fetch(
    `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(
      trimmed,
    )}&limit=1&apiKey=${HERE_API_KEY}&lang=vi`,
  );
  const data = await response.json();
  const item = data.items?.[0];
  if (!item?.position) return null;

  return {
    address: item.address?.label || item.title || trimmed,
    latitude: Number(item.position.lat),
    longitude: Number(item.position.lng),
  };
}
