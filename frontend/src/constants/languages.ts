/**
 * Supported Languages for OCR
 * Extracted from VideOCR-GLM CLI lang_dictionaries.py
 */

export interface Language {
  code: string
  name: string
  category: string
}

export const LATIN_LANGUAGES: Language[] = [
  { code: 'af', name: 'Afrikaans', category: 'Latin' },
  { code: 'az', name: 'Azerbaijani', category: 'Latin' },
  { code: 'bs', name: 'Bosnian', category: 'Latin' },
  { code: 'cs', name: 'Czech', category: 'Latin' },
  { code: 'cy', name: 'Welsh', category: 'Latin' },
  { code: 'da', name: 'Danish', category: 'Latin' },
  { code: 'de', name: 'German', category: 'Latin' },
  { code: 'es', name: 'Spanish', category: 'Latin' },
  { code: 'et', name: 'Estonian', category: 'Latin' },
  { code: 'fr', name: 'French', category: 'Latin' },
  { code: 'ga', name: 'Irish', category: 'Latin' },
  { code: 'hr', name: 'Croatian', category: 'Latin' },
  { code: 'hu', name: 'Hungarian', category: 'Latin' },
  { code: 'id', name: 'Indonesian', category: 'Latin' },
  { code: 'is', name: 'Icelandic', category: 'Latin' },
  { code: 'it', name: 'Italian', category: 'Latin' },
  { code: 'ku', name: 'Kurdish', category: 'Latin' },
  { code: 'la', name: 'Latin', category: 'Latin' },
  { code: 'lt', name: 'Lithuanian', category: 'Latin' },
  { code: 'lv', name: 'Latvian', category: 'Latin' },
  { code: 'mi', name: 'Maori', category: 'Latin' },
  { code: 'ms', name: 'Malay', category: 'Latin' },
  { code: 'mt', name: 'Maltese', category: 'Latin' },
  { code: 'nl', name: 'Dutch', category: 'Latin' },
  { code: 'no', name: 'Norwegian', category: 'Latin' },
  { code: 'oc', name: 'Occitan', category: 'Latin' },
  { code: 'pi', name: 'Pali', category: 'Latin' },
  { code: 'pl', name: 'Polish', category: 'Latin' },
  { code: 'pt', name: 'Portuguese', category: 'Latin' },
  { code: 'ro', name: 'Romanian', category: 'Latin' },
  { code: 'rs_latin', name: 'Serbian (Latin)', category: 'Latin' },
  { code: 'sk', name: 'Slovak', category: 'Latin' },
  { code: 'sl', name: 'Slovenian', category: 'Latin' },
  { code: 'sq', name: 'Albanian', category: 'Latin' },
  { code: 'sv', name: 'Swedish', category: 'Latin' },
  { code: 'sw', name: 'Swahili', category: 'Latin' },
  { code: 'tl', name: 'Tagalog', category: 'Latin' },
  { code: 'tr', name: 'Turkish', category: 'Latin' },
  { code: 'uz', name: 'Uzbek', category: 'Latin' },
  { code: 'vi', name: 'Vietnamese', category: 'Latin' },
  { code: 'french', name: 'French (Alternative)', category: 'Latin' },
  { code: 'german', name: 'German (Alternative)', category: 'Latin' },
  { code: 'fi', name: 'Finnish', category: 'Latin' },
  { code: 'eu', name: 'Basque', category: 'Latin' },
  { code: 'gl', name: 'Galician', category: 'Latin' },
  { code: 'lb', name: 'Luxembourgish', category: 'Latin' },
  { code: 'rm', name: 'Romansh', category: 'Latin' },
  { code: 'ca', name: 'Catalan', category: 'Latin' },
  { code: 'qu', name: 'Quechua', category: 'Latin' },
]

export const ARABIC_LANGUAGES: Language[] = [
  { code: 'ar', name: 'Arabic', category: 'Arabic' },
  { code: 'fa', name: 'Persian', category: 'Arabic' },
  { code: 'ug', name: 'Uyghur', category: 'Arabic' },
  { code: 'ur', name: 'Urdu', category: 'Arabic' },
  { code: 'ps', name: 'Pashto', category: 'Arabic' },
  { code: 'ku', name: 'Kurdish', category: 'Arabic' },
  { code: 'sd', name: 'Sindhi', category: 'Arabic' },
  { code: 'bal', name: 'Baluchi', category: 'Arabic' },
]

export const ESLAV_LANGUAGES: Language[] = [
  { code: 'ru', name: 'Russian', category: 'East Slavic' },
  { code: 'be', name: 'Belarusian', category: 'East Slavic' },
  { code: 'uk', name: 'Ukrainian', category: 'East Slavic' },
]

