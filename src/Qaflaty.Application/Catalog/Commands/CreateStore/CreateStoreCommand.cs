using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.CreateStore;

public record CreateStoreCommand(
    string Slug,
    string Name,
    string? Description = null,
    string? LogoUrl = null,
    string PrimaryColor = "#4F46E5",
    decimal DeliveryFee = 0,
    decimal? FreeDeliveryThreshold = null
) : ICommand<StoreDto>;
