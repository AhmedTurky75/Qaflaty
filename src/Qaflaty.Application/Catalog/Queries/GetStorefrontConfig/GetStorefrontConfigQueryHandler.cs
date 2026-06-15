using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Aggregates.PaymentMethodDefinition;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetStorefrontConfig;

public class GetStorefrontConfigQueryHandler : IQueryHandler<GetStorefrontConfigQuery, StorefrontConfigDto>
{
    private readonly IStoreRepository _storeRepo;
    private readonly IStoreConfigurationRepository _configRepo;
    private readonly IPaymentMethodDefinitionRepository _definitionRepo;
    private readonly IProductPropertyDefinitionRepository _propertyDefinitionRepo;

    public GetStorefrontConfigQueryHandler(
        IStoreRepository storeRepo,
        IStoreConfigurationRepository configRepo,
        IPaymentMethodDefinitionRepository definitionRepo,
        IProductPropertyDefinitionRepository propertyDefinitionRepo)
    {
        _storeRepo = storeRepo;
        _configRepo = configRepo;
        _definitionRepo = definitionRepo;
        _propertyDefinitionRepo = propertyDefinitionRepo;
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

        var definitions = await _definitionRepo.GetAllActiveAsync(cancellationToken);
        var defMap = definitions.ToDictionary(d => d.Key, d => d, StringComparer.OrdinalIgnoreCase);

        // Load only the property definitions that are marked as filterable and are selected in SearchSettings
        var filterableIds = config.SearchSettings.FilterablePropertyDefinitionIds;
        var allPropertyDefs = await _propertyDefinitionRepo.GetByStoreAsync(storeId, cancellationToken);
        var filterablePropertyDefs = allPropertyDefs
            .Where(d => d.IsFilterable && filterableIds.Contains(d.Id.Value))
            .Select(d => new FilterablePropertyDefinitionDto(
                d.Id.Value,
                d.Name,
                d.DisplayName,
                d.Type.ToString(),
                d.Options))
            .ToList();

        var dto = new StorefrontConfigDto(
            store.Id.Value,
            store.Slug.Value,
            store.Name.Value,
            store.Description,
            new StoreBrandingDto(
                store.Branding.LogoUrl, store.Branding.PrimaryColor,
                store.Branding.SecondaryLogoUrl, store.Branding.FaviconUrl,
                store.Branding.AppleTouchIconUrl, store.Branding.OgImageUrl,
                store.Branding.SecondaryColor),
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
                config.CustomerAuthSettings.RequireEmailVerification,
                config.CustomerAuthSettings.RequireOtpOnPlaceOrder),
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
            store.Status == Qaflaty.Domain.Catalog.Enums.StoreStatus.Maintenance,
            new SearchSettingsDto(
                config.SearchSettings.EnableTextSearch,
                config.SearchSettings.EnableCategoryFilter,
                config.SearchSettings.EnablePriceFilter,
                config.SearchSettings.EnablePropertyFilters,
                config.SearchSettings.FilterablePropertyDefinitionIds,
                config.SearchSettings.AllowedSortOptions.Select(s => s.ToString()).ToList()),
            BuildPaymentDtos(config.PaymentMethodAdjustments, defMap),
            filterablePropertyDefs);

        return Result.Success(dto);
    }

    internal static List<PaymentMethodAdjustmentDto> BuildPaymentDtos(
        IReadOnlyCollection<PaymentMethodAdjustment> adjustments,
        Dictionary<string, PaymentMethodDefinition> defMap)
    {
        if (adjustments.Count == 0)
        {
            defMap.TryGetValue("COD", out var codDef);
            return [new PaymentMethodAdjustmentDto(
                Guid.Empty,
                "COD",
                FeeAdjustmentType.Fixed.ToString(),
                0m,
                null,
                true,
                codDef?.DefaultLabel ?? "Cash on Delivery",
                codDef?.DefaultDescription ?? "Pay when you receive your order")];
        }

        return adjustments.Select(a =>
        {
            defMap.TryGetValue(a.PaymentMethodKey, out var def);
            return new PaymentMethodAdjustmentDto(
                a.Id,
                a.PaymentMethodKey,
                a.AdjustmentType.ToString(),
                a.Value,
                a.DisplayLabel,
                a.IsEnabled,
                def?.DefaultLabel ?? a.PaymentMethodKey,
                def?.DefaultDescription ?? string.Empty);
        }).ToList();
    }
}
