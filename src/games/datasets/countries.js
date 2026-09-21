/**
 * Countries & Flag Emojis Dataset for لعبة "أعلام" (Flags Game)
 * Features Arab league nations, world powers, and diverse countries with rich Arabic aliases.
 */

export const COUNTRIES = [
  // --- Arab Nations ---
  {
    flag: '🇸🇦',
    name: 'السعودية',
    code: 'SA',
    aliases: ['المملكة العربية السعودية', 'سعودية', 'KSA'],
    region: 'الوطن العربي / آسيا',
  },
  {
    flag: '🇪🇬',
    name: 'مصر',
    code: 'EG',
    aliases: ['جمهورية مصر العربية', 'المصرية', 'أم الدنيا'],
    region: 'الوطن العربي / إفريقيا',
  },
  {
    flag: '🇦🇪',
    name: 'الإمارات',
    code: 'AE',
    aliases: ['الامارات', 'الإمارات العربية المتحدة', 'الامارات العربية المتحدة', 'دبي', 'ابوظبي', 'UAE'],
    region: 'الوطن العربي / آسيا',
  },
  {
    flag: '🇵🇸',
    name: 'فلسطين',
    code: 'PS',
    aliases: ['دولة فلسطين', 'القدس'],
    region: 'الوطن العربي / آسيا',
  },
  {
    flag: '🇶🇦',
    name: 'قطر',
    code: 'QA',
    aliases: ['دولة قطر'],
    region: 'الوطن العربي / آسيا',
  },
  {
    flag: '🇰🇼',
    name: 'الكويت',
    code: 'KW',
    aliases: ['دولة الكويت', 'كويت'],
    region: 'الوطن العربي / آسيا',
  },
  {
    flag: '🇧🇭',
    name: 'البحرين',
    code: 'BH',
    aliases: ['مملكة البحرين', 'بحرين'],
    region: 'الوطن العربي / آسيا',
  },
  {
    flag: '🇴🇲',
    name: 'عمان',
    code: 'OM',
    aliases: ['سلطنة عمان', 'عُمان', 'سلطنة عُمان'],
    region: 'الوطن العربي / آسيا',
  },
  {
    flag: '🇯🇴',
    name: 'الأردن',
    code: 'JO',
    aliases: ['الاردن', 'المملكة الأردنية الهاشمية', 'اردن'],
    region: 'الوطن العربي / آسيا',
  },
  {
    flag: '🇮🇶',
    name: 'العراق',
    code: 'IQ',
    aliases: ['جمهورية العراق', 'عراق', 'بلاد الرافدين'],
    region: 'الوطن العربي / آسيا',
  },
  {
    flag: '🇱🇧',
    name: 'لبنان',
    code: 'LB',
    aliases: ['الجمهورية اللبنانية'],
    region: 'الوطن العربي / آسيا',
  },
  {
    flag: '🇸🇾',
    name: 'سوريا',
    code: 'SY',
    aliases: ['الجمهورية العربية السورية', 'سورية', 'الشام'],
    region: 'الوطن العربي / آسيا',
  },
  {
    flag: '🇾🇪',
    name: 'اليمن',
    code: 'YE',
    aliases: ['الجمهورية اليمنية', 'يمن'],
    region: 'الوطن العربي / آسيا',
  },
  {
    flag: '🇲🇦',
    name: 'المغرب',
    code: 'MA',
    aliases: ['المملكة المغربية', 'مغرب'],
    region: 'الوطن العربي / إفريقيا',
  },
  {
    flag: '🇩🇿',
    name: 'الجزائر',
    code: 'DZ',
    aliases: ['الجمهورية الجزائرية', 'جزائر', 'بلد المليون شهيد'],
    region: 'الوطن العربي / إفريقيا',
  },
  {
    flag: '🇹🇳',
    name: 'تونس',
    code: 'TN',
    aliases: ['الجمهورية التونسية'],
    region: 'الوطن العربي / إفريقيا',
  },
  {
    flag: '🇱🇾',
    name: 'ليبيا',
    code: 'LY',
    aliases: ['دولة ليبيا'],
    region: 'الوطن العربي / إفريقيا',
  },
  {
    flag: '🇸🇩',
    name: 'السودان',
    code: 'SD',
    aliases: ['جمهورية السودان', 'سودان'],
    region: 'الوطن العربي / إفريقيا',
  },
  {
    flag: '🇸🇴',
    name: 'الصومال',
    code: 'SO',
    aliases: ['جمهورية الصومال', 'صومال'],
    region: 'الوطن العربي / إفريقيا',
  },
  {
    flag: '🇲🇷',
    name: 'موريتانيا',
    code: 'MR',
    aliases: ['الجمهورية الإسلامية الموريتانية', 'موريتانيا'],
    region: 'الوطن العربي / إفريقيا',
  },
  {
    flag: '🇩🇯',
    name: 'جيبوتي',
    code: 'DJ',
    aliases: ['جمهورية جيبوتي'],
    region: 'الوطن العربي / إفريقيا',
  },
  {
    flag: '🇰🇲',
    name: 'جزر القمر',
    code: 'KM',
    aliases: ['جمهورية جزر القمر', 'القمر'],
    region: 'الوطن العربي / إفريقيا',
  },

  // --- World Nations (Asia, Europe, Americas, Africa) ---
  {
    flag: '🇹🇷',
    name: 'تركيا',
    code: 'TR',
    aliases: ['الجمهورية التركية', 'تركيا'],
    region: 'أوراسيا',
  },
  {
    flag: '🇯🇵',
    name: 'اليابان',
    code: 'JP',
    aliases: ['دولة اليابان', 'يابان', 'كوكب اليابان'],
    region: 'آسيا',
  },
  {
    flag: '🇰🇷',
    name: 'كوريا الجنوبية',
    code: 'KR',
    aliases: ['كوريا', 'جنوب كوريا'],
    region: 'آسيا',
  },
  {
    flag: '🇨🇳',
    name: 'الصين',
    code: 'CN',
    aliases: ['جمهورية الصين الشعبية', 'صين'],
    region: 'آسيا',
  },
  {
    flag: '🇮🇳',
    name: 'الهند',
    code: 'IN',
    aliases: ['جمهورية الهند', 'هند'],
    region: 'آسيا',
  },
  {
    flag: '🇵🇰',
    name: 'باكستان',
    code: 'PK',
    aliases: ['جمهورية باكستان الإسلامية'],
    region: 'آسيا',
  },
  {
    flag: '🇮🇩',
    name: 'إندونيسيا',
    code: 'ID',
    aliases: ['اندونيسيا', 'جمهورية إندونيسيا'],
    region: 'آسيا',
  },
  {
    flag: '🇲🇾',
    name: 'ماليزيا',
    code: 'MY',
    aliases: ['دولة ماليزيا'],
    region: 'آسيا',
  },
  {
    flag: '🇷🇺',
    name: 'روسيا',
    code: 'RU',
    aliases: ['روسيا الاتحادية', 'الاتحاد الروسي'],
    region: 'أوروبا / آسيا',
  },
  {
    flag: '🇩🇪',
    name: 'ألمانيا',
    code: 'DE',
    aliases: ['المانيا', 'جمهورية ألمانيا الاتحادية'],
    region: 'أوروبا',
  },
  {
    flag: '🇫🇷',
    name: 'فرنسا',
    code: 'FR',
    aliases: ['الجمهورية الفرنسية'],
    region: 'أوروبا',
  },
  {
    flag: '🇬🇧',
    name: 'بريطانيا',
    code: 'GB',
    aliases: ['المملكة المتحدة', 'انجلترا', 'إنجلترا', 'بريطانيا العظمى', 'UK'],
    region: 'أوروبا',
  },
  {
    flag: '🇮🇹',
    name: 'إيطاليا',
    code: 'IT',
    aliases: ['ايطاليا', 'الجمهورية الإيطالية'],
    region: 'أوروبا',
  },
  {
    flag: '🇪🇸',
    name: 'إسبانيا',
    code: 'ES',
    aliases: ['اسبانيا', 'مملكة إسبانيا'],
    region: 'أوروبا',
  },
  {
    flag: '🇵🇹',
    name: 'البرتغال',
    code: 'PT',
    aliases: ['برتغال', 'الجمهورية البرتغالية'],
    region: 'أوروبا',
  },
  {
    flag: '🇳🇱',
    name: 'هولندا',
    code: 'NL',
    aliases: ['مملكة هولندا'],
    region: 'أوروبا',
  },
  {
    flag: '🇨🇭',
    name: 'سويسرا',
    code: 'CH',
    aliases: ['الاتحاد السويسري'],
    region: 'أوروبا',
  },
  {
    flag: '🇸🇪',
    name: 'السويد',
    code: 'SE',
    aliases: ['سويد', 'مملكة السويد'],
    region: 'أوروبا',
  },
  {
    flag: '🇳🇴',
    name: 'النرويج',
    code: 'NO',
    aliases: ['نرويج', 'مملكة النرويج'],
    region: 'أوروبا',
  },
  {
    flag: '🇬🇷',
    name: 'اليونان',
    code: 'GR',
    aliases: ['يونان', 'الجمهورية الهيلينية'],
    region: 'أوروبا',
  },
  {
    flag: '🇧🇷',
    name: 'البرازيل',
    code: 'BR',
    aliases: ['برازيل', 'جمهورية البرازيل الاتحادية'],
    region: 'أمريكا الجنوبية',
  },
  {
    flag: '🇦🇷',
    name: 'الأرجنتين',
    code: 'AR',
    aliases: ['الارجنتين', 'ارجنتين', 'جمهورية الأرجنتين'],
    region: 'أمريكا الجنوبية',
  },
  {
    flag: '🇺🇸',
    name: 'أمريكا',
    code: 'US',
    aliases: ['امريكا', 'الولايات المتحدة', 'الولايات المتحدة الأمريكية', 'USA'],
    region: 'أمريكا الشمالية',
  },
  {
    flag: '🇨🇦',
    name: 'كندا',
    code: 'CA',
    aliases: ['دولة كندا'],
    region: 'أمريكا الشمالية',
  },
  {
    flag: '🇲🇽',
    name: 'المكسيك',
    code: 'MX',
    aliases: ['مكسيك', 'الولايات المكسيكية المتحدة'],
    region: 'أمريكا الشمالية',
  },
  {
    flag: '🇦🇺',
    name: 'أستراليا',
    code: 'AU',
    aliases: ['استراليا', 'كومنولث أستراليا'],
    region: 'أوقيانوسيا',
  },
  {
    flag: '🇿🇦',
    name: 'جنوب إفريقيا',
    code: 'ZA',
    aliases: ['جنوب افريقيا', 'جمهورية جنوب إفريقيا'],
    region: 'إفريقيا',
  },
  {
    flag: '🇳🇬',
    name: 'نيجيريا',
    code: 'NG',
    aliases: ['جمهورية نيجيريا الاتحادية'],
    region: 'إفريقيا',
  },
  {
    flag: '🇸🇳',
    name: 'السنغال',
    code: 'SN',
    aliases: ['سنغال', 'جمهورية السنغال'],
    region: 'إفريقيا',
  },
  {
    flag: '🇮🇷',
    name: 'إيران',
    code: 'IR',
    aliases: ['ايران', 'الجمهورية الإسلامية الإيرانية'],
    region: 'آسيا',
  },
];

/**
 * Returns the CDN image URL for a country's flag (high quality 640px PNG)
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 */
export function getFlagImageUrl(countryCode) {
  if (!countryCode) return '';
  return `https://flagcdn.com/w640/${countryCode.toLowerCase()}.png`;
}

/**
 * Returns a random country from the dataset with flagImageUrl
 */
export function getRandomCountry() {
  const index = Math.floor(Math.random() * COUNTRIES.length);
  const country = COUNTRIES[index];
  return {
    ...country,
    flagImageUrl: getFlagImageUrl(country.code),
  };
}

export default COUNTRIES;
