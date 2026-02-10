using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Aggregates.Store;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Errors;

namespace Qaflaty.Application.Catalog.Commands.CreateStore;

public class CreateStoreCommandHandler : ICommandHandler<CreateStoreCommand, StoreDto>
{
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public CreateStoreCommandHandler(
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<StoreDto>> Handle(CreateStoreCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.MerchantId == null)
            return Result.Failure<StoreDto>(IdentityErrors.MerchantNotFound);

        // Create slug value object
        var slugResult = StoreSlug.Create(request.Slug);
        if (slugResult.IsFailure)
            return Result.Failure<StoreDto>(slugResult.Error);

        // Check slug availability
        var isSlugAvailable = await _storeRepository.IsSlugAvailableAsync(slugResult.Value, null, cancellationToken);
        if (!isSlugAvailable)
            return Result.Failure<StoreDto>(new Error("Store.SlugTaken", "This slug is already taken"));

        // Create store name
        var nameResult = StoreName.Create(request.Name);
        if (nameResult.IsFailure)
            return Result.Failure<StoreDto>(nameResult.Error);

        // Create branding
        var brandingResult = StoreBranding.Create(request.LogoUrl, request.PrimaryColor);
        if (brandingResult.IsFailure)
            return Result.Failure<StoreDto>(brandingResult.Error);

        // Create delivery settings
        var deliveryFeeResult = Money.Create(request.DeliveryFee);
        if (deliveryFeeResult.IsFailure)
            return Result.Failure<StoreDto>(deliveryFeeResult.Error);

        Money? freeThreshold = null;
        if (request.FreeDeliveryThreshold.HasValue)
        {
            var thresholdResult = Money.Create(request.FreeDeliveryThreshold.Value);
            if (thresholdResult.IsFailure)
                return Result.Failure<StoreDto>(thresholdResult.Error);
            freeThreshold = thresholdResult.Value;
        }

        var deliverySettingsResult = DeliverySettings.Create(deliveryFeeResult.Value, freeThreshold);
        if (deliverySettingsResult.IsFailure)
            return Result.Failure<StoreDto>(deliverySettingsResult.Error);

        // Create store aggregate
        var storeResult = Store.Create(
            _currentUserService.MerchantId.Value,
            slugResult.Value,
            nameResult.Value,
            brandingResult.Value,
            deliverySettingsResult.Value);

        if (storeResult.IsFailure)
            return Result.Failure<StoreDto>(storeResult.Error);

        var store = storeResult.Value;

        if (!string.IsNullOrWhiteSpace(request.Description))
        {
            store.UpdateInfo(nameResult.Value, request.Description);
        }

        await _storeRepository.AddAsync(store, cancellationToken);

        var dto = new StoreDto(
            store.Id.Value,
            store.MerchantId.Value,
            store.Slug.Value,
            store.Name.Value,
            store.Description,
            new StoreBrandingDto(store.Branding.LogoUrl, store.Branding.PrimaryColor),
            store.Status.ToString(),
            new DeliverySettingsDto(
                new MoneyDto(store.DeliverySettings.DeliveryFee.Amount),
                store.DeliverySettings.FreeDeliveryThreshold != null
                    ? new MoneyDto(store.DeliverySettings.FreeDeliveryThreshold.Amount)
                    : null),
            store.CustomDomain,
            store.CreatedAt,
            store.UpdatedAt);

        return Result.Success(dto);
    }
}
