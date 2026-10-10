import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Coffee,
  Globe,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function OnboardingScreen({ onComplete }: { onComplete?: () => void }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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
    if (onComplete) onComplete();
    else router.replace('/');
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

  const languages: { id: Language; label: string; sub: string }[] = [
    { id: 'en', label: 'English', sub: 'Default' },
    { id: 'bn', label: 'বাংলা', sub: 'Bengali' },
  ];
  const currencies: { code: CurrencyCode; name: string }[] = [
    { code: 'BDT', name: 'Taka' },
    { code: 'USD', name: 'Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'INR', name: 'Rupee' },
  ];

  // Defensive safe area clearance: ensure generous room above and below
  const topPadding = Math.max(insets.top, 24) + 8;
  const bottomPadding = Math.max(insets.bottom, 16) + 12;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.mainWrapper, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
        {/* Top App Bar: Brand pill + Skip button */}
        <View style={styles.topBar}>
          <View style={[styles.brandBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.brandIconDot, { backgroundColor: colors.primary }]}>
              <Sparkles color="#FFFFFF" size={12} strokeWidth={2.5} />
            </View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>{t.common.appName}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={completeOnboarding}
            style={[styles.skipBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>{t.onboarding.skip}</Text>
          </Pressable>
        </View>

        {/* Carousel Slides */}
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
              // -------------------------------------------------------------
              // SLIDE 1: Track Every Taka / Financial Clarity
              // -------------------------------------------------------------
              return (
                <View style={[styles.slide, { width }]}>
                  <View style={styles.slideHeaderBlock}>
                    <View style={[styles.categoryPill, { backgroundColor: `${colors.primary}12` }]}>
                      <Text style={[styles.categoryPillText, { color: colors.primary }]}>
                        {language === 'bn' ? 'আর্থিক হিসাব' : 'Financial Clarity'}
                      </Text>
                    </View>
                    <Text style={[styles.slideHeadline, { color: colors.text }]}>
                      {t.onboarding.slide1Title}
                    </Text>
                    <Text style={[styles.slideDesc, { color: colors.textMuted }]}>
                      {t.onboarding.slide1Desc}
                    </Text>
                  </View>

                  {/* Production-Quality Mini UI Mockup */}
                  <View style={[styles.previewFrame, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {/* Mini Hero Card */}
                    <View style={[styles.miniHeroCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                      <View style={styles.miniHeroTop}>
                        <Text style={[styles.miniHeroLabel, { color: colors.textMuted }]}>
                          {language === 'bn' ? 'নেট ব্যালেন্স' : 'Total Balance'}
                        </Text>
                        <View style={[styles.miniSurplusBadge, { backgroundColor: `${colors.success}18` }]}>
                          <ArrowUpRight color={colors.success} size={11} strokeWidth={2.5} />
                          <Text style={[styles.miniSurplusText, { color: colors.success }]}>
                            {language === 'bn' ? 'উদ্বৃত্ত' : 'Surplus'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.miniHeroBalance, { color: colors.text }]}>
                        {getCurrencySymbol(selectedCurrency)} 34,500
                      </Text>
                    </View>

                    {/* Mini Cashflow Row */}
                    <View style={styles.miniCashflowRow}>
                      <View style={[styles.miniCashflowBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                        <View style={[styles.miniCashflowIconWrap, { backgroundColor: `${colors.success}15` }]}>
                          <TrendingUp color={colors.success} size={12} strokeWidth={2.5} />
                        </View>
                        <View>
                          <Text style={[styles.miniCashflowLabel, { color: colors.textMuted }]}>
                            {language === 'bn' ? 'আয়' : 'Income'}
                          </Text>
                          <Text style={[styles.miniCashflowAmount, { color: colors.success }]}>
                            {getCurrencySymbol(selectedCurrency)} 50,000
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.miniCashflowBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                        <View style={[styles.miniCashflowIconWrap, { backgroundColor: `${colors.danger}15` }]}>
                          <TrendingDown color={colors.danger} size={12} strokeWidth={2.5} />
                        </View>
                        <View>
                          <Text style={[styles.miniCashflowLabel, { color: colors.textMuted }]}>
                            {language === 'bn' ? 'খরচ' : 'Expense'}
                          </Text>
                          <Text style={[styles.miniCashflowAmount, { color: colors.text }]}>
                            {getCurrencySymbol(selectedCurrency)} 15,500
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Mini Transaction Items */}
                    <View style={styles.miniTxList}>
                      <View style={styles.miniTxItem}>
                        <View style={[styles.miniTxIcon, { backgroundColor: '#F9731618' }]}>
                          <Coffee color="#F97316" size={14} strokeWidth={2.2} />
                        </View>
                        <View style={styles.miniTxDetails}>
                          <Text style={[styles.miniTxTitle, { color: colors.text }]}>
                            {language === 'bn' ? 'রেস্তোরাঁ ও নাশতা' : 'Restaurant & Coffee'}
                          </Text>
                          <Text style={[styles.miniTxMeta, { color: colors.textMuted }]}>
                            {language === 'bn' ? 'আজ, ১২:৩০ মিনিট' : 'Today, 12:30 PM'}
                          </Text>
                        </View>
                        <Text style={[styles.miniTxAmount, { color: colors.text }]}>
                          -{getCurrencySymbol(selectedCurrency)} 450
                        </Text>
                      </View>

                      <View style={[styles.miniTxItem, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                        <View style={[styles.miniTxIcon, { backgroundColor: `${colors.primary}18` }]}>
                          <Wallet color={colors.primary} size={14} strokeWidth={2.2} />
                        </View>
                        <View style={styles.miniTxDetails}>
                          <Text style={[styles.miniTxTitle, { color: colors.text }]}>
                            {language === 'bn' ? 'মাসিক বেতন' : 'Salary Deposit'}
                          </Text>
                          <Text style={[styles.miniTxMeta, { color: colors.textMuted }]}>
                            {language === 'bn' ? '১ অক্টোবর' : 'Oct 1'}
                          </Text>
                        </View>
                        <Text style={[styles.miniTxAmount, { color: colors.success }]}>
                          +{getCurrencySymbol(selectedCurrency)} 50,000
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }

            if (item === 1) {
              // -------------------------------------------------------------
              // SLIDE 2: Know Your Levels / Spending Tiers
              // -------------------------------------------------------------
              return (
                <View style={[styles.slide, { width }]}>
                  <View style={styles.slideHeaderBlock}>
                    <View style={[styles.categoryPill, { backgroundColor: `${colors.accent}14` }]}>
                      <Text style={[styles.categoryPillText, { color: colors.accent }]}>
                        {language === 'bn' ? 'স্মার্ট বাজেট' : 'Budget Protection'}
                      </Text>
                    </View>
                    <Text style={[styles.slideHeadline, { color: colors.text }]}>
                      {t.onboarding.slide2Title}
                    </Text>
                    <Text style={[styles.slideDesc, { color: colors.textMuted }]}>
                      {t.onboarding.slide2Desc}
                    </Text>
                  </View>

                  {/* Level Indicators Card */}
                  <View style={[styles.previewFrame, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {/* Level 1: Low */}
                    <View style={styles.levelCardItem}>
                      <View style={styles.levelItemHeader}>
                        <View style={styles.levelBadgeGroup}>
                          <View style={[styles.levelIndicatorDot, { backgroundColor: colors.success }]} />
                          <Text style={[styles.levelItemTitle, { color: colors.text }]}>
                            {t.onboarding.levelLow}
                          </Text>
                        </View>
                        <Text style={[styles.levelPercentText, { color: colors.success }]}>32%</Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
                        <View style={[styles.progressFill, { width: '32%', backgroundColor: colors.success }]} />
                      </View>
                      <Text style={[styles.levelItemSub, { color: colors.textMuted }]}>
                        {t.onboarding.levelLowDesc}
                      </Text>
                    </View>

                    <View style={[styles.levelDivider, { backgroundColor: colors.border }]} />

                    {/* Level 2: Moderate */}
                    <View style={styles.levelCardItem}>
                      <View style={styles.levelItemHeader}>
                        <View style={styles.levelBadgeGroup}>
                          <View style={[styles.levelIndicatorDot, { backgroundColor: colors.warning }]} />
                          <Text style={[styles.levelItemTitle, { color: colors.text }]}>
                            {t.onboarding.levelMod}
                          </Text>
                        </View>
                        <Text style={[styles.levelPercentText, { color: colors.warning }]}>68%</Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
                        <View style={[styles.progressFill, { width: '68%', backgroundColor: colors.warning }]} />
                      </View>
                      <Text style={[styles.levelItemSub, { color: colors.textMuted }]}>
                        {t.onboarding.levelModDesc}
                      </Text>
                    </View>

                    <View style={[styles.levelDivider, { backgroundColor: colors.border }]} />

                    {/* Level 3: High */}
                    <View style={styles.levelCardItem}>
                      <View style={styles.levelItemHeader}>
                        <View style={styles.levelBadgeGroup}>
                          <View style={[styles.levelIndicatorDot, { backgroundColor: colors.danger }]} />
                          <Text style={[styles.levelItemTitle, { color: colors.text }]}>
                            {t.onboarding.levelHigh}
                          </Text>
                        </View>
                        <Text style={[styles.levelPercentText, { color: colors.danger }]}>88%</Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
                        <View style={[styles.progressFill, { width: '88%', backgroundColor: colors.danger }]} />
                      </View>
                      <Text style={[styles.levelItemSub, { color: colors.textMuted }]}>
                        {t.onboarding.levelHighDesc}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }

            // -------------------------------------------------------------
            // SLIDE 3: Language & Currency Preferences
            // -------------------------------------------------------------
            return (
              <View style={[styles.slide, { width }]}>
                <View style={styles.slideHeaderBlock}>
                  <View style={[styles.categoryPill, { backgroundColor: `${colors.primary}12` }]}>
                    <Text style={[styles.categoryPillText, { color: colors.primary }]}>
                      {language === 'bn' ? 'ব্যক্তিগতকরণ' : 'Personalization'}
                    </Text>
                  </View>
                  <Text style={[styles.slideHeadline, { color: colors.text }]}>
                    {t.onboarding.slide3Title}
                  </Text>
                  <Text style={[styles.slideDesc, { color: colors.textMuted }]}>
                    {t.onboarding.slide3Desc}
                  </Text>
                </View>

                {/* Preference Selectors Card */}
                <View style={[styles.previewFrame, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {/* Language Selector */}
                  <View style={styles.preferenceSection}>
                    <View style={styles.preferenceHeader}>
                      <Globe color={colors.primary} size={16} strokeWidth={2.2} />
                      <Text style={[styles.preferenceLabel, { color: colors.text }]}>
                        {t.onboarding.languageLabel}
                      </Text>
                    </View>

                    <View style={styles.optionsRow}>
                      {languages.map((l) => {
                        const isSelected = language === l.id;
                        return (
                          <Pressable
                            accessibilityRole="button"
                            key={l.id}
                            onPress={async () => {
                              if (Platform.OS !== 'web') {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                              }
                              setLanguage(l.id);
                            }}
                            style={[
                              styles.languageChip,
                              {
                                backgroundColor: isSelected ? `${colors.primary}12` : colors.surfaceAlt,
                                borderColor: isSelected ? colors.primary : colors.border,
                              },
                            ]}>
                            <View style={styles.chipTextWrap}>
                              <Text
                                style={[
                                  styles.languageChipTitle,
                                  { color: isSelected ? colors.primary : colors.text },
                                ]}>
                                {l.label}
                              </Text>
                              <Text
                                style={[
                                  styles.languageChipSub,
                                  { color: isSelected ? colors.primary : colors.textMuted },
                                ]}>
                                {l.sub}
                              </Text>
                            </View>
                            {isSelected ? (
                              <View style={[styles.chipCheck, { backgroundColor: colors.primary }]}>
                                <Check color="#FFFFFF" size={12} strokeWidth={3} />
                              </View>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={[styles.levelDivider, { backgroundColor: colors.border }]} />

                  {/* Currency Selector */}
                  <View style={styles.preferenceSection}>
                    <View style={styles.preferenceHeader}>
                      <Wallet color={colors.primary} size={16} strokeWidth={2.2} />
                      <Text style={[styles.preferenceLabel, { color: colors.text }]}>
                        {t.onboarding.currencyLabel}
                      </Text>
                    </View>

                    <View style={styles.currencyGrid}>
                      {currencies.map((c) => {
                        const isSelected = selectedCurrency === c.code;
                        return (
                          <Pressable
                            accessibilityRole="button"
                            key={c.code}
                            onPress={async () => {
                              if (Platform.OS !== 'web') {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                              }
                              updateCurrency(c.code);
                            }}
                            style={[
                              styles.currencyChip,
                              {
                                backgroundColor: isSelected ? `${colors.primary}12` : colors.surfaceAlt,
                                borderColor: isSelected ? colors.primary : colors.border,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.currencySymbolText,
                                { color: isSelected ? colors.primary : colors.textMuted },
                              ]}>
                              {getCurrencySymbol(c.code)}
                            </Text>
                            <View style={styles.currencyNameWrap}>
                              <Text
                                style={[
                                  styles.currencyCodeText,
                                  { color: isSelected ? colors.primary : colors.text },
                                ]}>
                                {c.code}
                              </Text>
                              <Text style={[styles.currencySubText, { color: colors.textMuted }]}>
                                {c.name}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* Bottom Navigation & CTA */}
        <View style={styles.bottomBar}>
          <View style={styles.dotsWrapper}>
            {[0, 1, 2].map((idx) => {
              const isActive = idx === currentIndex;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    isActive
                      ? [styles.dotActive, { backgroundColor: colors.primary }]
                      : [styles.dotInactive, { backgroundColor: colors.border }],
                  ]}
                />
              );
            })}
          </View>

          <GradientButton
            icon={currentIndex === 2 ? Check : ArrowRight}
            onPress={currentIndex === 2 ? completeOnboarding : handleNext}
            title={currentIndex === 2 ? t.onboarding.getStarted : t.onboarding.continue}
            variant="primary"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainWrapper: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Tokens.spacing.lg,
    paddingTop: Tokens.spacing.xs,
    paddingBottom: Tokens.spacing.sm,
    minHeight: Tokens.touchTarget,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Tokens.radius.full,
    borderWidth: 1,
  },
  brandIconDot: {
    width: 20,
    height: 20,
    borderRadius: Tokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: Tokens.typography.bodySm.fontSize,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  skipBtn: {
    minHeight: Tokens.touchTarget,
    minWidth: Tokens.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing.md,
    borderRadius: Tokens.radius.full,
    borderWidth: 1,
  },
  skipText: {
    fontSize: Tokens.typography.bodySm.fontSize,
    fontWeight: '600',
  },
  slideList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Tokens.spacing.lg,
    paddingVertical: Tokens.spacing.sm,
  },
  slideHeaderBlock: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Tokens.spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Tokens.radius.full,
    marginBottom: Tokens.spacing.sm,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  slideHeadline: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Tokens.spacing.xs,
  },
  slideDesc: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    textAlign: 'center',
    maxWidth: 320,
  },
  previewFrame: {
    width: '100%',
    maxWidth: 350,
    borderRadius: Tokens.radius.card,
    borderWidth: 1,
    padding: Tokens.spacing.md,
    gap: Tokens.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  miniHeroCard: {
    padding: Tokens.spacing.md,
    borderRadius: Tokens.radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  miniHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniHeroLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniSurplusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Tokens.radius.full,
  },
  miniSurplusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  miniHeroBalance: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  miniCashflowRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
  miniCashflowBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    padding: Tokens.spacing.sm,
    borderRadius: Tokens.radius.md,
    borderWidth: 1,
  },
  miniCashflowIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCashflowLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  miniCashflowAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  miniTxList: {
    gap: 0,
  },
  miniTxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: Tokens.spacing.sm,
  },
  miniTxIcon: {
    width: 32,
    height: 32,
    borderRadius: Tokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTxDetails: {
    flex: 1,
  },
  miniTxTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  miniTxMeta: {
    fontSize: 11,
    fontWeight: '400',
  },
  miniTxAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  levelCardItem: {
    gap: 6,
  },
  levelItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: Tokens.radius.full,
  },
  levelItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  levelPercentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: Tokens.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Tokens.radius.full,
  },
  levelItemSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  levelDivider: {
    height: 1,
    width: '100%',
  },
  preferenceSection: {
    gap: Tokens.spacing.sm,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  preferenceLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
  },
  languageChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Tokens.spacing.sm,
    borderRadius: Tokens.radius.md,
    borderWidth: 1.5,
  },
  chipTextWrap: {
    gap: 1,
  },
  languageChipTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  languageChipSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  chipCheck: {
    width: 18,
    height: 18,
    borderRadius: Tokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
  },
  currencyChip: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Tokens.spacing.sm,
    borderRadius: Tokens.radius.md,
    borderWidth: 1.5,
  },
  currencySymbolText: {
    fontSize: 16,
    fontWeight: '800',
  },
  currencyNameWrap: {
    gap: 1,
  },
  currencyCodeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  currencySubText: {
    fontSize: 10,
    fontWeight: '500',
  },
  bottomBar: {
    paddingHorizontal: Tokens.spacing.lg,
    paddingTop: Tokens.spacing.sm,
    gap: Tokens.spacing.md,
  },
  dotsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: Tokens.radius.full,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 6,
  },
});

