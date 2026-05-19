/**
 * PlatformStack — native version (iOS/Android).
 *
 * Uses Expo Router's native-stack with slide_from_right animation.
 * On native platforms this works natively — no changes needed.
 */
export { Stack, Stack as default } from "expo-router"
export const forcedAnimation = undefined
