using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Storefront.Commands.UpdateReviewSettings;

public class UpdateReviewSettingsCommandHandler : ICommandHandler<UpdateReviewSettingsCommand>
{
    private readonly IStoreConfigurationRepository _storeConfigRepository;

    public UpdateReviewSettingsCommandHandler(IStoreConfigurationRepository storeConfigRepository)
    {
        _storeConfigRepository = storeConfigRepository;
    }

    public async Task<Result> Handle(UpdateReviewSettingsCommand request, CancellationToken ct)
    {
        var config = await _storeConfigRepository.GetByStoreIdAsync(request.StoreId, ct);
        if (config is null)
            return Result.Failure(new Error("StoreConfiguration.NotFound", "Store configuration not found."));

        var existing = config.FeatureToggles;
        var updatedToggles = FeatureToggles.Create(
            wishlist: existing.Wishlist,
            reviews: request.ReviewsEnabled,
            promoCodes: existing.PromoCodes,
            newsletter: existing.Newsletter,
            productSearch: existing.ProductSearch,
            socialLinks: existing.SocialLinks,
            analytics: existing.Analytics);

        config.UpdateFeatureToggles(updatedToggles);
        config.UpdateReviewSettings(request.RequirePurchase, request.AutoApprove, request.AllowEditing);

        _storeConfigRepository.Update(config);
        return Result.Success();
    }
}
