using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Aggregates.PromoCode;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.CreatePromoCode;

public class CreatePromoCodeCommandHandler : ICommandHandler<CreatePromoCodeCommand, PromoCodeDto>
{
    private readonly IPromoCodeRepository _promoCodeRepository;

    public CreatePromoCodeCommandHandler(IPromoCodeRepository promoCodeRepository)
    {
        _promoCodeRepository = promoCodeRepository;
    }

    public async Task<Result<PromoCodeDto>> Handle(CreatePromoCodeCommand request, CancellationToken ct)
    {
        if (!Enum.TryParse<PromoDiscountType>(request.DiscountType, out var discountType))
            return Result.Failure<PromoCodeDto>(PromoCodeErrors.InvalidValue);

        if (await _promoCodeRepository.CodeExistsAsync(request.StoreId, request.Code, ct))
            return Result.Failure<PromoCodeDto>(PromoCodeErrors.CodeAlreadyExists);

        // Safe default: an unspecified per-customer limit becomes 1. Unlimited is only
        // honoured when the merchant explicitly opts in via UnlimitedPerCustomer.
        var usageLimitPerCustomer = request.UnlimitedPerCustomer
            ? (int?)null
            : request.UsageLimitPerCustomer ?? 1;

        var result = PromoCode.Create(
            request.StoreId,
            request.Code,
            request.Description,
            discountType,
            request.Value,
            request.MinimumOrderAmount,
            request.MaxDiscountAmount,
            request.StartsAt,
            request.ExpiresAt,
            request.UsageLimit,
            usageLimitPerCustomer);

        if (result.IsFailure)
            return Result.Failure<PromoCodeDto>(result.Error);

        await _promoCodeRepository.AddAsync(result.Value, ct);
        return Result.Success(result.Value.ToDto());
    }
}
