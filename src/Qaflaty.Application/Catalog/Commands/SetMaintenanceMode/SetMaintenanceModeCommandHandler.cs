using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.SetMaintenanceMode;

public sealed class SetMaintenanceModeCommandHandler : ICommandHandler<SetMaintenanceModeCommand>
{
    private readonly IStoreRepository _storeRepository;

    public SetMaintenanceModeCommandHandler(IStoreRepository storeRepository)
    {
        _storeRepository = storeRepository;
    }

    public async Task<Result> Handle(SetMaintenanceModeCommand request, CancellationToken cancellationToken)
    {
        var store = await _storeRepository.GetByIdAsync(new StoreId(request.StoreId), cancellationToken);
        if (store is null)
            return Result.Failure(CatalogErrors.StoreNotFound);

        var result = store.SetMaintenance(request.Enabled);
        if (result.IsFailure)
            return result;

        _storeRepository.Update(store);
        return Result.Success();
    }
}
