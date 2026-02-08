using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdateStore;

public record UpdateStoreCommand(
    Guid StoreId,
    string Name,
    string? Description
) : ICommand<StoreDto>;
