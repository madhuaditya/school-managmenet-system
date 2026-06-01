import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import LoginScreen from '@/src/screens/LoginScreen';
import { STORAGE_KEYS } from '@/src/constants';
import { useAuthStore } from '@/src/store/auth.store';

const lightColors = {
  bg: "#F9FAFB",
  primary: "#2563EB",
};

const darkColors = {
  bg: "#0F172A",
  primary: "#3B82F6",
};

const onboardingSlides = [
  {
    key: '1',
    title: 'Smart School Hub',
    subtitle: 'Manage classes, students, and daily school work in one place.',
    image: require('../assets/images/Screen001.png'),
  },
  {
    key: '2',
    title: 'Attendance Made Easy',
    subtitle: 'Track attendance, timetable, and class activity with less effort.',
    image: require('../assets/images/screen002.png'),
  },
  {
    key: '3',
    title: 'Alerts and Updates',
    subtitle: 'Send notices, alerts, and communication instantly to your school community.',
    image: require('../assets/images/screen003.png'),
  },
  {
    key: '4',
    title: 'Reports and Growth',
    subtitle: 'See performance, fees, and progress with simple visual reports.',
    image: require('../assets/images/screen004.png'),
  },
];

export default function IndexRoute() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const willExpire = useAuthStore((state) => state.willExpire);
  const scheme = useColorScheme();
  const { width } = useWindowDimensions();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingSeen, setOnboardingSeen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = useMemo(() => onboardingSlides, []);

  useEffect(() => {
    let active = true;

    const loadOnboardingState = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN);
        if (active) {
          setOnboardingSeen(storedValue === 'true');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadOnboardingState();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoading && onboardingSeen && isAuthenticated && Date.now() < (willExpire ?? 0)) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, onboardingSeen, router, willExpire]);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
    setOnboardingSeen(true);

    if (isAuthenticated && Date.now() < (willExpire ?? 0)) {
      router.replace('/(tabs)');
      return;
    }

    router.replace('/');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!onboardingSeen) {
    return (
      <View style={[styles.onboardingContainer, { backgroundColor: colors.bg }]}>
        <FlatList
          data={slides}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const slideWidth = event.nativeEvent.layoutMeasurement.width;
            const slideIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
            setCurrentSlide(slideIndex);
          }}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.slideImageWrap}>
                <Image source={item.image} style={styles.slideImage} resizeMode="contain" />
              </View>
              <Text style={[styles.slideTitle, { color: colors.primary }]}>{item.title}</Text>
              <Text style={[styles.slideSubtitle, { color: scheme === 'dark' ? '#CBD5E1' : '#475569' }]}>
                {item.subtitle}
              </Text>
            </View>
          )}
        />

        <View style={styles.dotsRow}>
          {slides.map((slide, index) => (
            <View
              key={slide.key}
              style={[
                styles.dot,
                { backgroundColor: index === currentSlide ? colors.primary : 'rgba(148,163,184,0.35)' },
              ]}
            />
          ))}
        </View>

        <View style={styles.actionsRow}>
          <Pressable onPress={completeOnboarding} style={[styles.secondaryButton, { borderColor: colors.primary }]}>
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Skip</Text>
          </Pressable>
          <Pressable onPress={completeOnboarding} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (isAuthenticated && willExpire && Date.now() < willExpire) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return <LoginScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderBox: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  onboardingContainer: {
    flex: 1,
    paddingTop: 64,
    paddingBottom: 28,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideImageWrap: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  slideImage: {
    width: '100%',
    maxWidth: 360,
    height: '100%',
    maxHeight: 420,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  slideSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
    paddingBottom: 18,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});