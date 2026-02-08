using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.CreateStore;

public record CreateStoreCommand(
    string Slug,
    string Name,
    string? Description,
    string? LogoUrl,
    string PrimaryColor,
    decimal DeliveryFee,
    decimal? FreeDeliveryThreshold
) : ICommand<StoreDto>;
