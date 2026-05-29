import { Stack, forcedAnimation } from '@/lib/PlatformStack';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', ...forcedAnimation } as any} initialRouteName="onboarding">
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
