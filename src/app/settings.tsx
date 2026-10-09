import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  Download,
  Fingerprint,
  KeyRound,
  RotateCcw,
  Shield,
  Trash2,
  User as UserIcon,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { PinLockModal } from '@/components/pin-lock-modal';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { AppInput } from '@/components/ui/app-input';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { SectionHeader } from '@/components/ui/section-header';
import { Tokens } from '@/constants/tokens';
import { useAppColors } from '@/hooks/useAppColors';
import { useI18n } from '@/hooks/useI18n';
import { useLockStore } from '@/store/lockStore';
import {
  useSettingsStore,
  type CurrencyCode,
  type Language,
  type ThemeMode,
} from '@/store/settingsStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { getCurrencySymbol } from '@/utils/currency';
import {
  exportTransactionsCSV,
  exportTransactionsJSON,
  resetAllAppData,
} from '@/utils/export';

export default function SettingsScreen() {
  const colors = useAppColors();
  const { t } = useI18n();

  // Settings store
  const language = useSettingsStore((state) => state.language);
  const currency = useSettingsStore((state) => state.currency);
  const theme = useSettingsStore((state) => state.theme);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setCurrency = useSettingsStore((state) => state.setCurrency);
  const setTheme = useSettingsStore((state) => state.setTheme);

  // User Profile store
  const profileName = useUserProfileStore((state) => state.name);
  const profileEmail = useUserProfileStore((state) => state.email);
  const profileTier = useUserProfileStore((state) => state.tier);
  const updateProfile = useUserProfileStore((state) => state.updateProfile);
  const toggleTier = useUserProfileStore((state) => state.toggleTier);

  // Lock store
  const hasPinSet = useLockStore((state) => state.hasPinSet);
  const biometricsEnabled = useLockStore((state) => state.biometricsEnabled);
  const removePin = useLockStore((state) => state.removePin);
  const toggleBiometrics = useLockStore((state) => state.toggleBiometrics);

  // Local state
  const [showPinModal, setShowPinModal] = useState(false);
  const [hasBiometricsHardware, setHasBiometricsHardware] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState(profileName);
  const [editEmail, setEditEmail] = useState(profileEmail);
  const [isExporting, setIsExporting] = useState(false);

  // Check biometric support
  useEffect(() => {
    async function checkBio() {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setHasBiometricsHardware(hasHardware && isEnrolled);
      } catch {
        setHasBiometricsHardware(false);
      }
    }
    checkBio();
  }, []);

  const languages: { id: Language; label: string }[] = [
    { id: 'en', label: 'English' },
    { id: 'bn', label: 'বাংলা' },
  ];
  const currencies: CurrencyCode[] = ['BDT', 'USD', 'EUR', 'INR'];
  const themes: { id: ThemeMode; label: string }[] = [
    { id: 'light', label: t.settings.themeLight },
    { id: 'dark', label: t.settings.themeDark },
    { id: 'system', label: t.settings.themeSystem },
  ];

  const handleEditProfileOpen = () => {
    setEditName(profileName);
    setEditEmail(profileEmail);
    setShowProfileModal(true);
  };

  const handleProfileSave = () => {
    updateProfile({
      name: editName.trim() || 'User',
      email: editEmail.trim(),
    });
    setShowProfileModal(false);
  };

  const handlePinToggle = () => {
    if (hasPinSet) {
      Alert.alert(t.lock.removePin, '', [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.confirm,
          style: 'destructive',
          onPress: async () => {
            await removePin();
          },
        },
      ]);
    } else {
      setShowPinModal(true);
    }
  };

  const handleBiometricToggle = (enabled: boolean) => {
    if (enabled && !hasBiometricsHardware) {
      Alert.alert(t.common.error, t.lock.biometricsNotAvailable);
      return;
    }
    toggleBiometrics(enabled);
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      await exportTransactionsCSV();
    } catch {
      Alert.alert(t.common.error, t.common.error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      await exportTransactionsJSON();
    } catch {
      Alert.alert(t.common.error, t.common.error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetData = () => {
    Alert.alert(t.export.resetConfirmTitle, t.export.resetConfirmMessage, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: () => {
          // Double confirmation
          Alert.alert(
            t.common.confirm,
            t.export.resetConfirmMessage,
            [
              { text: t.common.cancel, style: 'cancel' },
              {
                text: t.common.confirm,
                style: 'destructive',
                onPress: async () => {
                  try {
                    await resetAllAppData();
                    Alert.alert(t.common.ok, t.export.resetSuccess);
                  } catch {
                    Alert.alert(t.common.error, t.common.error);
                  }
                },
              },
            ],
          );
        },
      },
    ]);
  };

  const initials = (profileName.trim() || 'U')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Screen>
      <ScreenHeader title={t.settings.title} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. USER PROFILE SECTION */}
        <SectionHeader title={t.settings.sections.profile} />
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={[styles.profileName, { color: colors.text }]}>
                  {profileName}
                </Text>
                <Badge
                  label={profileTier === 'pro' ? t.profile.pro : t.profile.free}
                  variant={profileTier === 'pro' ? 'warning' : 'neutral'}
                />
              </View>
              <Text numberOfLines={1} style={[styles.profileEmail, { color: colors.textMuted }]}>
                {profileEmail || t.profile.noEmail}
              </Text>
            </View>
          </View>

          <View style={styles.profileActions}>
            <Pressable
              accessibilityRole="button"
              onPress={handleEditProfileOpen}
              style={[styles.smallBtn, { backgroundColor: colors.surfaceAlt }]}>
              <UserIcon color={colors.primary} size={16} />
              <Text style={[styles.smallBtnText, { color: colors.primary }]}>
                {t.profile.editProfile}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={toggleTier}
              style={[styles.smallBtn, { backgroundColor: colors.surfaceAlt }]}>
              <RotateCcw color={colors.textMuted} size={16} />
              <Text style={[styles.smallBtnText, { color: colors.text }]}>
                {profileTier === 'pro' ? t.profile.switchToFree : t.profile.upgradeToPro}
              </Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* 2. SECURITY SECTION */}
        <SectionHeader title={t.settings.sections.security} />
        <GlassCard style={styles.card}>
          {/* PIN Lock Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <KeyRound color={colors.primary} size={20} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t.lock.appLock}
              </Text>
            </View>
            <Switch
              accessibilityLabel={t.lock.appLock}
              onValueChange={handlePinToggle}
              thumbColor={Platform.OS === 'android' ? colors.primary : undefined}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              value={hasPinSet}
            />
          </View>

          {/* Change PIN button if PIN is set */}
          {hasPinSet && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowPinModal(true)}
              style={[styles.subRow, { borderTopColor: colors.border }]}>
              <Shield color={colors.primary} size={18} />
              <Text style={[styles.subRowText, { color: colors.primary }]}>
                {t.lock.changePin}
              </Text>
            </Pressable>
          )}

          {/* Biometrics Toggle (only active if PIN set) */}
          {hasPinSet && (
            <View style={[styles.settingRow, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
              <View style={styles.settingLabelGroup}>
                <Fingerprint color={colors.primary} size={20} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {t.lock.biometricUnlock}
                </Text>
              </View>
              <Switch
                accessibilityLabel={t.lock.biometricUnlock}
                onValueChange={handleBiometricToggle}
                thumbColor={Platform.OS === 'android' ? colors.primary : undefined}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                value={biometricsEnabled}
              />
            </View>
          )}
        </GlassCard>

        {/* 3. PREFERENCES SECTION */}
        <SectionHeader title={t.settings.sections.preferences} />
        <GlassCard style={styles.card}>
          <Text style={[styles.label, { color: colors.textMuted }]}>{t.settings.language}</Text>
          <OptionRow
            onSelect={setLanguage}
            options={languages.map((item) => ({ id: item.id, label: item.label }))}
            selected={language}
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>{t.settings.currency}</Text>
          <OptionRow
            onSelect={setCurrency}
            options={currencies.map((code) => ({
              id: code,
              label: `${getCurrencySymbol(code)} ${code}`,
            }))}
            selected={currency}
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>{t.settings.theme}</Text>
          <OptionRow onSelect={setTheme} options={themes} selected={theme} />
        </GlassCard>

        {/* 4. DATA MANAGEMENT SECTION */}
        <SectionHeader title={t.settings.sections.data} />
        <GlassCard style={styles.card}>
          <Pressable
            accessibilityRole="button"
            disabled={isExporting}
            onPress={handleExportCSV}
            style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Download color={colors.primary} size={20} />
              <Text style={[styles.actionText, { color: colors.text }]}>{t.export.exportCSV}</Text>
            </View>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            accessibilityRole="button"
            disabled={isExporting}
            onPress={handleExportJSON}
            style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Download color={colors.accent} size={20} />
              <Text style={[styles.actionText, { color: colors.text }]}>{t.export.exportJSON}</Text>
            </View>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Pressable
            accessibilityRole="button"
            onPress={handleResetData}
            style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Trash2 color={colors.danger} size={20} />
              <Text style={[styles.actionText, { color: colors.danger }]}>{t.export.resetData}</Text>
            </View>
          </Pressable>
        </GlassCard>

        {/* 5. ABOUT SECTION */}
        <SectionHeader title={t.settings.sections.about} />
        <Text style={[styles.version, { color: colors.textMuted }]}>
          {t.settings.version} {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={showProfileModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.profile.editProfile}</Text>

            <AppInput
              label={t.profile.name}
              onChangeText={setEditName}
              placeholder={t.profile.namePlaceholder}
              value={editName}
            />

            <AppInput
              keyboardType="email-address"
              label={t.profile.email}
              onChangeText={setEditEmail}
              placeholder={t.profile.emailPlaceholder}
              value={editEmail}
            />

            <View style={styles.modalButtons}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowProfileModal(false)}
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}>
                <Text style={[styles.modalCancelText, { color: colors.text }]}>
                  {t.common.cancel}
                </Text>
              </Pressable>
              <GradientButton
                onPress={handleProfileSave}
                style={styles.modalSaveBtn}
                title={t.common.save}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Setup PIN Modal */}
      {showPinModal && (
        <PinLockModal
          mode="setup"
          onCancel={() => setShowPinModal(false)}
          onSuccess={() => setShowPinModal(false)}
          visible={showPinModal}
        />
      )}
    </Screen>
  );
}

