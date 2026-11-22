export type LanguageCode =
  | 'ar'
  | 'ar-IQ'
  | 'ar-SA'
  | 'ar-EG'
  | 'ar-SY'
  | 'ar-MA'
  | 'en'
  | 'fr'
  | 'tr'
  | 'es'
  | 'de'

export type LanguageOption = {
  code: LanguageCode
  name: string
  nativeName: string
  direction: 'rtl' | 'ltr'
  group: 'arabic' | 'international'
}

export const languages: LanguageOption[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية الفصحى', direction: 'rtl', group: 'arabic' },
  { code: 'ar-IQ', name: 'Iraqi Arabic', nativeName: 'اللهجة العراقية', direction: 'rtl', group: 'arabic' },
  { code: 'ar-SA', name: 'Gulf Arabic', nativeName: 'اللهجة الخليجية', direction: 'rtl', group: 'arabic' },
  { code: 'ar-EG', name: 'Egyptian Arabic', nativeName: 'اللهجة المصرية', direction: 'rtl', group: 'arabic' },
  { code: 'ar-SY', name: 'Levantine Arabic', nativeName: 'اللهجة الشامية', direction: 'rtl', group: 'arabic' },
  { code: 'ar-MA', name: 'Maghrebi Arabic', nativeName: 'اللهجة المغاربية', direction: 'rtl', group: 'arabic' },
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', group: 'international' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', group: 'international' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr', group: 'international' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', group: 'international' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', group: 'international' },
]

export const DEFAULT_LANGUAGE: LanguageCode = 'ar'
