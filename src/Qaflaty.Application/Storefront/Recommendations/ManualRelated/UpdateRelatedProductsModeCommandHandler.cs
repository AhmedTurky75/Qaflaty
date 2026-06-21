using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Storefront.Recommendations.ManualRelated;

public class UpdateRelatedProductsModeCommandHandler : ICommandHandler<UpdateRelatedProductsModeCommand>
{
    private readonly IStoreConfigurationRepository _storeConfigRepository;

    public UpdateRelatedProductsModeCommandHandler(IStoreConfigurationRepository storeConfigRepository)
    {
        _storeConfigRepository = storeConfigRepository;
    }

    public async Task<Result> Handle(UpdateRelatedProductsModeCommand request, CancellationToken ct)
    {
        var config = await _storeConfigRepository.GetByStoreIdAsync(request.StoreId, ct);
        if (config is null)
            return Result.Failure(new Error("StoreConfiguration.NotFound", "Store configuration not found."));

        config.UpdateRelatedProductsMode(request.Manual);
        _storeConfigRepository.Update(config);
        return Result.Success();
    }
}