export const CYRILLIC_LANGUAGES: Language[] = [
  { code: 'ru', name: 'Russian', category: 'Cyrillic' },
  { code: 'rs_cyrillic', name: 'Serbian (Cyrillic)', category: 'Cyrillic' },
  { code: 'be', name: 'Belarusian', category: 'Cyrillic' },
  { code: 'bg', name: 'Bulgarian', category: 'Cyrillic' },
  { code: 'uk', name: 'Ukrainian', category: 'Cyrillic' },
  { code: 'mn', name: 'Mongolian', category: 'Cyrillic' },
  { code: 'abq', name: 'Abaza', category: 'Cyrillic' },
  { code: 'ady', name: 'Adyghe', category: 'Cyrillic' },
  { code: 'kbd', name: 'Kabardian', category: 'Cyrillic' },
  { code: 'ava', name: 'Avar', category: 'Cyrillic' },
  { code: 'dar', name: 'Dargwa', category: 'Cyrillic' },
  { code: 'inh', name: 'Ingush', category: 'Cyrillic' },
  { code: 'che', name: 'Chechen', category: 'Cyrillic' },
  { code: 'lbe', name: 'Lak', category: 'Cyrillic' },
  { code: 'lez', name: 'Lezgin', category: 'Cyrillic' },
  { code: 'tab', name: 'Tabassaran', category: 'Cyrillic' },
  { code: 'kk', name: 'Kazakh', category: 'Cyrillic' },
  { code: 'ky', name: 'Kyrgyz', category: 'Cyrillic' },
  { code: 'tg', name: 'Tajik', category: 'Cyrillic' },
  { code: 'mk', name: 'Macedonian', category: 'Cyrillic' },
  { code: 'tt', name: 'Tatar', category: 'Cyrillic' },
  { code: 'cv', name: 'Chuvash', category: 'Cyrillic' },
  { code: 'ba', name: 'Bashkir', category: 'Cyrillic' },
  { code: 'mhr', name: 'Eastern Mari', category: 'Cyrillic' },
  { code: 'mo', name: 'Moldovan', category: 'Cyrillic' },
  { code: 'udm', name: 'Udmurt', category: 'Cyrillic' },
  { code: 'kv', name: 'Komi', category: 'Cyrillic' },
  { code: 'os', name: 'Ossetian', category: 'Cyrillic' },
  { code: 'bua', name: 'Buryat', category: 'Cyrillic' },
  { code: 'xal', name: 'Kalmyk', category: 'Cyrillic' },
  { code: 'tyv', name: 'Tuvan', category: 'Cyrillic' },
  { code: 'sah', name: 'Yakut', category: 'Cyrillic' },
  { code: 'kaa', name: 'Karakalpak', category: 'Cyrillic' },
]

export const DEVANAGARI_LANGUAGES: Language[] = [
  { code: 'hi', name: 'Hindi', category: 'Devanagari' },
  { code: 'mr', name: 'Marathi', category: 'Devanagari' },
  { code: 'ne', name: 'Nepali', category: 'Devanagari' },
  { code: 'bh', name: 'Bhojpuri', category: 'Devanagari' },
  { code: 'mai', name: 'Maithili', category: 'Devanagari' },
  { code: 'ang', name: 'Angika', category: 'Devanagari' },
  { code: 'bho', name: 'Bhojpuri (Alternative)', category: 'Devanagari' },
  { code: 'mah', name: 'Maharashtri', category: 'Devanagari' },
  { code: 'sck', name: 'Sikkimese', category: 'Devanagari' },
  { code: 'new', name: 'Newari', category: 'Devanagari' },
  { code: 'gom', name: 'Konkani', category: 'Devanagari' },
  { code: 'sa', name: 'Sanskrit', category: 'Devanagari' },
  { code: 'bgc', name: 'Haryanvi', category: 'Devanagari' },
]

export const SPECIFIC_LANGUAGES: Language[] = [
  { code: 'ch', name: 'Chinese (Simplified)', category: 'Specific' },
  { code: 'chinese_cht', name: 'Chinese (Traditional)', category: 'Specific' },
  { code: 'japan', name: 'Japanese', category: 'Specific' },
  { code: 'en', name: 'English', category: 'Specific' },
  { code: 'korean', name: 'Korean', category: 'Specific' },
  { code: 'th', name: 'Thai', category: 'Specific' },
  { code: 'el', name: 'Greek', category: 'Specific' },
  { code: 'te', name: 'Telugu', category: 'Specific' },
  { code: 'ta', name: 'Tamil', category: 'Specific' },
  { code: 'ka', name: 'Georgian', category: 'Specific' },
]

// Combine all languages and remove duplicates
export const ALL_LANGUAGES: Language[] = [
  ...SPECIFIC_LANGUAGES,
  ...LATIN_LANGUAGES,
  ...ARABIC_LANGUAGES,
  ...ESLAV_LANGUAGES,
  ...CYRILLIC_LANGUAGES,
  ...DEVANAGARI_LANGUAGES,
].filter((lang, index, self) => 
  index === self.findIndex(l => l.code === lang.code)
)

// Get language by code
export const getLanguageByCode = (code: string): Language | undefined => {
  return ALL_LANGUAGES.find(lang => lang.code === code)
}

// Get languages by category
export const getLanguagesByCategory = (category: string): Language[] => {
  return ALL_LANGUAGES.filter(lang => lang.category === category)
}

// Get all unique categories
export const LANGUAGE_CATEGORIES = Array.from(
  new Set(ALL_LANGUAGES.map(lang => lang.category))
).sort()