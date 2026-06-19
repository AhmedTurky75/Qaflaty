using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Storefront.Queries.GetReviewSettings;

public class GetReviewSettingsQueryHandler : IQueryHandler<GetReviewSettingsQuery, ReviewSettingsDto>
{
    private readonly IStoreConfigurationRepository _storeConfigRepository;

    public GetReviewSettingsQueryHandler(IStoreConfigurationRepository storeConfigRepository)
    {
        _storeConfigRepository = storeConfigRepository;
    }

    public async Task<Result<ReviewSettingsDto>> Handle(GetReviewSettingsQuery request, CancellationToken ct)
    {
        var config = await _storeConfigRepository.GetByStoreIdAsync(request.StoreId, ct);
        if (config is null)
            return Result.Failure<ReviewSettingsDto>(new Error("StoreConfiguration.NotFound", "Store configuration not found."));

        return Result.Success(new ReviewSettingsDto(
            ReviewsEnabled: config.FeatureToggles.Reviews,
            RequirePurchase: config.ReviewsRequirePurchase,
            AutoApprove: config.ReviewsAutoApprove,
            AllowEditing: config.ReviewsAllowEditing));
    }
}
