using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetStorefrontConfig;

public class GetStorefrontConfigQueryHandler : IQueryHandler<GetStorefrontConfigQuery, StorefrontConfigDto>
{
    private readonly IStoreRepository _storeRepo;
    private readonly IStoreConfigurationRepository _configRepo;

    public GetStorefrontConfigQueryHandler(
        IStoreRepository storeRepo,
        IStoreConfigurationRepository configRepo)
    {
        _storeRepo = storeRepo;
        _configRepo = configRepo;
    }

    public async Task<Result<StorefrontConfigDto>> Handle(GetStorefrontConfigQuery request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);

        var store = await _storeRepo.GetByIdAsync(storeId, cancellationToken);
        if (store == null)
            return Result.Failure<StorefrontConfigDto>(CatalogErrors.StoreNotFound);

        var config = await _configRepo.GetByStoreIdAsync(storeId, cancellationToken);
        if (config == null)
            return Result.Failure<StorefrontConfigDto>(CatalogErrors.StoreConfigurationNotFound);

        var dto = new StorefrontConfigDto(
            store.Id.Value,
            store.Slug.Value,
            store.Name.Value,
            store.Description,
            new StoreBrandingDto(store.Branding.LogoUrl, store.Branding.PrimaryColor),
            new DeliverySettingsDto(
                new MoneyDto(store.DeliverySettings.DeliveryFee.Amount),
                store.DeliverySettings.FreeDeliveryThreshold != null
                    ? new MoneyDto(store.DeliverySettings.FreeDeliveryThreshold.Amount)
                    : null),
            new PageTogglesDto(
                config.PageToggles.AboutPage, config.PageToggles.ContactPage, config.PageToggles.FaqPage,
                config.PageToggles.TermsPage, config.PageToggles.PrivacyPage, config.PageToggles.ShippingReturnsPage,
                config.PageToggles.CartPage),
            new FeatureTogglesDto(
                config.FeatureToggles.Wishlist, config.FeatureToggles.Reviews, config.FeatureToggles.PromoCodes,
                config.FeatureToggles.Newsletter, config.FeatureToggles.ProductSearch, config.FeatureToggles.SocialLinks,
                config.FeatureToggles.Analytics),
            new CustomerAuthSettingsDto(
                config.CustomerAuthSettings.Mode.ToString(),
                config.CustomerAuthSettings.AllowGuestCheckout,
                config.CustomerAuthSettings.RequireEmailVerification),
            new CommunicationSettingsDto(
                config.CommunicationSettings.WhatsAppEnabled, config.CommunicationSettings.WhatsAppNumber,
                config.CommunicationSettings.WhatsAppDefaultMessage, config.CommunicationSettings.LiveChatEnabled,
                config.CommunicationSettings.AiChatbotEnabled, config.CommunicationSettings.AiChatbotName),
            new LocalizationSettingsDto(
                config.LocalizationSettings.DefaultLanguage, config.LocalizationSettings.EnableBilingual,
                config.LocalizationSettings.DefaultDirection),
            new SocialLinksDto(
                config.SocialLinks.Facebook, config.SocialLinks.Instagram, config.SocialLinks.Twitter,
                config.SocialLinks.TikTok, config.SocialLinks.Snapchat, config.SocialLinks.YouTube),
            config.HeaderVariant,
            config.FooterVariant,
            config.ProductCardVariant,
            config.ProductGridVariant);

        return Result.Success(dto);
    }
}
