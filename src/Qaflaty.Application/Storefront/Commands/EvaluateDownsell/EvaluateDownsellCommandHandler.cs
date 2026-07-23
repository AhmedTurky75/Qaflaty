using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Storefront.Recommendations;
using Qaflaty.Application.Storefront.Recommendations.DownSell;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Aggregates.Downsell;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.EvaluateDownsell;

/// <summary>Default number of cheaper alternatives to consider showing alongside (or instead of) a coupon.</summary>
public class EvaluateDownsellCommandHandler : ICommandHandler<EvaluateDownsellCommand, DownsellDecisionDto?>
{
    private const int MaxDownsellProducts = 3;

    private readonly IStoreConfigurationRepository _storeConfigRepository;
    private readonly IDownsellTriggerRuleRepository _ruleRepository;
    private readonly IDownsellOfferRepository _offerRepository;
    private readonly IDownsellEventRepository _eventRepository;
    private readonly IDownsellFrequencyCapStore _frequencyCapStore;
    private readonly IProductRepository _productRepository;
    private readonly IPromoCodeRepository _promoCodeRepository;
    private readonly IDownSellRecommendationService _recommendationService;

    public EvaluateDownsellCommandHandler(
        IStoreConfigurationRepository storeConfigRepository,
        IDownsellTriggerRuleRepository ruleRepository,
        IDownsellOfferRepository offerRepository,
        IDownsellEventRepository eventRepository,
        IDownsellFrequencyCapStore frequencyCapStore,
        IProductRepository productRepository,
        IPromoCodeRepository promoCodeRepository,
        IDownSellRecommendationService recommendationService)
    {
        _storeConfigRepository = storeConfigRepository;
        _ruleRepository = ruleRepository;
        _offerRepository = offerRepository;
        _eventRepository = eventRepository;
        _frequencyCapStore = frequencyCapStore;
        _productRepository = productRepository;
        _promoCodeRepository = promoCodeRepository;
        _recommendationService = recommendationService;
    }

    public async Task<Result<DownsellDecisionDto?>> Handle(EvaluateDownsellCommand request, CancellationToken ct)
    {
        var config = await _storeConfigRepository.GetByStoreIdAsync(request.StoreId, ct);
        if (config is null || !config.DownsellEnabled)
            return Result.Success<DownsellDecisionDto?>(null);

        // Defense-in-depth: the client only signals that it detected a raw browser event — the
        // server is the one that decides whether that signal corresponds to an enabled rule, and
        // (for duration-based triggers) whether the reported duration actually meets the threshold.
        var rules = await _ruleRepository.GetByStoreIdAsync(request.StoreId, ct);
        var rule = rules.FirstOrDefault(r =>
            r.IsEnabled && r.TriggerType == request.TriggerType && r.Surface == request.Surface);

        if (rule is null)
            return Result.Success<DownsellDecisionDto?>(null);

        if (rule.ThresholdSeconds is { } threshold && (request.ElapsedSeconds ?? 0) < threshold)
            return Result.Success<DownsellDecisionDto?>(null);

        if (request.ProductId is null)
            return Result.Success<DownsellDecisionDto?>(null);

        var offer = await _offerRepository.GetByProductIdAsync(request.ProductId.Value, ct);
        if (offer is null || !offer.IsEnabled)
            return Result.Success<DownsellDecisionDto?>(null);

        var source = await _productRepository.GetByIdWithPropertyValuesAsync(request.ProductId.Value, ct);
        if (source is null)
            return Result.Success<DownsellDecisionDto?>(null);

        var downsellProducts = await _recommendationService.RecommendForProductAsync(
            source, config.DownsellExcludeOutOfStock, MaxDownsellProducts, ct);
        var downsellDtos = downsellProducts.Select(ProductRecommendationMapper.Map).ToList();

        DownsellCouponPreviewDto? couponPreview = null;
        if (offer.PromoCodeId is not null)
        {
            var promo = await _promoCodeRepository.GetByIdAsync(offer.PromoCodeId.Value, ct);
            var now = DateTime.UtcNow;

            if (promo is not null && promo.IsActive
                && (!promo.StartsAt.HasValue || now >= promo.StartsAt.Value)
                && (!promo.ExpiresAt.HasValue || now <= promo.ExpiresAt.Value))
            {
                couponPreview = new DownsellCouponPreviewDto(
                    promo.Code, promo.DiscountType.ToString(), promo.Value, promo.Description);
            }
        }

        if (downsellDtos.Count == 0 && couponPreview is null)
            return Result.Success<DownsellDecisionDto?>(null);

        // Frequency cap is checked last so a session that has nothing to show never burns
        // through its allowance.
        if (!_frequencyCapStore.TryRecordImpression(
                request.StoreId, request.SessionKey, config.DownsellMaxShowsPerSession, config.DownsellMinIntervalSeconds))
            return Result.Success<DownsellDecisionDto?>(null);

        var impression = DownsellEvent.Create(
            request.StoreId, request.ProductId, DownsellEventType.Impression, request.TriggerType, request.SessionKey);
        await _eventRepository.AddAsync(impression, ct);

        return Result.Success<DownsellDecisionDto?>(new DownsellDecisionDto(downsellDtos, couponPreview));
    }
}
