using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.UpdateStore;

public sealed class UpdateStoreCommandHandler : ICommandHandler<UpdateStoreCommand, StoreDto>
{
    private readonly IStoreRepository _storeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateStoreCommandHandler(
        IStoreRepository storeRepository,
        IUnitOfWork unitOfWork)
    {
        _storeRepository = storeRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<StoreDto>> Handle(UpdateStoreCommand request, CancellationToken cancellationToken)
    {
        // Get the store
        var storeId = new StoreId(request.StoreId);
        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);

        if (store is null)
        {
            return Result.Failure<StoreDto>(CatalogErrors.StoreNotFound);
        }

        // Create StoreName value object
        var nameResult = StoreName.Create(request.Name);
        if (nameResult.IsFailure)
        {
            return Result.Failure<StoreDto>(nameResult.Error);
        }

        // Update store info
        var updateResult = store.UpdateInfo(nameResult.Value, request.Description);
        if (updateResult.IsFailure)
        {
            return Result.Failure<StoreDto>(updateResult.Error);
        }

        // Persist changes
        _storeRepository.Update(store);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Map to DTO
        var storeDto = new StoreDto(
            Id: store.Id.Value,
            MerchantId: store.MerchantId.Value,
            Slug: store.Slug.Value,
            Name: store.Name.Value,
            Description: store.Description,
            Branding: new StoreBrandingDto(
                LogoUrl: store.Branding.LogoUrl,
                PrimaryColor: store.Branding.PrimaryColor
            ),
            Status: store.Status.ToString(),
            DeliverySettings: new DeliverySettingsDto(
                DeliveryFee: new MoneyDto(
                    Amount: store.DeliverySettings.DeliveryFee.Amount,
                    Currency: store.DeliverySettings.DeliveryFee.Currency.ToString()
                ),
                FreeDeliveryThreshold: store.DeliverySettings.FreeDeliveryThreshold is not null
                    ? new MoneyDto(
                        Amount: store.DeliverySettings.FreeDeliveryThreshold.Amount,
                        Currency: store.DeliverySettings.FreeDeliveryThreshold.Currency.ToString()
                    )
                    : null
            ),
            CustomDomain: store.CustomDomain,
            CreatedAt: store.CreatedAt,
            UpdatedAt: store.UpdatedAt
        );

        return Result.Success(storeDto);
    }
}
