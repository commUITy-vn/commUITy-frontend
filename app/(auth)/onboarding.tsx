import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Button } from '@/components/ui';
import { storage } from '@/lib/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: 'Welcome to commUITy',
    description: 'A premium, modern hub designed for direct community aid, mutual coordination, and active volunteer empowerment.',
    fallbackIcon: 'people',
  },
  {
    id: 2,
    title: 'Geospatial Coordination',
    description: 'Find or register support hubs, manage relief distribution locations, and coordinate delivery routes in real-time.',
    fallbackIcon: 'map',
  },
  {
    id: 3,
    title: 'Empower Aid & Support',
    description: 'Apply as a volunteer, fund local support needs, request community help, and communicate directly with private chats.',
    fallbackIcon: 'volunteer-activism',
  },
];

const PulsingIcon = ({ iconName, theme }: { iconName: string; theme: any }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: theme.primary + '15',
          transform: [{ scale: pulseAnim }],
        }}
      />
      <View
        style={{
          width: 110,
          height: 110,
          borderRadius: 55,
          backgroundColor: theme.primary,
          justifyContent: 'center',
          alignItems: 'center',
          ...Platform.select({
            ios: {
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            android: {
              elevation: 6,
            },
            default: {},
          }),
        }}
      >
        <MaterialIcons name={iconName as any} size={54} color="#FFFFFF" />
      </View>
    </View>
  );
};

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      await storage.setItemAsync('has_completed_onboarding', 'true');
      router.replace('/(auth)/login');
      router.push('/(auth)/register');
    }
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await storage.setItemAsync('has_completed_onboarding', 'true');
    router.push('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.appBG }]}>
      {/* Header Skip button */}
      <View style={styles.header}>
        {activeIndex < SLIDES.length - 1 ? (
          <Pressable onPress={handleSkip}>
            <Text style={[styles.skipText, { color: theme.textSupporting }]}>Skip</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      {/* Slide Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            {/* Pulsing Local Icon */}
            <View style={[styles.animationContainer, { backgroundColor: theme.highlightBG }]}>
              <PulsingIcon iconName={slide.fallbackIcon} theme={theme} />
            </View>

            {/* Typography */}
            <View style={styles.textContainer}>
              <Text style={[styles.slideTitle, { color: theme.text }]}>
                {slide.title}
              </Text>
              <Text style={[styles.slideDescription, { color: theme.textSupporting }]}>
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer Navigation Area */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  width: index === activeIndex ? 20 : 8,
                  backgroundColor: index === activeIndex ? theme.primary : theme.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Control Buttons */}
        <View style={styles.btnRow}>
          <Button
            text={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            onPress={handleNext}
            primary
            size="large"
          />
          {activeIndex === SLIDES.length - 1 && (
            <Pressable onPress={handleSkip} style={{ marginTop: 12, paddingVertical: 4 }}>
              <Text style={[styles.loginLink, { color: theme.primary }]}>
                I already have an account
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  carousel: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  animationContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    gap: 12,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  slideDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  footer: {
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  btnRow: {
    width: '100%',
    alignItems: 'center',
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '700',
  },
});
