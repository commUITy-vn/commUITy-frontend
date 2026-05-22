import React, { useState, useRef, useEffect } from "react"
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from "react-native"
import { useRouter } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useTheme } from "@/hooks/useTheme"
import { TextInput, Button } from "@/components/ui"
import { useCreateSupportLocation } from "@/features/maps/hooks/useCreateSupportLocation"

// We use conditional import to avoid native package issues on web
let WebView: any
if (Platform.OS !== "web") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    WebView = require("react-native-webview").WebView
}

export default function CreateLocationScreen() {
    const router = useRouter()
    const theme = useTheme()
    const webViewRef = useRef<any>(null)

    // Form states
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [address, setAddress] = useState("")
    const [contactPhone, setContactPhone] = useState("")
    const [lat, setLat] = useState("21.028511") // Default to Hanoi coordinates
    const [lng, setLng] = useState("105.804817")
    const [bankName, setBankName] = useState("")
    const [bankAccountNumber, setBankAccountNumber] = useState("")

    // Errors
    const [errors, setErrors] = useState<Record<string, string>>({})

    const createLocationMutation = useCreateSupportLocation()

    // Interactive Leaflet Map HTML
    const getLeafletHtml = (initialLat: string, initialLng: string) => `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                html, body { margin: 0; padding: 0; height: 100%; width: 100%; background-color: ${theme.appBG}; }
                #map { height: 100%; width: 100%; }
                .leaflet-bar { border: none !important; box-shadow: 0 2px 6px rgba(0,0,0,0.15) !important; }
                .leaflet-bar a { background-color: ${theme.componentBG} !important; color: ${theme.text} !important; border-bottom: 1px solid ${theme.border} !important; }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map = L.map('map', { zoomControl: false, scrollWheelZoom: false }).setView([${initialLat}, ${initialLng}], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM</a>'
                }).addTo(map);
                
                L.control.zoom({ position: 'bottomright' }).addTo(map);
                
                var marker = L.marker([${initialLat}, ${initialLng}], { draggable: true }).addTo(map);
                
                marker.on('dragend', function(event) {
                    var position = marker.getLatLng();
                    var message = JSON.stringify({
                        type: 'MARKER_DRAG',
                        lat: position.lat,
                        lng: position.lng
                    });
                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                        window.ReactNativeWebView.postMessage(message);
                    } else if (window.parent && window.parent.postMessage) {
                        window.parent.postMessage(message, '*');
                    }
                });

                window.addEventListener('message', function(event) {
                    try {
                        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                        if (data.type === 'UPDATE_COORDS') {
                            var newLatLng = new L.LatLng(data.lat, data.lng);
                            marker.setLatLng(newLatLng);
                            map.setView(newLatLng, map.getZoom());
                        }
                    } catch (e) {}
                });
            </script>
        </body>
        </html>
    `

    const updateMapCoords = (newLat: number, newLng: number) => {
        const message = JSON.stringify({ type: "UPDATE_COORDS", lat: newLat, lng: newLng })
        if (Platform.OS === "web") {
            const iframe = document.getElementById("map-iframe") as HTMLIFrameElement
            iframe?.contentWindow?.postMessage(message, "*")
        } else {
            webViewRef.current?.postMessage(message)
        }
    }

    // Handle messages from Leaflet map
    const handleMapMessage = (eventData: string) => {
        try {
            const data = JSON.parse(eventData)
            if (data.type === "MARKER_DRAG") {
                setLat(data.lat.toFixed(6).toString())
                setLng(data.lng.toFixed(6).toString())
                // Clear coordinate errors if valid coordinates received
                setErrors(prev => {
                    const next = { ...prev }
                    delete next.latitude
                    delete next.longitude
                    return next
                })
            }
        } catch (e) {
            console.error("Failed to parse map message:", e)
        }
    }

    // Listen to iframe postMessage on web
    useEffect(() => {
        if (Platform.OS === "web") {
            const handleWebMessage = (event: MessageEvent) => {
                if (typeof event.data === "string") {
                    handleMapMessage(event.data)
                }
            }
            window.addEventListener("message", handleWebMessage)
            return () => window.removeEventListener("message", handleWebMessage)
        }
    }, [])

    const handleLatChange = (text: string) => {
        setLat(text)
        const parsedLat = parseFloat(text)
        const parsedLng = parseFloat(lng)
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            updateMapCoords(parsedLat, parsedLng)
        }
    }

    const handleLngChange = (text: string) => {
        setLng(text)
        const parsedLat = parseFloat(lat)
        const parsedLng = parseFloat(text)
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            updateMapCoords(parsedLat, parsedLng)
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}
        if (!name.trim()) newErrors.name = "Name is required"
        if (!description.trim()) newErrors.description = "Description is required"
        if (!address.trim()) newErrors.address = "Address is required"
        
        const parsedLat = parseFloat(lat)
        if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
            newErrors.latitude = "Must be a valid latitude (-90 to 90)"
        }

        const parsedLng = parseFloat(lng)
        if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
            newErrors.longitude = "Must be a valid longitude (-180 to 180)"
        }

        if (contactPhone && contactPhone.length > 20) {
            newErrors.contactPhone = "Contact phone must not exceed 20 characters"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm()) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            return
        }

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

        try {
            await createLocationMutation.mutateAsync({
                name,
                description,
                address,
                contactPhone: contactPhone || undefined,
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
                bankName: bankName || undefined,
                bankAccountNumber: bankAccountNumber || undefined,
            })

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            router.back()
        } catch (error) {
            console.error("Failed to create support location:", error)
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            setErrors({ submit: "Failed to save support location. Please check your backend connection." })
        }
    }

    return (
        <KeyboardAvoidingView
            style={{
                flex: 1,
                backgroundColor: theme.appBG,
                height: (Platform.OS === "web" ? "100vh" : "100%") as any,
                maxHeight: (Platform.OS === "web" ? "100vh" : undefined) as any,
            }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {/* Header */}
            <View
                style={[
                    localStyles.header,
                    { borderBottomColor: theme.border, backgroundColor: theme.appBG },
                ]}
            >
                <Pressable
                    onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        router.back()
                    }}
                    style={localStyles.backButton}
                >
                    <MaterialIcons
                        name="chevron-left"
                        size={28}
                        color={theme.primary}
                    />
                </Pressable>
                <Text style={[localStyles.headerTitle, { color: theme.text }]}>
                    Add Location
                </Text>
                <View style={{ width: 52 }} />
            </View>

            <ScrollView
                style={localStyles.content}
                contentContainerStyle={localStyles.contentContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={[localStyles.title, { color: theme.text }]}>
                    Register Support Location
                </Text>
                <Text style={[localStyles.subtitle, { color: theme.textSupporting }]}>
                    Provide geospatial and contact details for the support hub to coordinate relief deliveries.
                </Text>

                {errors.submit && (
                    <View style={[localStyles.errorBanner, { backgroundColor: theme.danger + "22", borderColor: theme.danger }]}>
                        <MaterialIcons name="error-outline" size={20} color={theme.danger} />
                        <Text style={[localStyles.errorText, { color: theme.danger, marginLeft: 8, flex: 1 }]}>
                            {errors.submit}
                        </Text>
                    </View>
                )}

                {/* Form Fields */}
                <TextInput
                    label="Location Name"
                    value={name}
                    onChangeText={setName}
                    errorText={errors.name}
                />

                <TextInput
                    label="Description"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    style={{ height: 100, textAlignVertical: "top", paddingTop: 16 }}
                    errorText={errors.description}
                />

                <TextInput
                    label="Address"
                    value={address}
                    onChangeText={setAddress}
                    errorText={errors.address}
                />

                <TextInput
                    label="Contact Phone"
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    keyboardType="phone-pad"
                    errorText={errors.contactPhone}
                />

                {/* Coordinates Row */}
                <View style={localStyles.row}>
                    <View style={{ flex: 1 }}>
                        <TextInput
                            label="Latitude"
                            value={lat}
                            onChangeText={handleLatChange}
                            keyboardType="numeric"
                            errorText={errors.latitude}
                        />
                    </View>
                    <View style={{ width: 16 }} />
                    <View style={{ flex: 1 }}>
                        <TextInput
                            label="Longitude"
                            value={lng}
                            onChangeText={handleLngChange}
                            keyboardType="numeric"
                            errorText={errors.longitude}
                        />
                    </View>
                </View>

                {/* Map Section */}
                <View style={localStyles.mapLabelRow}>
                    <MaterialIcons name="map" size={18} color={theme.textSupporting} />
                    <Text style={[localStyles.mapLabel, { color: theme.textSupporting }]}>
                        Interactive Map Preview (Drag pin to adjust)
                    </Text>
                </View>

                <View style={[localStyles.mapContainer, { borderColor: theme.border, backgroundColor: theme.highlightBG }]}>
                    {Platform.OS === "web" ? (
                        <iframe
                            id="map-iframe"
                            srcDoc={getLeafletHtml(lat, lng)}
                            style={{ width: "100%", height: "100%", border: "none" }}
                        />
                    ) : WebView ? (
                        <WebView
                            ref={webViewRef}
                            source={{ html: getLeafletHtml(lat, lng) }}
                            style={{ flex: 1 }}
                            onMessage={(e: any) => handleMapMessage(e.nativeEvent.data)}
                            domStorageEnabled
                            javaScriptEnabled
                        />
                    ) : (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <Text style={{ color: theme.textSupporting }}>WebView is not supported on this platform</Text>
                        </View>
                    )}
                </View>

                <Text style={[localStyles.sectionTitle, { color: theme.text, marginTop: 16 }]}>
                    Financial Details (Optional)
                </Text>

                <TextInput
                    label="Bank Name"
                    value={bankName}
                    onChangeText={setBankName}
                />

                <TextInput
                    label="Bank Account Number"
                    value={bankAccountNumber}
                    onChangeText={setBankAccountNumber}
                    keyboardType="numeric"
                />

                {/* Submit Action */}
                <View style={localStyles.buttonContainer}>
                    <Button
                        text={createLocationMutation.isPending ? "Saving..." : "Save Location"}
                        onPress={handleSubmit}
                        size="large"
                        primary
                        isDisabled={createLocationMutation.isPending}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
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
    content: { flex: 1 },
    contentContainer: { flexGrow: 1, padding: 20, gap: 12, paddingBottom: 100 },

    title: { fontSize: 24, fontWeight: "700", marginBottom: 6 },
    subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
    row: { flexDirection: "row", justifyContent: "space-between" },
    mapLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, marginTop: 4 },
    mapLabel: { fontSize: 12, fontWeight: "600" },
    mapContainer: {
        height: 250,
        borderRadius: 16,
        borderWidth: 1,
        overflow: "hidden",
        marginBottom: 16,
    },
    buttonContainer: { marginTop: 24 },
    errorBanner: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 16,
    },
    errorText: { fontSize: 14, fontWeight: "500" },
})
