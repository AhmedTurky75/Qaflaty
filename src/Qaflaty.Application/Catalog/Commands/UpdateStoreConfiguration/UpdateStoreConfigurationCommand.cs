using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdateStoreConfiguration;

public record UpdateStoreConfigurationCommand(
    Guid StoreId,
    PageTogglesDto PageToggles,
    FeatureTogglesDto FeatureToggles,
    CustomerAuthSettingsDto CustomerAuthSettings,
    CommunicationSettingsDto CommunicationSettings,
    LocalizationSettingsDto LocalizationSettings,
    SocialLinksDto SocialLinks,
    string HeaderVariant,
    string FooterVariant,
    string ProductCardVariant,
    string ProductGridVariant
) : ICommand<StoreConfigurationDto>;
