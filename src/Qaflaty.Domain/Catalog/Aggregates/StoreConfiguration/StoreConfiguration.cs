using Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration.Events;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration;

public sealed class StoreConfiguration : AggregateRoot<StoreConfigurationId>
{
    public StoreId StoreId { get; private set; } // The store this configuration belongs to (one config per store)
    public PageToggles PageToggles { get; private set; } = null!; // Which static storefront pages (About, Contact, FAQ, etc.) are enabled
    public FeatureToggles FeatureToggles { get; private set; } = null!; // Which storefront features (wishlist, reviews, promo codes, etc.) are enabled
    public CustomerAuthSettings CustomerAuthSettings { get; private set; } = null!; // Customer login/registration policy (auth mode, OTP on order, etc.)
    public CommunicationSettings CommunicationSettings { get; private set; } = null!; // WhatsApp / live-chat / AI chatbot communication options
    public AiAssistantSettings AiAssistantSettings { get; private set; } = null!; // Configuration for the AI shopping assistant (model, persona, limits)
    public LocalizationSettings LocalizationSettings { get; private set; } = null!; // Default language, bilingual toggle, and text direction
    public SocialLinks SocialLinks { get; private set; } = null!; // Social media profile URLs shown in the storefront
    public string HeaderVariant { get; private set; } = null!; // Selected header layout theme id, e.g. "header-minimal"
    public string FooterVariant { get; private set; } = null!; // Selected footer layout theme id, e.g. "footer-standard"
    public string ProductCardVariant { get; private set; } = null!; // Selected product card style id, e.g. "card-standard"
    public string ProductGridVariant { get; private set; } = null!; // Selected product grid layout id, e.g. "grid-standard"
    public SearchSettings SearchSettings { get; private set; } = null!; // Storefront search behaviour configuration
    public TaxSettings TaxSettings { get; private set; } = null!; // Tax/VAT configuration (rate, whether prices include tax)

    // Reviews & ratings policy (master on/off lives in FeatureToggles.Reviews)
    public bool ReviewsRequirePurchase { get; private set; } // When true, only customers who bought the product may review it
    public bool ReviewsAutoApprove { get; private set; } // When true, reviews are published immediately without merchant moderation
    public bool ReviewsAllowEditing { get; private set; } // When true, customers may edit their submitted reviews

    // Recommendations: when true, related products use the merchant's manual selection.
    public bool RelatedProductsManual { get; private set; } // True = merchant hand-picks related products; false = auto-generated recommendations

    public DateTime CreatedAt { get; private set; } // UTC timestamp when the configuration was created
    public DateTime UpdatedAt { get; private set; } // UTC timestamp of the last configuration change

    private readonly List<PaymentMethodAdjustment> _paymentMethodAdjustments = []; // Backing list of per-method fee/enable adjustments
    public IReadOnlyList<PaymentMethodAdjustment> PaymentMethodAdjustments => _paymentMethodAdjustments.AsReadOnly(); // Per-payment-method settings: enabled flag + optional surcharge, e.g. COD enabled with +5 SAR fee

    private StoreConfiguration() : base(StoreConfigurationId.Empty) { }

    public static Result<StoreConfiguration> CreateDefault(StoreId storeId)
    {
        var config = new StoreConfiguration
        {
            Id = StoreConfigurationId.New(),
            StoreId = storeId,
            PageToggles = PageToggles.CreateDefault(),
            FeatureToggles = FeatureToggles.CreateDefault(),
            CustomerAuthSettings = CustomerAuthSettings.CreateDefault(),
            CommunicationSettings = CommunicationSettings.CreateDefault(),
            AiAssistantSettings = AiAssistantSettings.CreateDefault(),
            LocalizationSettings = LocalizationSettings.CreateDefault(),
            SocialLinks = SocialLinks.CreateDefault(),
            HeaderVariant = "header-minimal",
            FooterVariant = "footer-standard",
            ProductCardVariant = "card-standard",
            ProductGridVariant = "grid-standard",
            SearchSettings = SearchSettings.CreateDefault(),
            TaxSettings = TaxSettings.CreateDefault(),
            ReviewsRequirePurchase = true,
            ReviewsAutoApprove = false,
            ReviewsAllowEditing = true,
            RelatedProductsManual = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        config.RaiseDomainEvent(new StoreConfigurationCreatedEvent(config.Id, storeId));

        return Result.Success(config);
    }

    public Result UpdatePageToggles(PageToggles pageToggles)
    {
        PageToggles = pageToggles;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateFeatureToggles(FeatureToggles featureToggles)
    {
        FeatureToggles = featureToggles;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateReviewSettings(bool requirePurchase, bool autoApprove, bool allowEditing)
    {
        ReviewsRequirePurchase = requirePurchase;
        ReviewsAutoApprove = autoApprove;
        ReviewsAllowEditing = allowEditing;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateTaxSettings(TaxSettings taxSettings)
    {
        TaxSettings = taxSettings;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateRelatedProductsMode(bool manual)
    {
        RelatedProductsManual = manual;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateCustomerAuthSettings(CustomerAuthSettings settings)
    {
        CustomerAuthSettings = settings;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateCommunicationSettings(CommunicationSettings settings)
    {
        CommunicationSettings = settings;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateAiAssistantSettings(AiAssistantSettings settings)
    {
        AiAssistantSettings = settings;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateLocalizationSettings(LocalizationSettings settings)
    {
        LocalizationSettings = settings;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateSocialLinks(SocialLinks socialLinks)
    {
        SocialLinks = socialLinks;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateLayoutVariants(
        string headerVariant, string footerVariant,
        string productCardVariant, string productGridVariant)
    {
        HeaderVariant = headerVariant;
        FooterVariant = footerVariant;
        ProductCardVariant = productCardVariant;
        ProductGridVariant = productGridVariant;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateSearchSettings(SearchSettings settings)
    {
        SearchSettings = settings;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Replaces the entire payment method adjustment list with a new set.
    /// Pass an empty list to remove all adjustments.
    /// </summary>
    public Result SetPaymentMethodAdjustments(IEnumerable<PaymentMethodAdjustment> adjustments)
    {
        _paymentMethodAdjustments.Clear();
        _paymentMethodAdjustments.AddRange(adjustments);
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }
}
