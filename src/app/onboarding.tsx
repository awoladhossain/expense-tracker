import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  ArrowRight,
  BarChart3,
  Check,
  Globe,
  Sparkles,
} from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { useThemeColor } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';
import { useI18n } from '@/hooks/useI18n';
import {
  useSettingsStore,
  type CurrencyCode,
  type Language,
} from '@/store/settingsStore';
import { getCurrencySymbol } from '@/utils/currency';

export const ONBOARDING_KEY = '@has_completed_onboarding';

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const colors = useThemeColor();
  const { language, t } = useI18n();

  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const selectedCurrency = useSettingsStore((state) => state.currency);
  const updateCurrency = useSettingsStore((state) => state.setCurrency);

  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const completeOnboarding = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {}
    router.replace('/');
  };

  const handleNext = async () => {
    if (currentIndex < 2) {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      await completeOnboarding();
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== currentIndex && index >= 0 && index < 3) {
      setCurrentIndex(index);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }
  };

  const languages: { id: Language; label: string }[] = [
    { id: 'en', label: 'English' },
    { id: 'bn', label: 'বাংলা' },
  ];
  const currencies: CurrencyCode[] = ['BDT', 'USD', 'EUR', 'INR'];

  return (
    <View style={styles.container}>
      {/* Full-bleed Gradient Background */}
      <Svg height="100%" pointerEvents="none" style={StyleSheet.absoluteFill} width="100%">
        <Defs>
          <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.accent} />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#bgGrad)" height="100%" width="100%" />
      </Svg>

      <SafeAreaView style={styles.safeArea}>
        {/* Top Header: Brand + Skip */}
        <View style={styles.topBar}>
          <View style={styles.brandBadge}>
            <Sparkles color="#FFFFFF" size={18} />
            <Text style={styles.brandTitle}>{t.common.appName}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={completeOnboarding}
            style={styles.skipBtn}>
            <Text style={styles.skipText}>{t.onboarding.skip}</Text>
          </Pressable>
        </View>

        {/* 3 Slides */}
        <FlatList
          data={[0, 1, 2]}
          horizontal
          keyExtractor={(item) => String(item)}
          onMomentumScrollEnd={onScroll}
          pagingEnabled
          ref={flatListRef}
          showsHorizontalScrollIndicator={false}
          style={styles.slideList}
          renderItem={({ item }) => {
            if (item === 0) {
              // Slide 1: Track Every Taka
              return (
                <View style={[styles.slide, { width }]}>
                  <View style={styles.iconCircle}>
                    <BarChart3 color="#FFFFFF" size={80} strokeWidth={1.8} />
                  </View>

                  <Text style={styles.slideHeadline}>{t.onboarding.slide1Title}</Text>
                  <Text style={styles.slideDesc}>{t.onboarding.slide1Desc}</Text>

                  {/* FinTech Feature Preview Card */}
                  <GlassCard style={styles.glassFeatureCard}>
                    <View style={styles.featureItem}>
                      <View style={styles.featureIcon}>
                        <Check color="#FFFFFF" size={16} strokeWidth={3} />
                      </View>
                      <Text style={styles.featureItemText}>
                        {language === 'bn'
                          ? 'স্বয়ংক্রিয় আয়-ব্যয় পৃথকীকরণ'
                          : 'Automatic expense & income separation'}
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <View style={styles.featureIcon}>
                        <Check color="#FFFFFF" size={16} strokeWidth={3} />
                      </View>
                      <Text style={styles.featureItemText}>
                        {language === 'bn'
                          ? 'রিয়েলটাইম নিট ব্যালেন্স ও ক্যাশফ্লো'
                          : 'Real-time net balance & cashflow analytics'}
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <View style={styles.featureIcon}>
                        <Check color="#FFFFFF" size={16} strokeWidth={3} />
                      </View>
                      <Text style={styles.featureItemText}>
                        {language === 'bn'
                          ? '১০০% অফলাইন ও সম্পূর্ণ নিরাপদ ডেটা'
                          : '100% offline & secured on device'}
                      </Text>
                    </View>
                  </GlassCard>
                </View>
              );
            }

            if (item === 1) {
              // Slide 2: Know Your Levels
              return (
                <View style={[styles.slide, { width }]}>
                  <View style={styles.levelIconsHero}>
                    <Text style={styles.heroEmojiLarge}>🟢 🟡 🔴</Text>
                  </View>

                  <Text style={styles.slideHeadline}>{t.onboarding.slide2Title}</Text>
                  <Text style={styles.slideDesc}>{t.onboarding.slide2Desc}</Text>

                  {/* Level Demo GlassCard */}
                  <GlassCard style={styles.glassFeatureCard}>
                    <View style={styles.levelRow}>
                      <Text style={styles.levelBullet}>🟢</Text>
                      <View style={styles.levelTextContainer}>
                        <Text style={styles.levelName}>{t.onboarding.levelLow}</Text>
                        <Text style={styles.levelSub}>{t.onboarding.levelLowDesc}</Text>
                      </View>
                    </View>

                    <View style={styles.levelRow}>
                      <Text style={styles.levelBullet}>🟡</Text>
                      <View style={styles.levelTextContainer}>
                        <Text style={styles.levelName}>{t.onboarding.levelMod}</Text>
                        <Text style={styles.levelSub}>{t.onboarding.levelModDesc}</Text>
                      </View>
                    </View>

                    <View style={styles.levelRow}>
                      <Text style={styles.levelBullet}>🔴</Text>
                      <View style={styles.levelTextContainer}>
                        <Text style={styles.levelName}>{t.onboarding.levelHigh}</Text>
                        <Text style={styles.levelSub}>{t.onboarding.levelHighDesc}</Text>
                      </View>
                    </View>
                  </GlassCard>
                </View>
              );
            }

            // Slide 3: Language + Currency Selection
            return (
              <View style={[styles.slide, { width }]}>
                <View style={styles.iconCircle}>
                  <Globe color="#FFFFFF" size={80} strokeWidth={1.8} />
                </View>

                <Text style={styles.slideHeadline}>{t.onboarding.slide3Title}</Text>
                <Text style={styles.slideDesc}>{t.onboarding.slide3Desc}</Text>

                <GlassCard style={styles.glassFeatureCard}>
                  {/* Language Segmented Control */}
                  <Text style={styles.selectorLabel}>{t.onboarding.languageLabel}</Text>
                  <View style={styles.segmentContainer}>
                    {languages.map((l) => {
                      const isSelected = language === l.id;
                      return (
                        <Pressable
                          accessibilityRole="button"
                          key={l.id}
                          onPress={async () => {
                            if (Platform.OS !== 'web') {
                              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                                () => {},
                              );
                            }
                            setLanguage(l.id);
                          }}
                          style={[
                            styles.segmentItem,
                            isSelected && styles.segmentItemSelected,
                          ]}>
                          <Text
                            style={[
                              styles.segmentText,
                              isSelected ? styles.segmentTextSelected : styles.segmentTextUnselected,
                            ]}>
                            {l.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Currency Segmented Control */}
                  <Text style={[styles.selectorLabel, { marginTop: 14 }]}>
                    {t.onboarding.currencyLabel}
                  </Text>
                  <View style={styles.segmentContainer}>
                    {currencies.map((c) => {
                      const isSelected = selectedCurrency === c;
                      return (
                        <Pressable
                          accessibilityRole="button"
                          key={c}
                          onPress={async () => {
                            if (Platform.OS !== 'web') {
                              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                                () => {},
                              );
                            }
                            updateCurrency(c);
                          }}
                          style={[
                            styles.segmentItem,
                            isSelected && styles.segmentItemSelected,
                          ]}>
                          <Text
                            style={[
                              styles.segmentText,
                              isSelected ? styles.segmentTextSelected : styles.segmentTextUnselected,
                            ]}>
                            {`${getCurrencySymbol(c)} ${c}`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </GlassCard>
              </View>
            );
          }}
        />

        {/* Bottom Bar: Animated Pagination Dots & CTA */}
        <View style={styles.bottomBar}>
          <View style={styles.dotsWrapper}>
            {[0, 1, 2].map((idx) => {
              const isActive = idx === currentIndex;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    isActive ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              );
            })}
          </View>

          {currentIndex === 2 ? (
            <Pressable
              accessibilityRole="button"
              onPress={completeOnboarding}
              style={styles.whiteCtaButton}>
              <Text style={[styles.whiteCtaText, { color: colors.primary }]}>
                {t.onboarding.getStarted}
              </Text>
            </Pressable>
          ) : (
            <GradientButton
              icon={ArrowRight}
              onPress={handleNext}
              style={styles.ctaButton}
              title={t.onboarding.continue}
              variant="secondary"
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Tokens.spacing.xl,
    paddingTop: Tokens.spacing.md,
    minHeight: Tokens.touchTarget,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Tokens.radius.full,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipBtn: {
    minHeight: Tokens.touchTarget,
    minWidth: Tokens.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing.sm,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: Tokens.typography.body.fontSize,
    fontWeight: '600',
  },
  slideList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing.xl,
    paddingVertical: Tokens.spacing.sm,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: Tokens.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Tokens.spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  levelIconsHero: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Tokens.spacing.lg,
  },
  heroEmojiLarge: {
    fontSize: 44,
    letterSpacing: 8,
  },
  slideHeadline: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Tokens.spacing.sm,
    maxWidth: 320,
  },
  slideDesc: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: Tokens.spacing.xl,
  },
  glassFeatureCard: {
    width: '100%',
    maxWidth: 340,
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: Tokens.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
  },
  levelBullet: {
    fontSize: 20,
  },
  levelTextContainer: {
    flex: 1,
    gap: 2,
  },
  levelName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  levelSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  selectorLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: Tokens.radius.md,
    padding: 3,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 38,
    borderRadius: Tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemSelected: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextSelected: {
    color: '#0F172A',
  },
  segmentTextUnselected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  bottomBar: {
    paddingHorizontal: Tokens.spacing.xl,
    paddingBottom: Tokens.spacing.xl,
    paddingTop: Tokens.spacing.sm,
    gap: Tokens.spacing.lg,
  },
  dotsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: Tokens.radius.full,
  },
  dotActive: {
    width: 28,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  ctaButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  whiteCtaButton: {
    minHeight: 52,
    borderRadius: Tokens.radius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing.xxl,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  whiteCtaText: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
