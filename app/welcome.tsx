import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Frown, Search, TrendingUp, Heart } from 'lucide-react-native';
import { COLORS } from '@/lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    icon: Frown,
    iconColor: COLORS.warning,
    title: 'Tired of the Guesswork?',
    description: 'Bloating after meals. Unexplained cramps. Constant confusion about what to eat. You have tried eliminating foods randomly but nothing seems clear.',
  },
  {
    icon: Search,
    iconColor: COLORS.secondary,
    title: 'You Deserve Answers',
    description: 'Your gut reacts to specific triggers -- but figuring out which ones can feel impossible without a system. You are not alone in this struggle.',
  },
  {
    icon: TrendingUp,
    iconColor: COLORS.primary,
    title: 'How This App Helps',
    description: 'Log meals and symptoms in seconds. Over time, GutSense surfaces patterns between what you eat and how you feel -- so you can finally make informed choices.',
  },
  {
    icon: Heart,
    iconColor: COLORS.success,
    title: 'Built for You',
    description: 'No calorie counting. No judgement. Just a gentle, evidence-based diary designed for people with IBS, food sensitivities, and gut discomfort who want clarity.',
  },
];

const STORAGE_KEY = 'gutsense_has_seen_welcome';

export default function WelcomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    router.replace('/auth');
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    router.replace('/auth');
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (activeIndex + 1), animated: true });
    }
  };

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
      >
        {SLIDES.map((slide, index) => {
          const IconComponent = slide.icon;
          return (
            <View key={index} style={styles.slide}>
              <View style={[styles.iconContainer, { backgroundColor: `${slide.iconColor}14` }]}>
                <IconComponent size={56} color={slide.iconColor} strokeWidth={1.5} />
              </View>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDescription}>{slide.description}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={isLastSlide ? handleGetStarted : handleNext}
        >
          <Text style={styles.actionButtonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  skipContainer: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  carousel: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.textInverse,
    fontSize: 18,
    fontWeight: '600',
  },
});
