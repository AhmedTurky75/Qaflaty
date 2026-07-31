using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.RelatedProduct;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.ManualCrossSell;

public class SetCrossSellProductsCommandHandler : ICommandHandler<SetCrossSellProductsCommand>
{
    private readonly IRelatedProductRepository _relatedProductRepository;

    public SetCrossSellProductsCommandHandler(IRelatedProductRepository relatedProductRepository)
    {
        _relatedProductRepository = relatedProductRepository;
    }

    public async Task<Result> Handle(SetCrossSellProductsCommand request, CancellationToken ct)
    {
        // Replace the existing curated set with the new ordered selection.
        var existing = await _relatedProductRepository.GetByProductIdAsync(
            request.ProductId, ProductRelationType.CrossSell, ct);
        if (existing.Count > 0)
            _relatedProductRepository.RemoveRange(existing);

        var sortOrder = 0;
        foreach (var crossSellId in request.CrossSellProductIds.Distinct())
        {
            if (crossSellId == request.ProductId.Value)
                continue; // a product cannot be cross-sold alongside itself

            var link = RelatedProductLink.Create(
                request.StoreId,
                request.ProductId,
                new ProductId(crossSellId),
                sortOrder++,
                ProductRelationType.CrossSell);

            await _relatedProductRepository.AddAsync(link, ct);
        }

        return Result.Success();
    }
}
