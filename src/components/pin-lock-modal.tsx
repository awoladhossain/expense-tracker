/* eslint-disable react-hooks/immutability */
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { Delete, Fingerprint } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColor } from '@/constants/colors';
import { Tokens } from '@/constants/tokens';
import { useI18n } from '@/hooks/useI18n';
import { useLockStore } from '@/store/lockStore';

export type PinLockMode = 'unlock' | 'setup';

interface PinLockModalProps {
  visible?: boolean;
  mode: PinLockMode;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PIN_LENGTH = 4;

export function PinLockModal({
  visible = true,
  mode,
  onSuccess,
  onCancel,
}: PinLockModalProps) {
  const colors = useThemeColor();
  const { t } = useI18n();
  const { biometricsEnabled, verifyPin, setPin, setUnlocked } = useLockStore();

  const [pin, setPinInput] = useState('');
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  const shakeOffset = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  const triggerShake = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    shakeOffset.value = withSequence(
      withTiming(-12, { duration: 60 }),
      withTiming(12, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  }, [shakeOffset]);

  // Check biometric availability
  useEffect(() => {
    async function checkBio() {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setHasBiometrics(hasHardware && isEnrolled);
      } catch {
        setHasBiometrics(false);
      }
    }
    checkBio();
  }, []);

  const handleBiometricAuth = useCallback(async () => {
    if (!biometricsEnabled || !hasBiometrics) return;
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: t.lock.biometricPrompt,
        fallbackLabel: t.lock.enterPin,
        cancelLabel: t.common.cancel,
        disableDeviceFallback: true,
      });
      if (res.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUnlocked(true);
        onSuccess?.();
      }
    } catch (err) {
      console.warn('Biometric auth error', err);
    }
  }, [biometricsEnabled, hasBiometrics, onSuccess, setUnlocked, t]);

  // Auto trigger biometrics on unlock mode
  useEffect(() => {
    if (visible && mode === 'unlock' && biometricsEnabled && hasBiometrics) {
      handleBiometricAuth();
    }
  }, [visible, mode, biometricsEnabled, hasBiometrics, handleBiometricAuth]);

  // Handle Complete PIN
  const handlePinComplete = useCallback(
    async (completedPin: string) => {
      if (mode === 'unlock') {
        const isValid = await verifyPin(completedPin);
        if (isValid) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setErrorMsg(null);
          setPinInput('');
          setUnlocked(true);
          onSuccess?.();
        } else {
          triggerShake();
          setErrorMsg(t.lock.wrongPin);
          setPinInput('');
        }
      } else {
        // Setup mode
        if (step === 'enter') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setFirstPin(completedPin);
          setPinInput('');
          setStep('confirm');
          setErrorMsg(null);
        } else {
          // Confirm step
          if (completedPin === firstPin) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await setPin(completedPin);
            setErrorMsg(null);
            setPinInput('');
            onSuccess?.();
          } else {
            triggerShake();
            setErrorMsg(t.lock.pinsDoNotMatch);
            setPinInput('');
            setStep('enter');
            setFirstPin(null);
          }
        }
      }
    },
    [firstPin, mode, onSuccess, setPin, setUnlocked, step, t, triggerShake, verifyPin],
  );

  const handleKeyPress = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const nextPin = pin + digit;
    setPinInput(nextPin);
    setErrorMsg(null);

    if (nextPin.length === PIN_LENGTH) {
      setTimeout(() => {
        handlePinComplete(nextPin);
      }, 50);
    }
  };

  const handleDelete = () => {
    if (pin.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const getTitle = () => {
    if (mode === 'unlock') return t.lock.enterPin;
    if (step === 'confirm') return t.lock.confirmPin;
    return t.lock.enterNewPin;
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      statusBarTranslucent
      transparent={false}
      visible={visible}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Cancel button if setup mode */}
        {mode === 'setup' && onCancel && (
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={onCancel}
              style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: colors.primary }]}>
                {t.common.cancel}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>

          {/* 4-dot indicator with shake animation */}
          <Animated.View style={[styles.dotsContainer, shakeStyle]}>
            {Array.from({ length: PIN_LENGTH }).map((_, index) => {
              const filled = index < pin.length;
              return (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      borderColor: colors.primary,
                      backgroundColor: filled ? colors.primary : 'transparent',
                    },
                  ]}
                />
              );
            })}
          </Animated.View>

          {/* Error Message */}
          {errorMsg ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
          ) : (
            <View style={styles.errorSpacer} />
          )}

          {/* Keypad */}
          <View style={styles.keypad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keyRow}>
                {row.map((digit) => (
                  <KeypadButton
                    key={digit}
                    digit={digit}
                    onPress={() => handleKeyPress(digit)}
                  />
                ))}
              </View>
            ))}

            {/* Bottom Row: Biometric or empty, 0, Backspace */}
            <View style={styles.keyRow}>
              {mode === 'unlock' && biometricsEnabled && hasBiometrics ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={handleBiometricAuth}
                  style={[styles.keyButton, { backgroundColor: colors.surfaceAlt }]}>
                  <Fingerprint color={colors.primary} size={28} />
                </Pressable>
              ) : (
                <View style={styles.keyButtonEmpty} />
              )}

              <KeypadButton digit="0" onPress={() => handleKeyPress('0')} />

              <Pressable
                accessibilityRole="button"
                onPress={handleDelete}
                style={[styles.keyButton, { backgroundColor: colors.surfaceAlt }]}>
                <Delete color={colors.textMuted} size={26} />
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function KeypadButton({
  digit,
  onPress,
}: {
  digit: string;
  onPress: () => void;
}) {
  const colors = useThemeColor();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.keyButton,
        {
          backgroundColor: pressed ? colors.border : colors.surface,
          borderColor: colors.border,
        },
      ]}>
      <Text style={[styles.keyText, { color: colors.text }]}>{digit}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: Tokens.spacing.lg,
    paddingTop: Tokens.spacing.sm,
    alignItems: 'flex-start',
  },
  cancelButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing.sm,
  },
  cancelText: {
    fontSize: Tokens.typography.bodyLg.fontSize,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Tokens.spacing.xl,
    paddingBottom: Tokens.spacing.xxl,
  },
  title: {
    fontSize: Tokens.typography.headline.fontSize,
    fontWeight: '700',
    marginBottom: Tokens.spacing.section,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: Tokens.spacing.lg,
    marginBottom: Tokens.spacing.lg,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: Tokens.radius.full,
    borderWidth: 2,
  },
  errorText: {
    fontSize: Tokens.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: Tokens.spacing.xl,
    minHeight: 22,
    textAlign: 'center',
  },
  errorSpacer: {
    height: 22,
    marginBottom: Tokens.spacing.xl,
  },
  keypad: {
    width: '100%',
    maxWidth: 300,
    gap: Tokens.spacing.md,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: Tokens.radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  keyButtonEmpty: {
    width: 72,
    height: 72,
  },
  keyText: {
    fontSize: 26,
    fontWeight: '600',
  },
});
