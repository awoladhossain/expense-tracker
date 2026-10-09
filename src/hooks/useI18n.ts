import { getTranslations } from '@/i18n';
import { useSettingsStore } from '@/store/settingsStore';

export function useI18n() {
  const language = useSettingsStore((state) => state.language);
  return { language, t: getTranslations(language) };
}
