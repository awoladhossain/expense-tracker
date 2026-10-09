import Constants from 'expo-constants';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { useAppColors } from '@/hooks/useAppColors';
import { useI18n } from '@/hooks/useI18n';
import { useSettingsStore, type CurrencyCode, type Language, type ThemeMode } from '@/store/settingsStore';
import { getCurrencySymbol } from '@/utils/currency';

export default function SettingsScreen() {
  const colors = useAppColors();
  const { t } = useI18n();
  const language = useSettingsStore((state) => state.language);
  const currency = useSettingsStore((state) => state.currency);
  const theme = useSettingsStore((state) => state.theme);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setCurrency = useSettingsStore((state) => state.setCurrency);
  const setTheme = useSettingsStore((state) => state.setTheme);

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

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t.settings.title}</Text>

        <Text style={[styles.label, { color: colors.textMuted }]}>{t.settings.language}</Text>
        <OptionRow
          options={languages.map((item) => ({ id: item.id, label: item.label }))}
          selected={language}
          onSelect={setLanguage}
        />

        <Text style={[styles.label, { color: colors.textMuted }]}>{t.settings.currency}</Text>
        <OptionRow
          options={currencies.map((code) => ({ id: code, label: `${getCurrencySymbol(code)} ${code}` }))}
          selected={currency}
          onSelect={setCurrency}
        />

        <Text style={[styles.label, { color: colors.textMuted }]}>{t.settings.theme}</Text>
        <OptionRow options={themes} selected={theme} onSelect={setTheme} />

        <Text style={[styles.version, { color: colors.textMuted }]}>
          {t.settings.version} {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>
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
            key={option.id}
            accessibilityRole="button"
            onPress={() => onSelect(option.id)}
            style={[
              styles.option,
              {
                backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}>
            <Text style={[styles.optionLabel, { color: isSelected ? colors.primary : colors.text }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  label: { marginTop: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { fontSize: 15, fontWeight: '700' },
  version: { marginTop: 24, textAlign: 'center', fontSize: 13 },
});
