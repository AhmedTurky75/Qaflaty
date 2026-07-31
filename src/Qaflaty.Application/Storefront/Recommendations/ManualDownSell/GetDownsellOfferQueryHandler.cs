using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.ManualDownSell;

/// <summary>Merchant view of one product's downsell configuration: cheaper picks + optional coupon.</summary>
public class GetDownsellOfferQueryHandler : IQueryHandler<GetDownsellOfferQuery, DownsellOfferDto>
{
    private readonly IRelatedProductRepository _relatedProductRepository;
    private readonly IProductRepository _productRepository;
    private readonly IDownsellOfferRepository _offerRepository;
    private readonly IPromoCodeRepository _promoCodeRepository;

    public GetDownsellOfferQueryHandler(
        IRelatedProductRepository relatedProductRepository,
        IProductRepository productRepository,
        IDownsellOfferRepository offerRepository,
        IPromoCodeRepository promoCodeRepository)
    {
        _relatedProductRepository = relatedProductRepository;
        _productRepository = productRepository;
        _offerRepository = offerRepository;
        _promoCodeRepository = promoCodeRepository;
    }

    public async Task<Result<DownsellOfferDto>> Handle(GetDownsellOfferQuery request, CancellationToken ct)
    {
        var links = await _relatedProductRepository.GetByProductIdAsync(
            request.ProductId, ProductRelationType.DownSell, ct);

        var storeProducts = await _productRepository.GetByStoreIdAsync(request.StoreId, ct);
        var byId = storeProducts.ToDictionary(p => p.Id.Value);

        var downsellProducts = links
            .Select(l => l.RelatedProductId.Value)
            .Where(byId.ContainsKey)
            .Select(id => ProductRecommendationMapper.Map(byId[id]))
            .ToList();

        var offer = await _offerRepository.GetByProductIdAsync(request.ProductId, ct);

        string? promoCode = null;
        if (offer?.PromoCodeId is not null)
        {
            var promo = await _promoCodeRepository.GetByIdAsync(offer.PromoCodeId.Value, ct);
            promoCode = promo?.Code;
        }

        var dto = new DownsellOfferDto(
            downsellProducts,
            offer?.PromoCodeId?.Value,
            promoCode,
            offer?.IsEnabled ?? false);

        return Result.Success(dto);
    }
}
