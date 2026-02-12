using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.UpdateStoreConfiguration;

public class UpdateStoreConfigurationCommandHandler : ICommandHandler<UpdateStoreConfigurationCommand, StoreConfigurationDto>
{
    private readonly IStoreConfigurationRepository _configurationRepository;

    public UpdateStoreConfigurationCommandHandler(IStoreConfigurationRepository configurationRepository)
    {
        _configurationRepository = configurationRepository;
    }

    public async Task<Result<StoreConfigurationDto>> Handle(
        UpdateStoreConfigurationCommand request,
        CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);
        var configuration = await _configurationRepository.GetByStoreIdAsync(storeId, cancellationToken);

        if (configuration == null)
            return Result.Failure<StoreConfigurationDto>(CatalogErrors.StoreConfigurationNotFound);

        // Update PageToggles
        var pageToggles = PageToggles.Create(
            request.PageToggles.AboutPage,
            request.PageToggles.ContactPage,
            request.PageToggles.FaqPage,
            request.PageToggles.TermsPage,
            request.PageToggles.PrivacyPage,
            request.PageToggles.ShippingReturnsPage,
            request.PageToggles.CartPage);
        configuration.UpdatePageToggles(pageToggles);

        // Update FeatureToggles
        var featureToggles = FeatureToggles.Create(
            request.FeatureToggles.Wishlist,
            request.FeatureToggles.Reviews,
            request.FeatureToggles.PromoCodes,
            request.FeatureToggles.Newsletter,
            request.FeatureToggles.ProductSearch,
            request.FeatureToggles.SocialLinks,
            request.FeatureToggles.Analytics);
        configuration.UpdateFeatureToggles(featureToggles);

        // Update CustomerAuthSettings
        if (!Enum.TryParse<CustomerAuthMode>(request.CustomerAuthSettings.Mode, true, out var authMode))
            return Result.Failure<StoreConfigurationDto>(
                new Error("StoreConfiguration.InvalidAuthMode", "Invalid customer authentication mode"));

        var customerAuthSettings = CustomerAuthSettings.Create(
            authMode,
            request.CustomerAuthSettings.AllowGuestCheckout,
            request.CustomerAuthSettings.RequireEmailVerification);
        configuration.UpdateCustomerAuthSettings(customerAuthSettings);

        // Update CommunicationSettings
        var communicationSettings = CommunicationSettings.Create(
            request.CommunicationSettings.WhatsAppEnabled,
            request.CommunicationSettings.WhatsAppNumber,
            request.CommunicationSettings.WhatsAppDefaultMessage,
            request.CommunicationSettings.LiveChatEnabled,
            request.CommunicationSettings.AiChatbotEnabled,
            request.CommunicationSettings.AiChatbotName);
        configuration.UpdateCommunicationSettings(communicationSettings);

        // Update LocalizationSettings
        var localizationSettings = LocalizationSettings.Create(
            request.LocalizationSettings.DefaultLanguage,
            request.LocalizationSettings.EnableBilingual,
            request.LocalizationSettings.DefaultDirection);
        configuration.UpdateLocalizationSettings(localizationSettings);

        // Update SocialLinks
        var socialLinks = SocialLinks.Create(
            request.SocialLinks.Facebook,
            request.SocialLinks.Instagram,
            request.SocialLinks.Twitter,
            request.SocialLinks.TikTok,
            request.SocialLinks.Snapchat,
            request.SocialLinks.YouTube);
        configuration.UpdateSocialLinks(socialLinks);

        // Update LayoutVariants
        configuration.UpdateLayoutVariants(
            request.HeaderVariant,
            request.FooterVariant,
            request.ProductCardVariant,
            request.ProductGridVariant);

        _configurationRepository.Update(configuration);

        var dto = MapToDto(configuration);
        return Result.Success(dto);
    }

    private static StoreConfigurationDto MapToDto(Domain.Catalog.Aggregates.StoreConfiguration.StoreConfiguration config)
    {
        return new StoreConfigurationDto(
            config.Id.Value,
            config.StoreId.Value,
            new PageTogglesDto(
                config.PageToggles.AboutPage,
                config.PageToggles.ContactPage,
                config.PageToggles.FaqPage,
                config.PageToggles.TermsPage,
                config.PageToggles.PrivacyPage,
                config.PageToggles.ShippingReturnsPage,
                config.PageToggles.CartPage),
            new FeatureTogglesDto(
                config.FeatureToggles.Wishlist,
                config.FeatureToggles.Reviews,
                config.FeatureToggles.PromoCodes,
                config.FeatureToggles.Newsletter,
                config.FeatureToggles.ProductSearch,
                config.FeatureToggles.SocialLinks,
                config.FeatureToggles.Analytics),
            new CustomerAuthSettingsDto(
                config.CustomerAuthSettings.Mode.ToString(),
                config.CustomerAuthSettings.AllowGuestCheckout,
                config.CustomerAuthSettings.RequireEmailVerification),
            new CommunicationSettingsDto(
                config.CommunicationSettings.WhatsAppEnabled,
                config.CommunicationSettings.WhatsAppNumber,
                config.CommunicationSettings.WhatsAppDefaultMessage,
                config.CommunicationSettings.LiveChatEnabled,
                config.CommunicationSettings.AiChatbotEnabled,
                config.CommunicationSettings.AiChatbotName),
            new LocalizationSettingsDto(
                config.LocalizationSettings.DefaultLanguage,
                config.LocalizationSettings.EnableBilingual,
                config.LocalizationSettings.DefaultDirection),
            new SocialLinksDto(
                config.SocialLinks.Facebook,
                config.SocialLinks.Instagram,
                config.SocialLinks.Twitter,
                config.SocialLinks.TikTok,
                config.SocialLinks.Snapchat,
                config.SocialLinks.YouTube),
            config.HeaderVariant,
            config.FooterVariant,
            config.ProductCardVariant,
            config.ProductGridVariant,
            config.CreatedAt,
            config.UpdatedAt);
    }
}
