/**
 * Countries & Flag Emojis Dataset for لعبة "أعلام" (Flags Game)
 * Features Arab league nations, world powers, and diverse countries with rich Arabic aliases.
 * 
 * Includes Difficulty Levels (Easy: 15%, Medium: 30%, Hard: 55%)
 * and Question Pool / Shuffle Bag system for 100% zero-repetition per cycle.
 */

export const COUNTRIES = [
  // ==================== EASY (15% = 15 countries) ====================
  {
    flag: '🇸🇦',
    name: 'السعودية',
    code: 'SA',
    aliases: ['المملكة العربية السعودية', 'سعودية', 'KSA'],
    region: 'الوطن العربي / آسيا',
    difficulty: 'easy',
  },
  {
    flag: '🇪🇬',
    name: 'مصر',
    code: 'EG',
    aliases: ['جمهورية مصر العربية', 'المصرية', 'أم الدنيا'],
    region: 'الوطن العربي / إفريقيا',
    difficulty: 'easy',
  },
  {
    flag: '🇦🇪',
    name: 'الإمارات',
    code: 'AE',
    aliases: ['الامارات', 'الإمارات العربية المتحدة', 'الامارات العربية المتحدة', 'دبي', 'ابوظبي', 'UAE'],
    region: 'الوطن العربي / آسيا',
    difficulty: 'easy',
  },
  {
    flag: '🇵🇸',
    name: 'فلسطين',
    code: 'PS',
    aliases: ['دولة فلسطين', 'القدس'],
    region: 'الوطن العربي / آسيا',
    difficulty: 'easy',
  },
  {
    flag: '🇶🇦',
    name: 'قطر',
    code: 'QA',
    aliases: ['دولة قطر'],
    region: 'الوطن العربي / آسيا',
    difficulty: 'easy',
  },
  {
    flag: '🇰🇼',
    name: 'الكويت',
    code: 'KW',
    aliases: ['دولة الكويت', 'كويت'],
    region: 'الوطن العربي / آسيا',
    difficulty: 'easy',
  },
  {
    flag: '🇮🇶',
    name: 'العراق',
    code: 'IQ',
    aliases: ['جمهورية العراق', 'عراق', 'بلاد الرافدين'],
    region: 'الوطن العربي / آسيا',
    difficulty: 'easy',
  },
  {
    flag: '🇸🇾',
    name: 'سوريا',
    code: 'SY',
    aliases: ['الجمهورية العربية السورية', 'سورية', 'الشام'],
    region: 'الوطن العربي / آسيا',
    difficulty: 'easy',
  },
  {
    flag: '🇲🇦',
    name: 'المغرب',
    code: 'MA',
    aliases: ['المملكة المغربية', 'مغرب'],
    region: 'الوطن العربي / إفريقيا',
    difficulty: 'easy',
  },
  {
    flag: '🇺🇸',
    name: 'أمريكا',
    code: 'US',
    aliases: ['امريكا', 'الولايات المتحدة', 'الولايات المتحدة الأمريكية', 'USA'],
    region: 'أمريكا الشمالية',
    difficulty: 'easy',
  },
  {
    flag: '🇫🇷',
    name: 'فرنسا',
    code: 'FR',
    aliases: ['الجمهورية الفرنسية'],
    region: 'أوروبا',
    difficulty: 'easy',
  },
  {
    flag: '🇩🇪',
    name: 'ألمانيا',
    code: 'DE',
    aliases: ['المانيا', 'جمهورية ألمانيا الاتحادية'],
    region: 'أوروبا',
    difficulty: 'easy',
  },
  {
    flag: '🇬🇧',
    name: 'بريطانيا',
    code: 'GB',
    aliases: ['المملكة المتحدة', 'انجلترا', 'إنجلترا', 'بريطانيا العظمى', 'UK'],
    region: 'أوروبا',
    difficulty: 'easy',
  },
  {
    flag: '🇯🇵',
    name: 'اليابان',
    code: 'JP',
    aliases: ['دولة اليابان', 'يابان', 'كوكب اليابان'],
    region: 'آسيا',
    difficulty: 'easy',
  },
  {
    flag: '🇨🇳',
    name: 'الصين',
    code: 'CN',
    aliases: ['جمهورية الصين الشعبية', 'صين'],
    region: 'آسيا',
    difficulty: 'easy',
  },

  // ==================== MEDIUM (30% = 30 countries) ====================
  {
    flag: '🇧🇭',
    name: 'البحرين',
    code: 'BH',
    aliases: ['مملكة البحرين', 'بحرين'],
    region: 'الوطن العربي / آسيا',
    difficulty: 'medium',
  },
  {
    flag: '🇴🇲',
    name: 'عمان',
    code: 'OM',
    aliases: ['سلطنة عمان', 'عُمان', 'سلطنة عُمان'],
    region: 'الوطن العربي / آسيا',
    difficulty: 'medium',
  },
  {
    flag: '🇯🇴',
    name: 'الأردن',
    code: 'JO',
    aliases: ['الاردن', 'المملكة الأردنية الهاشمية', 'اردن'],
    region: 'الوطن العربي / آسيا',
    difficulty: 'medium',
  },
  {
    flag: '🇱🇧',
    name: 'لبنان',
    code: 'LB',
    aliases: ['الجمهورية اللبنانية'],
    region: 'الوطن العربي / آسيا',
    difficulty: 'medium',
  },
  {
    flag: '🇾🇪',
    name: 'اليمن',
    code: 'YE',
    aliases: ['الجمهورية اليمنية', 'يمن'],
    region: 'الوطن العربي / آسيا',
    difficulty: 'medium',
  },
  {
    flag: '🇩🇿',
    name: 'الجزائر',
    code: 'DZ',
    aliases: ['الجمهورية الجزائرية', 'جزائر', 'بلد المليون شهيد'],
    region: 'الوطن العربي / إفريقيا',
    difficulty: 'medium',
  },
  {
    flag: '🇹🇳',
    name: 'تونس',
    code: 'TN',
    aliases: ['الجمهورية التونسية'],
    region: 'الوطن العربي / إفريقيا',
    difficulty: 'medium',
  },
  {
    flag: '🇱🇾',
    name: 'ليبيا',
    code: 'LY',
    aliases: ['دولة ليبيا'],
    region: 'الوطن العربي / إفريقيا',
    difficulty: 'medium',
  },
  {
    flag: '🇸🇩',
    name: 'السودان',
    code: 'SD',
    aliases: ['جمهورية السودان', 'سودان'],
    region: 'الوطن العربي / إفريقيا',
    difficulty: 'medium',
  },
  {
    flag: '🇸🇴',
    name: 'الصومال',
    code: 'SO',
    aliases: ['جمهورية الصومال', 'صومال'],
    region: 'الوطن العربي / إفريقيا',
    difficulty: 'medium',
  },
  {
    flag: '🇹🇷',
    name: 'تركيا',
    code: 'TR',
    aliases: ['الجمهورية التركية'],
    region: 'أوراسيا',
    difficulty: 'medium',
  },
  {
    flag: '🇰🇷',
    name: 'كوريا الجنوبية',
    code: 'KR',
    aliases: ['كوريا', 'جنوب كوريا'],
    region: 'آسيا',
    difficulty: 'medium',
  },
  {
    flag: '🇮🇳',
    name: 'الهند',
    code: 'IN',
    aliases: ['جمهورية الهند', 'هند'],
    region: 'آسيا',
    difficulty: 'medium',
  },
  {
    flag: '🇵🇰',
    name: 'باكستان',
    code: 'PK',
    aliases: ['جمهورية باكستان الإسلامية'],
    region: 'آسيا',
    difficulty: 'medium',
  },
  {
    flag: '🇮🇩',
    name: 'إندونيسيا',
    code: 'ID',
    aliases: ['اندونيسيا', 'جمهورية إندونيسيا'],
    region: 'آسيا',
    difficulty: 'medium',
  },
  {
    flag: '🇲🇾',
    name: 'ماليزيا',
    code: 'MY',
    aliases: ['دولة ماليزيا'],
    region: 'آسيا',
    difficulty: 'medium',
  },
  {
    flag: '🇷🇺',
    name: 'روسيا',
    code: 'RU',
    aliases: ['روسيا الاتحادية', 'الاتحاد الروسي'],
    region: 'أوروبا / آسيا',
    difficulty: 'medium',
  },
  {
    flag: '🇮🇹',
    name: 'إيطاليا',
    code: 'IT',
    aliases: ['ايطاليا', 'الجمهورية الإيطالية'],
    region: 'أوروبا',
    difficulty: 'medium',
  },
  {
    flag: '🇪🇸',
    name: 'إسبانيا',
    code: 'ES',
    aliases: ['اسبانيا', 'مملكة إسبانيا'],
    region: 'أوروبا',
    difficulty: 'medium',
  },
  {
    flag: '🇵🇹',
    name: 'البرتغال',
    code: 'PT',
    aliases: ['برتغال', 'الجمهورية البرتغالية'],
    region: 'أوروبا',
    difficulty: 'medium',
  },
  {
    flag: '🇳🇱',
    name: 'هولندا',
    code: 'NL',
    aliases: ['مملكة هولندا'],
    region: 'أوروبا',
    difficulty: 'medium',
  },
  {
    flag: '🇨🇭',
    name: 'سويسرا',
    code: 'CH',
    aliases: ['الاتحاد السويسري'],
    region: 'أوروبا',
    difficulty: 'medium',
  },
  {
    flag: '🇸🇪',
    name: 'السويد',
    code: 'SE',
    aliases: ['سويد', 'مملكة السويد'],
    region: 'أوروبا',
    difficulty: 'medium',
  },
  {
    flag: '🇳🇴',
    name: 'النرويج',
    code: 'NO',
    aliases: ['نرويج', 'مملكة النرويج'],
    region: 'أوروبا',
    difficulty: 'medium',
  },
  {
    flag: '🇧🇷',
    name: 'البرازيل',
    code: 'BR',
    aliases: ['برازيل', 'جمهورية البرازيل الاتحادية'],
    region: 'أمريكا الجنوبية',
    difficulty: 'medium',
  },
  {
    flag: '🇦🇷',
    name: 'الأرجنتين',
    code: 'AR',
    aliases: ['الارجنتين', 'ارجنتين', 'جمهورية الأرجنتين'],
    region: 'أمريكا الجنوبية',
    difficulty: 'medium',
  },
  {
    flag: '🇨🇦',
    name: 'كندا',
    code: 'CA',
    aliases: ['دولة كندا'],
    region: 'أمريكا الشمالية',
    difficulty: 'medium',
  },
  {
    flag: '🇲🇽',
    name: 'المكسيك',
    code: 'MX',
    aliases: ['مكسيك', 'الولايات المكسيكية المتحدة'],
    region: 'أمريكا الشمالية',
    difficulty: 'medium',
  },
  {
    flag: '🇦🇺',
    name: 'أستراليا',
    code: 'AU',
    aliases: ['استراليا', 'كومنولث أستراليا'],
    region: 'أوقيانوسيا',
    difficulty: 'medium',
  },
  {
    flag: '🇿🇦',
    name: 'جنوب إفريقيا',
    code: 'ZA',
    aliases: ['جنوب افريقيا', 'جمهورية جنوب إفريقيا'],
    region: 'إفريقيا',
    difficulty: 'medium',
  },

  // ==================== HARD (55% = 55 countries) ====================
  {
    flag: '🇱🇸',
    name: 'ليسوتو',
    code: 'LS',
    aliases: ['مملكة ليسوتو'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇧🇹',
    name: 'بوتان',
    code: 'BT',
    aliases: ['مملكة بوتان'],
    region: 'آسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇸🇷',
    name: 'سورينام',
    code: 'SR',
    aliases: ['جمهورية سورينام'],
    region: 'أمريكا الجنوبية',
    difficulty: 'hard',
  },
  {
    flag: '🇰🇬',
    name: 'قيرغيزستان',
    code: 'KG',
    aliases: ['قيرغيزيا', 'قرغيزستان', 'قرغيزيا'],
    region: 'آسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇹🇯',
    name: 'طاجيكستان',
    code: 'TJ',
    aliases: ['طاجكستان', 'جمهورية طاجيكستان'],
    region: 'آسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇸🇧',
    name: 'جزر سليمان',
    code: 'SB',
    aliases: ['سليمان'],
    region: 'أوقيانوسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇻🇺',
    name: 'فانواتو',
    code: 'VU',
    aliases: ['جمهورية فانواتو'],
    region: 'أوقيانوسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇵🇼',
    name: 'بالاو',
    code: 'PW',
    aliases: ['جمهورية بالاو'],
    region: 'أوقيانوسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇸🇨',
    name: 'سيشل',
    code: 'SC',
    aliases: ['جزر سيشل', 'سيشيل'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇧🇳',
    name: 'بروناي',
    code: 'BN',
    aliases: ['بروناي دار السلام', 'بروناي السلاطين'],
    region: 'آسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇰🇲',
    name: 'جزر القمر',
    code: 'KM',
    aliases: ['جمهورية جزر القمر', 'القمر'],
    region: 'الوطن العربي / إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇩🇯',
    name: 'جيبوتي',
    code: 'DJ',
    aliases: ['جمهورية جيبوتي'],
    region: 'الوطن العربي / إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇬🇲',
    name: 'غامبيا',
    code: 'GM',
    aliases: ['جمهورية غامبيا', 'جامبيا'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇬🇼',
    name: 'غينيا بيساو',
    code: 'GW',
    aliases: ['غينيا-بيساو', 'غينيا بيساوو'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇸🇸',
    name: 'جنوب السودان',
    code: 'SS',
    aliases: ['دولة جنوب السودان'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇸🇹',
    name: 'ساو تومي وبرينسيب',
    code: 'ST',
    aliases: ['ساو تومي', 'ساوتومي', 'ساو تومي وبرينسيبى'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇹🇱',
    name: 'تيمور الشرقية',
    code: 'TL',
    aliases: ['تيمور-لشتي', 'تيمور لشتي'],
    region: 'آسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇸🇿',
    name: 'إسواتيني',
    code: 'SZ',
    aliases: ['اسواتيني', 'سوازيلاند', 'مملكة إسواتيني'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇲🇷',
    name: 'موريتانيا',
    code: 'MR',
    aliases: ['الجمهورية الإسلامية الموريتانية'],
    region: 'الوطن العربي / إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇲🇼',
    name: 'مالاوي',
    code: 'MW',
    aliases: ['جمهورية مالاوي'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇧🇮',
    name: 'بوروندي',
    code: 'BI',
    aliases: ['جمهورية بوروندي'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇷🇼',
    name: 'رواندا',
    code: 'RW',
    aliases: ['جمهورية رواندا'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇨🇻',
    name: 'الرأس الأخضر',
    code: 'CV',
    aliases: ['الرأس الاخضر', 'كاب فيردي'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇸🇲',
    name: 'سان مارينو',
    code: 'SM',
    aliases: ['جمهورية سان مارينو'],
    region: 'أوروبا',
    difficulty: 'hard',
  },
  {
    flag: '🇱🇮',
    name: 'ليختنشتاين',
    code: 'LI',
    aliases: ['امارة ليختنشتاين', 'إمارة ليختنشتاين'],
    region: 'أوروبا',
    difficulty: 'hard',
  },
  {
    flag: '🇲🇩',
    name: 'مولدوفا',
    code: 'MD',
    aliases: ['مولدافيا', 'جمهورية مولدوفا'],
    region: 'أوروبا',
    difficulty: 'hard',
  },
  {
    flag: '🇹🇩',
    name: 'تشاد',
    code: 'TD',
    aliases: ['جمهورية تشاد'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇷🇴',
    name: 'رومانيا',
    code: 'RO',
    aliases: ['جمهورية رومانيا'],
    region: 'أوروبا',
    difficulty: 'hard',
  },
  {
    flag: '🇲🇨',
    name: 'موناكو',
    code: 'MC',
    aliases: ['إمارة موناكو', 'امارة موناكو'],
    region: 'أوروبا',
    difficulty: 'hard',
  },
  {
    flag: '🇵🇱',
    name: 'بولندا',
    code: 'PL',
    aliases: ['جمهورية بولندا'],
    region: 'أوروبا',
    difficulty: 'hard',
  },
  {
    flag: '🇨🇮',
    name: 'كوت ديفوار',
    code: 'CI',
    aliases: ['ساحل العاج', 'كوت ديفوار'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇮🇪',
    name: 'أيرلندا',
    code: 'IE',
    aliases: ['ايرلندا', 'جمهورية أيرلندا'],
    region: 'أوروبا',
    difficulty: 'hard',
  },
  {
    flag: '🇲🇱',
    name: 'مالي',
    code: 'ML',
    aliases: ['جمهورية مالي'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇬🇳',
    name: 'غينيا',
    code: 'GN',
    aliases: ['جمهورية غينيا', 'غينيا كوناكري'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇳🇿',
    name: 'نيوزيلندا',
    code: 'NZ',
    aliases: ['نيوزيلنده', 'نيوزيلاندا'],
    region: 'أوقيانوسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇸🇱',
    name: 'سيراليون',
    code: 'SL',
    aliases: ['جمهورية سيراليون'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇪🇷',
    name: 'إريتريا',
    code: 'ER',
    aliases: ['اريتريا', 'دولة إريتريا'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇬🇪',
    name: 'جورجيا',
    code: 'GE',
    aliases: ['جمهورية جورجيا'],
    region: 'أوراسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇦🇲',
    name: 'أرمينيا',
    code: 'AM',
    aliases: ['ارمينيا', 'جمهورية أرمينيا'],
    region: 'أوراسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇦🇿',
    name: 'أذربيجان',
    code: 'AZ',
    aliases: ['اذربيجان', 'جمهورية أذربيجان'],
    region: 'أوراسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇲🇳',
    name: 'منغوليا',
    code: 'MN',
    aliases: ['جمهورية منغوليا'],
    region: 'آسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇰🇿',
    name: 'كازاخستان',
    code: 'KZ',
    aliases: ['جمهورية كازاخستان'],
    region: 'آسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇺🇿',
    name: 'أوزبكستان',
    code: 'UZ',
    aliases: ['اوزبكستان', 'جمهورية أوزبكستان'],
    region: 'آسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇹🇲',
    name: 'تركمانستان',
    code: 'TM',
    aliases: ['جمهورية تركمانستان'],
    region: 'آسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇨🇩',
    name: 'الكونغو الديمقراطية',
    code: 'CD',
    aliases: ['الكونغو الديمقراطيه', 'كينشاسا', 'جمهورية الكونغو الديمقراطية'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇨🇬',
    name: 'الكونغو',
    code: 'CG',
    aliases: ['جمهورية الكونغو', 'برازافيل'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇦🇴',
    name: 'أنغولا',
    code: 'AO',
    aliases: ['انغولا', 'جمهورية أنغولا'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇲🇿',
    name: 'موزمبيق',
    code: 'MZ',
    aliases: ['جمهورية موزمبيق'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇿🇼',
    name: 'زيمبابوي',
    code: 'ZW',
    aliases: ['جمهورية زيمبابوي'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇿🇲',
    name: 'زامبيا',
    code: 'ZM',
    aliases: ['جمهورية زامبيا'],
    region: 'إفريقيا',
    difficulty: 'hard',
  },
  {
    flag: '🇧🇴',
    name: 'بوليفيا',
    code: 'BO',
    aliases: ['دولة بوليفيا'],
    region: 'أمريكا الجنوبية',
    difficulty: 'hard',
  },
  {
    flag: '🇵🇾',
    name: 'باراغواي',
    code: 'PY',
    aliases: ['باراجواي', 'جمهورية باراغواي'],
    region: 'أمريكا الجنوبية',
    difficulty: 'hard',
  },
  {
    flag: '🇺🇾',
    name: 'أوروغواي',
    code: 'UY',
    aliases: ['اوروغواي', 'اوروجواي'],
    region: 'أمريكا الجنوبية',
    difficulty: 'hard',
  },
  {
    flag: '🇳🇵',
    name: 'نيبال',
    code: 'NP',
    aliases: ['جمهورية نيبال'],
    region: 'آسيا',
    difficulty: 'hard',
  },
  {
    flag: '🇱🇰',
    name: 'سريلانكا',
    code: 'LK',
    aliases: ['سري لانكا', 'سيريلانكا'],
    region: 'آسيا',
    difficulty: 'hard',
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
 * In-memory Question Pool Manager for "أعلام" (Flags Game)
 * Implements a Shuffle Bag (Deck) system:
 * - Refills pool with all 100 flags (15% Easy, 30% Medium, 55% Hard) when empty.
 * - Shuffles randomly using Fisher-Yates algorithm.
 * - Avoids back-to-back duplicate across cycle boundaries.
 * - Pops drawn countries so zero repetition occurs during the cycle.
 */
export class FlagQuestionPool {
  constructor() {
    this.activePool = [];
    this.lastDrawnCode = null;
    this.cycleCount = 0;
  }

  /**
   * Refills and shuffles a new cycle pool.
   */
  _initNewCycle() {
    this.cycleCount += 1;
    // Clone full dataset
    const newPool = COUNTRIES.map((c) => ({ ...c }));

    // Fisher-Yates Shuffle
    for (let i = newPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newPool[i], newPool[j]] = [newPool[j], newPool[i]];
    }

    // Avoid starting new cycle with the exact same country as the end of previous cycle
    if (this.lastDrawnCode && newPool.length > 1 && newPool[newPool.length - 1].code === this.lastDrawnCode) {
      // Swap top of deck (which will be popped first) with item at index 0
      [newPool[newPool.length - 1], newPool[0]] = [newPool[0], newPool[newPool.length - 1]];
    }

    this.activePool = newPool;
  }

  /**
   * Draws the next country from the Shuffle Bag
   * Guaranteed non-repeating within the cycle.
   */
  drawNextCountry() {
    if (this.activePool.length === 0) {
      this._initNewCycle();
    }

    const country = this.activePool.pop();
    this.lastDrawnCode = country.code;

    return {
      ...country,
      flagImageUrl: getFlagImageUrl(country.code),
      remainingInPool: this.activePool.length,
      cycleNumber: this.cycleCount,
    };
  }

  /**
   * Gets pool stats for diagnostics/debugging
   */
  getStats() {
    return {
      totalInDataset: COUNTRIES.length,
      remainingInPool: this.activePool.length,
      cycleCount: this.cycleCount,
      lastDrawnCode: this.lastDrawnCode,
      distribution: {
        easy: COUNTRIES.filter((c) => c.difficulty === 'easy').length,
        medium: COUNTRIES.filter((c) => c.difficulty === 'medium').length,
        hard: COUNTRIES.filter((c) => c.difficulty === 'hard').length,
      },
    };
  }
}

// Singleton Pool Instance across the application
export const flagPool = new FlagQuestionPool();

/**
 * Returns the next country from the shuffle bag (replaces purely random pick)
 */
export function getRandomCountry() {
  return flagPool.drawNextCountry();
}

export default COUNTRIES;
