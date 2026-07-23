using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.RelatedProduct;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.ManualUpSell;

/// <summary>
/// Saves the merchant's curated upsell picks as-is. A non-genuine "upgrade" (same price or
/// cheaper) is not rejected here — the storefront query-time strategy already filters those out,
/// so a mistaken pick simply never renders rather than blocking the merchant's save.
/// </summary>
public class SetUpSellProductsCommandHandler : ICommandHandler<SetUpSellProductsCommand>
{
    private readonly IRelatedProductRepository _relatedProductRepository;

    public SetUpSellProductsCommandHandler(IRelatedProductRepository relatedProductRepository)
    {
        _relatedProductRepository = relatedProductRepository;
    }

    public async Task<Result> Handle(SetUpSellProductsCommand request, CancellationToken ct)
    {
        var existing = await _relatedProductRepository.GetByProductIdAsync(
            request.ProductId, ProductRelationType.UpSell, ct);
        if (existing.Count > 0)
            _relatedProductRepository.RemoveRange(existing);

        var sortOrder = 0;
        foreach (var upSellId in request.UpSellProductIds.Distinct())
        {
            if (upSellId == request.ProductId.Value)
                continue; // a product cannot be an upgrade of itself

            var link = RelatedProductLink.Create(
                request.StoreId,
                request.ProductId,
                new ProductId(upSellId),
                sortOrder++,
                ProductRelationType.UpSell);

            await _relatedProductRepository.AddAsync(link, ct);
        }

        return Result.Success();
    }
}
