using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Queries.ValidatePromoCode;

public class ValidatePromoCodeQueryHandler : IQueryHandler<ValidatePromoCodeQuery, PromoCodeValidationDto>
{
    private readonly IPromoCodeRepository _promoCodeRepository;
    private readonly IProductRepository _productRepository;

    public ValidatePromoCodeQueryHandler(
        IPromoCodeRepository promoCodeRepository,
        IProductRepository productRepository)
    {
        _promoCodeRepository = promoCodeRepository;
        _productRepository = productRepository;
    }

    public async Task<Result<PromoCodeValidationDto>> Handle(ValidatePromoCodeQuery request, CancellationToken ct)
    {
        var code = request.Code?.Trim() ?? string.Empty;

        // Compute the subtotal server-side from the catalog so the client cannot spoof prices.
        decimal subtotal = 0m;
        foreach (var item in request.Items)
        {
            var product = await _productRepository.GetByIdAsync(new ProductId(item.ProductId), ct);
            if (product is null || product.StoreId != request.StoreId)
                continue;

            var unitPrice = product.Pricing.Price.Amount;
            if (item.VariantId.HasValue)
            {
                var variant = product.GetVariant(item.VariantId.Value);
                if (variant?.PriceOverride is not null)
                    unitPrice = variant.PriceOverride.Amount;
            }

            subtotal += unitPrice * item.Quantity;
        }

        var promo = await _promoCodeRepository.GetByCodeAsync(request.StoreId, code, ct);
        if (promo is null)
            return Result.Success(new PromoCodeValidationDto(
                false, code, null, 0m, subtotal, false, "This promo code is not valid."));

        // Per-customer limit is enforced at order placement; preview validates the shared rules only.
        var validation = promo.Validate(subtotal, DateTime.UtcNow, customerRedemptionCount: 0);
        if (validation.IsFailure)
            return Result.Success(new PromoCodeValidationDto(
                false, promo.Code, promo.DiscountType.ToString(), 0m, subtotal, false, validation.Error.Message));

        var freeShipping = promo.DiscountType == PromoDiscountType.FreeShipping;
        // Delivery fee is unknown at this stage, so the shipping discount is shown as a flag and
        // applied for real at checkout once the address (and fee) are known.
        var discount = freeShipping ? 0m : promo.CalculateDiscount(subtotal, 0m);

        return Result.Success(new PromoCodeValidationDto(
            true, promo.Code, promo.DiscountType.ToString(), discount, subtotal, freeShipping, null));
    }
}
