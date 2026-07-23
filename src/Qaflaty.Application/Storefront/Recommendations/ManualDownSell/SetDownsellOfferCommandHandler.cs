using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Downsell;
using Qaflaty.Domain.Storefront.Aggregates.RelatedProduct;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.ManualDownSell;

public class SetDownsellOfferCommandHandler : ICommandHandler<SetDownsellOfferCommand>
{
    private readonly IRelatedProductRepository _relatedProductRepository;
    private readonly IDownsellOfferRepository _offerRepository;
    private readonly IPromoCodeRepository _promoCodeRepository;

    public SetDownsellOfferCommandHandler(
        IRelatedProductRepository relatedProductRepository,
        IDownsellOfferRepository offerRepository,
        IPromoCodeRepository promoCodeRepository)
    {
        _relatedProductRepository = relatedProductRepository;
        _offerRepository = offerRepository;
        _promoCodeRepository = promoCodeRepository;
    }

    public async Task<Result> Handle(SetDownsellOfferCommand request, CancellationToken ct)
    {
        PromoCodeId? promoCodeId = null;
        if (request.PromoCodeId is { } rawPromoCodeId)
        {
            var promo = await _promoCodeRepository.GetByIdAsync(new PromoCodeId(rawPromoCodeId), ct);
            if (promo is null || promo.StoreId != request.StoreId)
                return Result.Failure(new Error("Downsell.InvalidPromoCode", "Coupon not found for this store."));

            promoCodeId = promo.Id;
        }

        // Replace the cheaper-alternative picks (RelatedProductLink with RelationType.DownSell).
        var existingLinks = await _relatedProductRepository.GetByProductIdAsync(
            request.ProductId, ProductRelationType.DownSell, ct);
        if (existingLinks.Count > 0)
            _relatedProductRepository.RemoveRange(existingLinks);

        var sortOrder = 0;
        foreach (var downsellId in request.DownsellProductIds.Distinct())
        {
            if (downsellId == request.ProductId.Value)
                continue; // a product cannot be a downgrade of itself

            var link = RelatedProductLink.Create(
                request.StoreId,
                request.ProductId,
                new ProductId(downsellId),
                sortOrder++,
                ProductRelationType.DownSell);

            await _relatedProductRepository.AddAsync(link, ct);
        }

        // Upsert the coupon + enabled flag.
        var offer = await _offerRepository.GetByProductIdAsync(request.ProductId, ct);
        if (offer is null)
        {
            offer = DownsellOffer.Create(request.StoreId, request.ProductId, promoCodeId, request.IsEnabled);
            await _offerRepository.AddAsync(offer, ct);
        }
        else
        {
            offer.Update(promoCodeId, request.IsEnabled);
            _offerRepository.Update(offer);
        }

        return Result.Success();
    }
}
