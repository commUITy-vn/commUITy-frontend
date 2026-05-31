import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack, forcedAnimation } from "@/lib/PlatformStack";
import { Platform } from "react-native";

export default function CreateRequestLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <Stack
      screenOptions={
        {
          headerShown: false,
          animation: Platform.select({
            ios: "slide_from_right",
            android: "slide_from_right",
            default: "slide_from_right",
          }),
          animationTypeForReplace: "pop",
          contentStyle: { backgroundColor: theme.appBG },
        } as any
      }
    >
      <Stack.Screen name="index" options={forcedAnimation} />
      <Stack.Screen name="details" options={forcedAnimation} />
      {/* <Stack.Screen name="urgency" options={forcedAnimation} /> */}
      <Stack.Screen name="items" options={forcedAnimation} />
      <Stack.Screen name="confirmation" options={forcedAnimation} />
      <Stack.Screen
        name="success"
        options={{ ...forcedAnimation, gestureEnabled: false }}
      />
    </Stack>
  );
}
