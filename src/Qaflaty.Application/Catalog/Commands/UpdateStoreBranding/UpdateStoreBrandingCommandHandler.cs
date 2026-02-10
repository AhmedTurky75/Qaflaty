using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.UpdateStoreBranding;

public class UpdateStoreBrandingCommandHandler : ICommandHandler<UpdateStoreBrandingCommand>
{
    private readonly IStoreRepository _storeRepository;

    public UpdateStoreBrandingCommandHandler(IStoreRepository storeRepository)
    {
        _storeRepository = storeRepository;
    }

    public async Task<Result> Handle(UpdateStoreBrandingCommand request, CancellationToken cancellationToken)
    {
        var store = await _storeRepository.GetByIdAsync(StoreId.From(request.StoreId), cancellationToken);
        if (store == null)
            return Result.Failure(new Error("Store.NotFound", "Store not found"));

        var brandingResult = StoreBranding.Create(request.LogoUrl, request.PrimaryColor);
        if (brandingResult.IsFailure)
            return Result.Failure(brandingResult.Error);

        var updateResult = store.UpdateBranding(brandingResult.Value);
        if (updateResult.IsFailure)
            return updateResult;

        _storeRepository.Update(store);

        return Result.Success();
    }
}
