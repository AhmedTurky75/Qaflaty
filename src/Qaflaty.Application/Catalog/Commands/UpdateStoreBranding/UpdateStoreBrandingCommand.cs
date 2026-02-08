using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdateStoreBranding;

public record UpdateStoreBrandingCommand(
    Guid StoreId,
    string? LogoUrl,
    string PrimaryColor
) : ICommand;
