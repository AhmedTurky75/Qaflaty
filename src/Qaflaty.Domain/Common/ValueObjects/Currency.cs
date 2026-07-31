using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Common.ValueObjects;

/// <summary>
/// An ISO 4217 currency. A store picks exactly one currency (set once, then locked); every
/// <see cref="Money"/> in that store carries this same currency. Persisted by its 3-letter
/// <see cref="Code"/> only — <see cref="Symbol"/>/<see cref="EnglishName"/>/<see cref="DecimalDigits"/>
/// are looked up from the static registry on materialization.
/// </summary>
public sealed class Currency : ValueObject
{
    public string Code { get; }          // ISO 4217 alpha-3, e.g. "EGP"
    public string Symbol { get; }        // Display symbol, e.g. "£", "﷼", "$"
    public string EnglishName { get; }   // e.g. "Egyptian Pound"
    public int DecimalDigits { get; }    // Minor-unit digits, e.g. 2 (EGP), 0 (JPY), 3 (KWD)

    private Currency(string code, string symbol, string englishName, int decimalDigits)
    {
        Code = code;
        Symbol = symbol;
        EnglishName = englishName;
        DecimalDigits = decimalDigits;
    }

    private static readonly Dictionary<string, Currency> Registry = BuildRegistry();

    /// <summary>All currencies known to the registry, ordered by code — used to populate pickers.</summary>
    public static IReadOnlyList<Currency> All { get; } = Registry.Values.OrderBy(c => c.Code).ToList();

    /// <summary>Default currency used when none is supplied (EGP).</summary>
    public static Currency Default => FromCode("EGP");

    // Well-known statics kept for convenient references in code.
    public static Currency SAR => FromCode("SAR");
    public static Currency EGP => FromCode("EGP");
    public static Currency USD => FromCode("USD");
    public static Currency EUR => FromCode("EUR");
    public static Currency AED => FromCode("AED");

    /// <summary>
    /// Resolves a currency by its ISO code. Unknown/blank codes fall back gracefully
    /// (blank → <see cref="Default"/>; unrecognized code → a minimal entry) so persistence
    /// materialization never throws.
    /// </summary>
    public static Currency FromCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return Registry["EGP"];

