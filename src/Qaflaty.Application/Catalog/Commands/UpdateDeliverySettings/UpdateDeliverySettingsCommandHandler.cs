using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Application.Catalog.Commands.UpdateDeliverySettings;

public class UpdateDeliverySettingsCommandHandler : ICommandHandler<UpdateDeliverySettingsCommand>
{
    private readonly IStoreRepository _storeRepository;

    public UpdateDeliverySettingsCommandHandler(IStoreRepository storeRepository)
    {
        _storeRepository = storeRepository;
    }

    public async Task<Result> Handle(UpdateDeliverySettingsCommand request, CancellationToken cancellationToken)
    {
        var store = await _storeRepository.GetByIdAsync(StoreId.From(request.StoreId), cancellationToken);
        if (store == null)
            return Result.Failure(new Error("Store.NotFound", "Store not found"));

        var deliveryFeeResult = Money.Create(request.DeliveryFee);
        if (deliveryFeeResult.IsFailure)
            return Result.Failure(deliveryFeeResult.Error);

        Money? freeThreshold = null;
        if (request.FreeDeliveryThreshold.HasValue)
        {
            var thresholdResult = Money.Create(request.FreeDeliveryThreshold.Value);
            if (thresholdResult.IsFailure)
                return Result.Failure(thresholdResult.Error);
            freeThreshold = thresholdResult.Value;
        }

        var deliverySettingsResult = DeliverySettings.Create(deliveryFeeResult.Value, freeThreshold);
        if (deliverySettingsResult.IsFailure)
            return Result.Failure(deliverySettingsResult.Error);

        var updateResult = store.UpdateDeliverySettings(deliverySettingsResult.Value);
        if (updateResult.IsFailure)
            return updateResult;

        _storeRepository.Update(store);

        return Result.Success();
    }
}
