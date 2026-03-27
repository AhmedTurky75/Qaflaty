export interface Country {
  isoNumeric: number;
  isoAlpha2: string;
  name: string;
  dialCode: string;
  flag: string;
}

export interface City {
  id: number;
  name: string;
  countryIsoNumeric: number;
}

export interface District {
  id: number;
  name: string;
  cityId: number;
}

// Countries with ISO 3166-1 numeric codes, alpha-2 codes, dial codes
export const COUNTRIES: Country[] = [
  { isoNumeric: 818, isoAlpha2: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { isoNumeric: 682, isoAlpha2: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { isoNumeric: 784, isoAlpha2: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { isoNumeric: 414, isoAlpha2: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
  { isoNumeric: 512, isoAlpha2: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲' },
  { isoNumeric: 634, isoAlpha2: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { isoNumeric: 48, isoAlpha2: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭' },
  { isoNumeric: 400, isoAlpha2: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴' },
  { isoNumeric: 422, isoAlpha2: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧' },
  { isoNumeric: 275, isoAlpha2: 'PS', name: 'Palestine', dialCode: '+970', flag: '🇵🇸' },
  { isoNumeric: 760, isoAlpha2: 'SY', name: 'Syria', dialCode: '+963', flag: '🇸🇾' },
  { isoNumeric: 368, isoAlpha2: 'IQ', name: 'Iraq', dialCode: '+964', flag: '🇮🇶' },
  { isoNumeric: 504, isoAlpha2: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦' },
  { isoNumeric: 788, isoAlpha2: 'TN', name: 'Tunisia', dialCode: '+216', flag: '🇹🇳' },
  { isoNumeric: 12, isoAlpha2: 'DZ', name: 'Algeria', dialCode: '+213', flag: '🇩🇿' },
  { isoNumeric: 434, isoAlpha2: 'LY', name: 'Libya', dialCode: '+218', flag: '🇱🇾' },
  { isoNumeric: 706, isoAlpha2: 'SO', name: 'Somalia', dialCode: '+252', flag: '🇸🇴' },
  { isoNumeric: 729, isoAlpha2: 'SD', name: 'Sudan', dialCode: '+249', flag: '🇸🇩' },
  { isoNumeric: 887, isoAlpha2: 'YE', name: 'Yemen', dialCode: '+967', flag: '🇾🇪' },
  { isoNumeric: 792, isoAlpha2: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { isoNumeric: 364, isoAlpha2: 'IR', name: 'Iran', dialCode: '+98', flag: '🇮🇷' },
  { isoNumeric: 840, isoAlpha2: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { isoNumeric: 826, isoAlpha2: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { isoNumeric: 276, isoAlpha2: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { isoNumeric: 250, isoAlpha2: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { isoNumeric: 380, isoAlpha2: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { isoNumeric: 356, isoAlpha2: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { isoNumeric: 586, isoAlpha2: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { isoNumeric: 50, isoAlpha2: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { isoNumeric: 566, isoAlpha2: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
];

// Major cities keyed by country ISO numeric code
export const CITIES: Record<number, City[]> = {
  // Egypt (818)
  818: [
    { id: 8001, name: 'Cairo', countryIsoNumeric: 818 },
    { id: 8002, name: 'Alexandria', countryIsoNumeric: 818 },
    { id: 8003, name: 'Giza', countryIsoNumeric: 818 },
    { id: 8004, name: 'Shubra El Kheima', countryIsoNumeric: 818 },
    { id: 8005, name: 'Port Said', countryIsoNumeric: 818 },
    { id: 8006, name: 'Suez', countryIsoNumeric: 818 },
    { id: 8007, name: 'Mansoura', countryIsoNumeric: 818 },
    { id: 8008, name: 'Tanta', countryIsoNumeric: 818 },
    { id: 8009, name: 'Asyut', countryIsoNumeric: 818 },
    { id: 8010, name: 'Ismailia', countryIsoNumeric: 818 },
    { id: 8011, name: 'Faiyum', countryIsoNumeric: 818 },
    { id: 8012, name: 'Zagazig', countryIsoNumeric: 818 },
    { id: 8013, name: 'Luxor', countryIsoNumeric: 818 },
    { id: 8014, name: 'Hurghada', countryIsoNumeric: 818 },
    { id: 8015, name: 'Sharm El Sheikh', countryIsoNumeric: 818 },
  ],
  // Saudi Arabia (682)
  682: [
    { id: 6821, name: 'Riyadh', countryIsoNumeric: 682 },
    { id: 6822, name: 'Jeddah', countryIsoNumeric: 682 },
    { id: 6823, name: 'Mecca', countryIsoNumeric: 682 },
    { id: 6824, name: 'Medina', countryIsoNumeric: 682 },
    { id: 6825, name: 'Dammam', countryIsoNumeric: 682 },
    { id: 6826, name: 'Khobar', countryIsoNumeric: 682 },
    { id: 6827, name: 'Taif', countryIsoNumeric: 682 },
    { id: 6828, name: 'Tabuk', countryIsoNumeric: 682 },
    { id: 6829, name: 'Abha', countryIsoNumeric: 682 },
    { id: 6830, name: 'Dhahran', countryIsoNumeric: 682 },
    { id: 6831, name: 'Hafar Al-Batin', countryIsoNumeric: 682 },
    { id: 6832, name: 'Hail', countryIsoNumeric: 682 },
  ],
  // UAE (784)
  784: [
    { id: 7841, name: 'Dubai', countryIsoNumeric: 784 },
    { id: 7842, name: 'Abu Dhabi', countryIsoNumeric: 784 },
    { id: 7843, name: 'Sharjah', countryIsoNumeric: 784 },
    { id: 7844, name: 'Ajman', countryIsoNumeric: 784 },
    { id: 7845, name: 'Ras Al Khaimah', countryIsoNumeric: 784 },
    { id: 7846, name: 'Fujairah', countryIsoNumeric: 784 },
    { id: 7847, name: 'Umm Al Quwain', countryIsoNumeric: 784 },
  ],
  // Kuwait (414)
  414: [
    { id: 4141, name: 'Kuwait City', countryIsoNumeric: 414 },
    { id: 4142, name: 'Salmiya', countryIsoNumeric: 414 },
    { id: 4143, name: 'Hawalli', countryIsoNumeric: 414 },
    { id: 4144, name: 'Farwaniya', countryIsoNumeric: 414 },
    { id: 4145, name: 'Ahmadi', countryIsoNumeric: 414 },
    { id: 4146, name: 'Jahra', countryIsoNumeric: 414 },
  ],
  // Jordan (400)
  400: [
    { id: 4001, name: 'Amman', countryIsoNumeric: 400 },
    { id: 4002, name: 'Zarqa', countryIsoNumeric: 400 },
    { id: 4003, name: 'Irbid', countryIsoNumeric: 400 },
    { id: 4004, name: 'Aqaba', countryIsoNumeric: 400 },
    { id: 4005, name: 'Madaba', countryIsoNumeric: 400 },
  ],
};

// Districts keyed by city ID (curated for major cities)
export const DISTRICTS: Record<number, District[]> = {
  // Cairo districts
  8001: [
    { id: 80011, name: 'Nasr City', cityId: 8001 },
    { id: 80012, name: 'Heliopolis', cityId: 8001 },
    { id: 80013, name: 'Maadi', cityId: 8001 },
    { id: 80014, name: 'Zamalek', cityId: 8001 },
    { id: 80015, name: 'Downtown Cairo', cityId: 8001 },
    { id: 80016, name: 'New Cairo', cityId: 8001 },
    { id: 80017, name: 'October City', cityId: 8001 },
    { id: 80018, name: 'Ain Shams', cityId: 8001 },
    { id: 80019, name: 'Shubra', cityId: 8001 },
    { id: 80020, name: 'Mohandessin', cityId: 8001 },
  ],
  // Alexandria districts
  8002: [
    { id: 80021, name: 'Montaza', cityId: 8002 },
    { id: 80022, name: 'Sidi Gaber', cityId: 8002 },
    { id: 80023, name: 'Agami', cityId: 8002 },
    { id: 80024, name: 'Stanley', cityId: 8002 },
    { id: 80025, name: 'Smouha', cityId: 8002 },
  ],
  // Riyadh districts
  6821: [
    { id: 68211, name: 'Al Olaya', cityId: 6821 },
    { id: 68212, name: 'Al Malaz', cityId: 6821 },
    { id: 68213, name: 'Al Murabba', cityId: 6821 },
    { id: 68214, name: 'Al Sulimaniyah', cityId: 6821 },
    { id: 68215, name: 'Al Shifa', cityId: 6821 },
    { id: 68216, name: 'Al Naseem', cityId: 6821 },
    { id: 68217, name: 'Diplomatic Quarter', cityId: 6821 },
  ],
  // Jeddah districts
  6822: [
    { id: 68221, name: 'Al Rawdah', cityId: 6822 },
    { id: 68222, name: 'Al Hamra', cityId: 6822 },
    { id: 68223, name: 'Al Andalus', cityId: 6822 },
    { id: 68224, name: 'Al Corniche', cityId: 6822 },
    { id: 68225, name: 'Al Balad', cityId: 6822 },
  ],
  // Dubai districts
  7841: [
    { id: 78411, name: 'Downtown Dubai', cityId: 7841 },
    { id: 78412, name: 'Dubai Marina', cityId: 7841 },
    { id: 78413, name: 'Jumeirah', cityId: 7841 },
    { id: 78414, name: 'Business Bay', cityId: 7841 },
    { id: 78415, name: 'Deira', cityId: 7841 },
    { id: 78416, name: 'Bur Dubai', cityId: 7841 },
    { id: 78417, name: 'Al Quoz', cityId: 7841 },
  ],
  // Kuwait City districts
  4141: [
    { id: 41411, name: 'Shuwaikh', cityId: 4141 },
    { id: 41412, name: 'Dasman', cityId: 4141 },
    { id: 41413, name: 'Sharq', cityId: 4141 },
    { id: 41414, name: 'Mirqab', cityId: 4141 },
  ],
};
