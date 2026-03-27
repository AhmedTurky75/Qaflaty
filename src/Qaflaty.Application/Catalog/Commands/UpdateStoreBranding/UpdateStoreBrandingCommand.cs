using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdateStoreBranding;

public record UpdateStoreBrandingCommand(
    Guid StoreId,
    string? LogoUrl,
    string PrimaryColor,
    string? SecondaryLogoUrl = null,
    string? FaviconUrl = null,
    string? AppleTouchIconUrl = null,
    string? OgImageUrl = null,
    string? SecondaryColor = null
) : ICommand;
