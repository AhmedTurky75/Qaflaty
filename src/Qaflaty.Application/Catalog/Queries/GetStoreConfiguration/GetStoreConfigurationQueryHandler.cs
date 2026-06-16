using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Aggregates.PaymentMethodDefinition;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetStoreConfiguration;

public class GetStoreConfigurationQueryHandler : IQueryHandler<GetStoreConfigurationQuery, StoreConfigurationDto>
{
    private readonly IStoreConfigurationRepository _configRepo;
    private readonly IPaymentMethodDefinitionRepository _definitionRepo;

    public GetStoreConfigurationQueryHandler(
        IStoreConfigurationRepository configRepo,
        IPaymentMethodDefinitionRepository definitionRepo)
    {
        _configRepo = configRepo;
        _definitionRepo = definitionRepo;
    }

    public async Task<Result<StoreConfigurationDto>> Handle(GetStoreConfigurationQuery request, CancellationToken cancellationToken)
    {
        var config = await _configRepo.GetByStoreIdAsync(StoreId.From(request.StoreId), cancellationToken);
        if (config == null)
            return Result.Failure<StoreConfigurationDto>(CatalogErrors.StoreConfigurationNotFound);

        var definitions = await _definitionRepo.GetAllActiveAsync(cancellationToken);
        var defMap = definitions.ToDictionary(d => d.Key, d => d, StringComparer.OrdinalIgnoreCase);

        return Result.Success(MapToDto(config, defMap));
    }

    internal static StoreConfigurationDto MapToDto(
        Domain.Catalog.Aggregates.StoreConfiguration.StoreConfiguration config,
        Dictionary<string, PaymentMethodDefinition> defMap) => new(
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
            config.CustomerAuthSettings.RequireEmailVerification,
            config.CustomerAuthSettings.RequireOtpOnPlaceOrder),
        new CommunicationSettingsDto(
            config.CommunicationSettings.WhatsAppEnabled, config.CommunicationSettings.WhatsAppNumber,
            config.CommunicationSettings.WhatsAppDefaultMessage, config.CommunicationSettings.LiveChatEnabled,
            config.CommunicationSettings.AiChatbotEnabled, config.CommunicationSettings.AiChatbotName),
        AiAssistantSettingsMapper.ToDto(config.AiAssistantSettings),
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
        new SearchSettingsDto(
            config.SearchSettings.EnableTextSearch,
            config.SearchSettings.EnableCategoryFilter,
            config.SearchSettings.EnablePriceFilter,
            config.SearchSettings.EnablePropertyFilters,
            config.SearchSettings.FilterablePropertyDefinitionIds,
            config.SearchSettings.AllowedSortOptions.Select(s => s.ToString()).ToList()),
        config.PaymentMethodAdjustments.Select(a =>
        {
            defMap.TryGetValue(a.PaymentMethodKey, out var def);
            return new PaymentMethodAdjustmentDto(
                a.Id, a.PaymentMethodKey, a.AdjustmentType.ToString(), a.Value, a.DisplayLabel, a.IsEnabled,
                def?.DefaultLabel ?? a.PaymentMethodKey, def?.DefaultDescription ?? string.Empty);
        }).ToList(),
        config.CreatedAt,
        config.UpdatedAt);
}