function OptionRow<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { id: T; label: string }[];
  selected: T;
  onSelect: (id: T) => void;
}) {
  const colors = useAppColors();
  return (
    <View style={styles.options}>
      {options.map((option) => {
        const isSelected = option.id === selected;
        return (
          <Pressable
            accessibilityRole="button"
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={[
              styles.option,
              {
                backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}>
            <Text
              style={[
                styles.optionLabel,
                { color: isSelected ? colors.primary : colors.text },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.md,
    paddingBottom: 40,
  },
  title: {
    fontSize: Tokens.typography.hero.fontSize,
    fontWeight: '700',
    marginBottom: Tokens.spacing.sm,
  },
  card: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.md,
  },
  profileCard: {
    padding: Tokens.spacing.lg,
    gap: Tokens.spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Tokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
  },
  profileName: {
    fontSize: Tokens.typography.title.fontSize,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: Tokens.typography.body.fontSize,
  },
  profileActions: {
    flexDirection: 'row',
    gap: Tokens.spacing.sm,
    marginTop: Tokens.spacing.xs,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Tokens.spacing.md,
    paddingVertical: Tokens.spacing.sm,
    borderRadius: Tokens.radius.sm,
  },
  smallBtnText: {
    fontSize: Tokens.typography.caption.fontSize,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  settingLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
  },
  settingLabel: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    fontWeight: '600',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.sm,
    paddingTop: Tokens.spacing.sm,
    borderTopWidth: 1,
    minHeight: 44,
  },
  subRowText: {
    fontSize: Tokens.typography.body.fontSize,
    fontWeight: '600',
  },
  label: {
    marginTop: Tokens.spacing.xs,
    fontSize: Tokens.typography.caption.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Tokens.spacing.sm,
  },
  option: {
    minHeight: 44,
    paddingHorizontal: Tokens.spacing.md,
    borderRadius: Tokens.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: Tokens.typography.body.fontSize,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Tokens.spacing.md,
  },
  actionText: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
  version: {
    textAlign: 'center',
    fontSize: Tokens.typography.caption.fontSize,
    marginTop: Tokens.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Tokens.spacing.lg,
  },
  modalCard: {
    borderRadius: Tokens.radius.card,
    borderWidth: 1,
    padding: Tokens.spacing.xl,
    gap: Tokens.spacing.md,
  },
  modalTitle: {
    fontSize: Tokens.typography.title.fontSize,
    fontWeight: '700',
    marginBottom: Tokens.spacing.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Tokens.spacing.md,
    marginTop: Tokens.spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Tokens.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
  },
});
