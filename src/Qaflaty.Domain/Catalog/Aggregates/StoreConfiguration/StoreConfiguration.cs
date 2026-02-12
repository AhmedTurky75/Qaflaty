using Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration.Events;
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
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

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
}
