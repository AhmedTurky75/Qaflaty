using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.RelatedProduct;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.ManualRelated;

public class SetManualRelatedProductsCommandHandler : ICommandHandler<SetManualRelatedProductsCommand>
{
    private readonly IRelatedProductRepository _relatedProductRepository;

    public SetManualRelatedProductsCommandHandler(IRelatedProductRepository relatedProductRepository)
    {
        _relatedProductRepository = relatedProductRepository;
    }

    public async Task<Result> Handle(SetManualRelatedProductsCommand request, CancellationToken ct)
    {
        // Replace the existing curated set with the new ordered selection.
        var existing = await _relatedProductRepository.GetByProductIdAsync(
            request.ProductId, ProductRelationType.Related, ct);
        if (existing.Count > 0)
            _relatedProductRepository.RemoveRange(existing);

        var sortOrder = 0;
        foreach (var relatedId in request.RelatedProductIds.Distinct())
        {
            if (relatedId == request.ProductId.Value)
                continue; // a product cannot be related to itself

            var link = RelatedProductLink.Create(
                request.StoreId,
                request.ProductId,
                new ProductId(relatedId),
                sortOrder++,
                ProductRelationType.Related);

            await _relatedProductRepository.AddAsync(link, ct);
        }

        return Result.Success();
    }
}
