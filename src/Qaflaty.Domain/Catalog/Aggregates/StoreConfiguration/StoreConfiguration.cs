using Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration.Events;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration;

public sealed class StoreConfiguration : AggregateRoot<StoreConfigurationId>
{
    public StoreId StoreId { get; private set; }
    public PageToggles PageToggles { get; private set; } = null!;
    public FeatureToggles FeatureToggles { get; private set; } = null!;
    public CustomerAuthSettings CustomerAuthSettings { get; private set; } = null!;
    public CommunicationSettings CommunicationSettings { get; private set; } = null!;
    public LocalizationSettings LocalizationSettings { get; private set; } = null!;
    public SocialLinks SocialLinks { get; private set; } = null!;
    public string HeaderVariant { get; private set; } = null!;
    public string FooterVariant { get; private set; } = null!;
    public string ProductCardVariant { get; private set; } = null!;
    public string ProductGridVariant { get; private set; } = null!;
    public SearchSettings SearchSettings { get; private set; } = null!;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private readonly List<PaymentMethod> _paymentMethods = [];
    public IReadOnlyList<PaymentMethod> PaymentMethods => _paymentMethods.AsReadOnly();

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
            LocalizationSettings = LocalizationSettings.CreateDefault(),
            SocialLinks = SocialLinks.CreateDefault(),
            HeaderVariant = "header-minimal",
            FooterVariant = "footer-standard",
            ProductCardVariant = "card-standard",
            ProductGridVariant = "grid-standard",
            SearchSettings = SearchSettings.CreateDefault(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        config.RaiseDomainEvent(new StoreConfigurationCreatedEvent(config.Id, storeId));
        return Result.Success(config);
    }

    // ── Payment Methods ────────────────────────────────────────────────────

    public Result<PaymentMethod> AddPaymentMethod(
        string key, string label, FeeAdjustmentType feeType = FeeAdjustmentType.None,
        decimal feeValue = 0m, string? description = null, int sortOrder = 0)
    {
        if (_paymentMethods.Any(p => !p.IsDeleted && p.Key.Equals(key, StringComparison.OrdinalIgnoreCase)))
            return Result.Failure<PaymentMethod>(
                new Error("PaymentMethod.DuplicateKey", $"A payment method with key '{key}' already exists"));

        var result = PaymentMethod.Create(key, label, feeType, feeValue, description, sortOrder);
        if (result.IsFailure) return result;

        _paymentMethods.Add(result.Value);
        UpdatedAt = DateTime.UtcNow;
        return result;
    }

    public Result UpdatePaymentMethod(Guid id, string label, string? description,
        FeeAdjustmentType feeType, decimal feeValue, bool isEnabled, int sortOrder)
    {
        var method = _paymentMethods.FirstOrDefault(p => p.Id == id && !p.IsDeleted);
        if (method is null)
            return Result.Failure(new Error("PaymentMethod.NotFound", "Payment method not found"));

        return method.Update(label, description, feeType, feeValue, isEnabled, sortOrder);
    }

    public Result SoftDeletePaymentMethod(Guid id)
    {
        var method = _paymentMethods.FirstOrDefault(p => p.Id == id && !p.IsDeleted);
        if (method is null)
            return Result.Failure(new Error("PaymentMethod.NotFound", "Payment method not found"));

        method.SoftDelete();
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result TogglePaymentMethod(Guid id, bool isEnabled)
    {
        var method = _paymentMethods.FirstOrDefault(p => p.Id == id && !p.IsDeleted);
        if (method is null)
            return Result.Failure(new Error("PaymentMethod.NotFound", "Payment method not found"));

        method.SetEnabled(isEnabled);
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    // ── Config Updates ─────────────────────────────────────────────────────

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
}
