using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetStoreConfiguration;

public class GetStoreConfigurationQueryHandler : IQueryHandler<GetStoreConfigurationQuery, StoreConfigurationDto>
{
    private readonly IStoreConfigurationRepository _configRepo;

    public GetStoreConfigurationQueryHandler(IStoreConfigurationRepository configRepo)
    {
        _configRepo = configRepo;
    }

    public async Task<Result<StoreConfigurationDto>> Handle(GetStoreConfigurationQuery request, CancellationToken cancellationToken)
    {
        var config = await _configRepo.GetByStoreIdAsync(StoreId.From(request.StoreId), cancellationToken);
        if (config == null)
            return Result.Failure<StoreConfigurationDto>(CatalogErrors.StoreConfigurationNotFound);

        return Result.Success(MapToDto(config));
    }

    internal static StoreConfigurationDto MapToDto(Domain.Catalog.Aggregates.StoreConfiguration.StoreConfiguration config) => new(
        config.Id.Value,
        config.StoreId.Value,
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
        config.ProductGridVariant,
        config.CreatedAt,
        config.UpdatedAt);
}