        var normalized = code.Trim().ToUpperInvariant();
        return Registry.TryGetValue(normalized, out var currency)
            ? currency
            : new Currency(normalized, normalized, normalized, 2);
    }

    /// <summary>True when <paramref name="code"/> is a recognized ISO 4217 code in the registry.</summary>
    public static bool IsValidCode(string? code) =>
        !string.IsNullOrWhiteSpace(code) && Registry.ContainsKey(code.Trim().ToUpperInvariant());

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Code;
    }

    public override string ToString() => Code;

    private static Dictionary<string, Currency> BuildRegistry()
    {
        // ISO 4217 currencies. DecimalDigits reflects the minor unit (0, 2, or 3).
        var currencies = new[]
        {
            new Currency("AED", "د.إ", "UAE Dirham", 2),
            new Currency("AFN", "؋", "Afghan Afghani", 2),
            new Currency("ALL", "L", "Albanian Lek", 2),
            new Currency("AMD", "֏", "Armenian Dram", 2),
            new Currency("ANG", "ƒ", "Netherlands Antillean Guilder", 2),
            new Currency("AOA", "Kz", "Angolan Kwanza", 2),
            new Currency("ARS", "$", "Argentine Peso", 2),
            new Currency("AUD", "$", "Australian Dollar", 2),
            new Currency("AWG", "ƒ", "Aruban Florin", 2),
            new Currency("AZN", "₼", "Azerbaijani Manat", 2),
            new Currency("BAM", "KM", "Bosnia-Herzegovina Convertible Mark", 2),
            new Currency("BBD", "$", "Barbadian Dollar", 2),
            new Currency("BDT", "৳", "Bangladeshi Taka", 2),
            new Currency("BGN", "лв", "Bulgarian Lev", 2),
            new Currency("BHD", ".د.ب", "Bahraini Dinar", 3),
            new Currency("BIF", "FBu", "Burundian Franc", 0),
            new Currency("BMD", "$", "Bermudan Dollar", 2),
            new Currency("BND", "$", "Brunei Dollar", 2),
            new Currency("BOB", "Bs.", "Bolivian Boliviano", 2),
            new Currency("BRL", "R$", "Brazilian Real", 2),
            new Currency("BSD", "$", "Bahamian Dollar", 2),
            new Currency("BTN", "Nu.", "Bhutanese Ngultrum", 2),
            new Currency("BWP", "P", "Botswanan Pula", 2),
            new Currency("BYN", "Br", "Belarusian Ruble", 2),
            new Currency("BZD", "BZ$", "Belize Dollar", 2),
            new Currency("CAD", "$", "Canadian Dollar", 2),
            new Currency("CDF", "FC", "Congolese Franc", 2),
            new Currency("CHF", "CHF", "Swiss Franc", 2),
            new Currency("CLP", "$", "Chilean Peso", 0),
            new Currency("CNY", "¥", "Chinese Yuan", 2),
            new Currency("COP", "$", "Colombian Peso", 2),
            new Currency("CRC", "₡", "Costa Rican Colón", 2),
            new Currency("CUP", "$", "Cuban Peso", 2),
            new Currency("CVE", "$", "Cape Verdean Escudo", 2),
            new Currency("CZK", "Kč", "Czech Koruna", 2),
            new Currency("DJF", "Fdj", "Djiboutian Franc", 0),
            new Currency("DKK", "kr", "Danish Krone", 2),
            new Currency("DOP", "RD$", "Dominican Peso", 2),
            new Currency("DZD", "دج", "Algerian Dinar", 2),
            new Currency("EGP", "ج.م", "Egyptian Pound", 2),
            new Currency("ERN", "Nfk", "Eritrean Nakfa", 2),
            new Currency("ETB", "Br", "Ethiopian Birr", 2),
            new Currency("EUR", "€", "Euro", 2),
            new Currency("FJD", "$", "Fijian Dollar", 2),
            new Currency("FKP", "£", "Falkland Islands Pound", 2),
            new Currency("GBP", "£", "British Pound", 2),
            new Currency("GEL", "₾", "Georgian Lari", 2),
            new Currency("GHS", "₵", "Ghanaian Cedi", 2),
            new Currency("GIP", "£", "Gibraltar Pound", 2),
            new Currency("GMD", "D", "Gambian Dalasi", 2),
            new Currency("GNF", "FG", "Guinean Franc", 0),
            new Currency("GTQ", "Q", "Guatemalan Quetzal", 2),
            new Currency("GYD", "$", "Guyanaese Dollar", 2),
            new Currency("HKD", "$", "Hong Kong Dollar", 2),
            new Currency("HNL", "L", "Honduran Lempira", 2),
            new Currency("HRK", "kn", "Croatian Kuna", 2),
            new Currency("HTG", "G", "Haitian Gourde", 2),
            new Currency("HUF", "Ft", "Hungarian Forint", 2),
            new Currency("IDR", "Rp", "Indonesian Rupiah", 2),
            new Currency("ILS", "₪", "Israeli New Shekel", 2),
            new Currency("INR", "₹", "Indian Rupee", 2),
            new Currency("IQD", "ع.د", "Iraqi Dinar", 3),
            new Currency("IRR", "﷼", "Iranian Rial", 2),
            new Currency("ISK", "kr", "Icelandic Króna", 0),
            new Currency("JMD", "J$", "Jamaican Dollar", 2),
            new Currency("JOD", "د.ا", "Jordanian Dinar", 3),
            new Currency("JPY", "¥", "Japanese Yen", 0),
            new Currency("KES", "KSh", "Kenyan Shilling", 2),
            new Currency("KGS", "с", "Kyrgystani Som", 2),
            new Currency("KHR", "៛", "Cambodian Riel", 2),
            new Currency("KMF", "CF", "Comorian Franc", 0),
            new Currency("KRW", "₩", "South Korean Won", 0),
            new Currency("KWD", "د.ك", "Kuwaiti Dinar", 3),
            new Currency("KYD", "$", "Cayman Islands Dollar", 2),
            new Currency("KZT", "₸", "Kazakhstani Tenge", 2),
            new Currency("LAK", "₭", "Laotian Kip", 2),
            new Currency("LBP", "ل.ل", "Lebanese Pound", 2),
            new Currency("LKR", "Rs", "Sri Lankan Rupee", 2),
            new Currency("LRD", "$", "Liberian Dollar", 2),
            new Currency("LSL", "L", "Lesotho Loti", 2),
            new Currency("LYD", "ل.د", "Libyan Dinar", 3),
            new Currency("MAD", "د.م.", "Moroccan Dirham", 2),
            new Currency("MDL", "L", "Moldovan Leu", 2),
            new Currency("MGA", "Ar", "Malagasy Ariary", 2),
            new Currency("MKD", "ден", "Macedonian Denar", 2),
            new Currency("MMK", "K", "Myanmar Kyat", 2),
            new Currency("MNT", "₮", "Mongolian Tugrik", 2),
            new Currency("MOP", "MOP$", "Macanese Pataca", 2),
            new Currency("MRU", "UM", "Mauritanian Ouguiya", 2),
            new Currency("MUR", "₨", "Mauritian Rupee", 2),
            new Currency("MVR", ".ރ", "Maldivian Rufiyaa", 2),
            new Currency("MWK", "MK", "Malawian Kwacha", 2),
            new Currency("MXN", "$", "Mexican Peso", 2),
            new Currency("MYR", "RM", "Malaysian Ringgit", 2),
            new Currency("MZN", "MT", "Mozambican Metical", 2),
            new Currency("NAD", "$", "Namibian Dollar", 2),
            new Currency("NGN", "₦", "Nigerian Naira", 2),
            new Currency("NIO", "C$", "Nicaraguan Córdoba", 2),
            new Currency("NOK", "kr", "Norwegian Krone", 2),
            new Currency("NPR", "₨", "Nepalese Rupee", 2),
            new Currency("NZD", "$", "New Zealand Dollar", 2),
            new Currency("OMR", "ر.ع.", "Omani Rial", 3),
            new Currency("PAB", "B/.", "Panamanian Balboa", 2),
            new Currency("PEN", "S/", "Peruvian Sol", 2),
            new Currency("PGK", "K", "Papua New Guinean Kina", 2),
            new Currency("PHP", "₱", "Philippine Peso", 2),
            new Currency("PKR", "₨", "Pakistani Rupee", 2),
            new Currency("PLN", "zł", "Polish Zloty", 2),
            new Currency("PYG", "₲", "Paraguayan Guarani", 0),
            new Currency("QAR", "ر.ق", "Qatari Rial", 2),
            new Currency("RON", "lei", "Romanian Leu", 2),
            new Currency("RSD", "дин.", "Serbian Dinar", 2),
            new Currency("RUB", "₽", "Russian Ruble", 2),
            new Currency("RWF", "FRw", "Rwandan Franc", 0),
            new Currency("SAR", "ر.س", "Saudi Riyal", 2),
            new Currency("SBD", "$", "Solomon Islands Dollar", 2),
            new Currency("SCR", "₨", "Seychellois Rupee", 2),
            new Currency("SDG", "ج.س.", "Sudanese Pound", 2),
            new Currency("SEK", "kr", "Swedish Krona", 2),
            new Currency("SGD", "$", "Singapore Dollar", 2),
            new Currency("SHP", "£", "Saint Helena Pound", 2),
            new Currency("SLE", "Le", "Sierra Leonean Leone", 2),
            new Currency("SOS", "Sh", "Somali Shilling", 2),
            new Currency("SRD", "$", "Surinamese Dollar", 2),
            new Currency("SSP", "£", "South Sudanese Pound", 2),
            new Currency("STN", "Db", "São Tomé and Príncipe Dobra", 2),
            new Currency("SYP", "£", "Syrian Pound", 2),
            new Currency("SZL", "E", "Swazi Lilangeni", 2),
            new Currency("THB", "฿", "Thai Baht", 2),
            new Currency("TJS", "ЅМ", "Tajikistani Somoni", 2),
            new Currency("TMT", "m", "Turkmenistani Manat", 2),
            new Currency("TND", "د.ت", "Tunisian Dinar", 3),
            new Currency("TOP", "T$", "Tongan Paʻanga", 2),
            new Currency("TRY", "₺", "Turkish Lira", 2),
            new Currency("TTD", "TT$", "Trinidad and Tobago Dollar", 2),
            new Currency("TWD", "NT$", "New Taiwan Dollar", 2),
            new Currency("TZS", "TSh", "Tanzanian Shilling", 2),
            new Currency("UAH", "₴", "Ukrainian Hryvnia", 2),
            new Currency("UGX", "USh", "Ugandan Shilling", 0),
            new Currency("USD", "$", "US Dollar", 2),
            new Currency("UYU", "$U", "Uruguayan Peso", 2),
            new Currency("UZS", "so'm", "Uzbekistani Som", 2),
            new Currency("VES", "Bs.", "Venezuelan Bolívar", 2),
            new Currency("VND", "₫", "Vietnamese Dong", 0),
            new Currency("VUV", "VT", "Vanuatu Vatu", 0),
            new Currency("WST", "T", "Samoan Tala", 2),
            new Currency("XAF", "FCFA", "Central African CFA Franc", 0),
            new Currency("XCD", "$", "East Caribbean Dollar", 2),
            new Currency("XOF", "CFA", "West African CFA Franc", 0),
            new Currency("XPF", "₣", "CFP Franc", 0),
            new Currency("YER", "﷼", "Yemeni Rial", 2),
            new Currency("ZAR", "R", "South African Rand", 2),
            new Currency("ZMW", "ZK", "Zambian Kwacha", 2),
            new Currency("ZWL", "$", "Zimbabwean Dollar", 2),
        };

        return currencies.ToDictionary(c => c.Code, StringComparer.OrdinalIgnoreCase);
    }
}
