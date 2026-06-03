const HERE_API_KEY = process.env.EXPO_PUBLIC_HERE_API_KEY || "";

export interface AddressSuggestion {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
}

export async function searchAddressSuggestions(
  query: string,
  center: { latitude: number; longitude: number },
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2 || !HERE_API_KEY) return [];

  const response = await fetch(
    `https://autosuggest.search.hereapi.com/v1/autosuggest?at=${center.latitude},${center.longitude}&limit=5&q=${encodeURIComponent(
      trimmed,
    )}&apiKey=${HERE_API_KEY}&lang=vi`,
  );
  const json = await response.json();
  const items = Array.isArray(json.items) ? json.items : [];

  return items
    .filter((item: any) => item.position?.lat && item.position?.lng)
    .map((item: any) => ({
      id: item.id || `${item.position.lat},${item.position.lng}`,
      title: item.title || item.address?.label || trimmed,
      address: item.address?.label || item.title || trimmed,
      latitude: Number(item.position.lat),
      longitude: Number(item.position.lng),
    }));
}
