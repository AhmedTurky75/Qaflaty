using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.UpdatePromoCode;

public class UpdatePromoCodeCommandHandler : ICommandHandler<UpdatePromoCodeCommand, PromoCodeDto>
{
    private readonly IPromoCodeRepository _promoCodeRepository;

    public UpdatePromoCodeCommandHandler(IPromoCodeRepository promoCodeRepository)
    {
        _promoCodeRepository = promoCodeRepository;
    }

    public async Task<Result<PromoCodeDto>> Handle(UpdatePromoCodeCommand request, CancellationToken ct)
    {
        if (!Enum.TryParse<PromoDiscountType>(request.DiscountType, out var discountType))
            return Result.Failure<PromoCodeDto>(PromoCodeErrors.InvalidValue);

        var promo = await _promoCodeRepository.GetByIdAsync(request.Id, ct);
        if (promo is null || promo.StoreId != request.StoreId)
            return Result.Failure<PromoCodeDto>(PromoCodeErrors.NotFound);

        var result = promo.Update(
            request.Description,
            discountType,
            request.Value,
            request.MinimumOrderAmount,
            request.MaxDiscountAmount,
            request.StartsAt,
            request.ExpiresAt,
            request.UsageLimit,
            request.UsageLimitPerCustomer);

        if (result.IsFailure)
            return Result.Failure<PromoCodeDto>(result.Error);

        _promoCodeRepository.Update(promo);
        return Result.Success(promo.ToDto());
    }
}
