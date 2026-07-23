using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Storefront.Recommendations.GetFrequentlyBoughtTogether;
using Qaflaty.Application.Storefront.Recommendations.GetMostViewedProducts;
using Qaflaty.Application.Storefront.Recommendations.GetNewArrivals;
using Qaflaty.Application.Storefront.Recommendations.GetProductCrossSell;
using Qaflaty.Application.Storefront.Recommendations.GetProductUpSell;
using Qaflaty.Application.Storefront.Recommendations.GetRecentlyViewedProducts;
using Qaflaty.Application.Storefront.Recommendations.GetRelatedProducts;
using Qaflaty.Application.Storefront.Recommendations.TrackProductView;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/storefront")]
public class StorefrontRecommendationsController : ApiController
{
    private readonly ITenantContext _tenantContext;

    public StorefrontRecommendationsController(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    [HttpPost("products/{productId:guid}/view")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> TrackView(
        Guid productId, [FromBody] TrackViewRequest? request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var command = new TrackProductViewCommand(
            _tenantContext.CurrentStoreId.Value,
            new ProductId(productId),
            CurrentUserService.CustomerId,
            request?.SessionId);

        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpGet("products/{productId:guid}/related")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRelated(Guid productId, [FromQuery] int take = 8, CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetRelatedProductsQuery(new ProductId(productId), take), ct);
        return HandleResult(result);
    }

    [HttpGet("products/{productId:guid}/cross-sell")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCrossSell(Guid productId, [FromQuery] int take = 4, CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetProductCrossSellQuery(new ProductId(productId), take), ct);
        return HandleResult(result);
    }

    [HttpGet("products/{productId:guid}/upsell")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUpSell(Guid productId, [FromQuery] int take = 4, CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetProductUpSellQuery(new ProductId(productId), take), ct);
        return HandleResult(result);
    }

    [HttpGet("products/{productId:guid}/frequently-bought-together")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFrequentlyBoughtTogether(
        Guid productId, [FromQuery] int take = 4, CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetFrequentlyBoughtTogetherQuery(new ProductId(productId), take), ct);
        return HandleResult(result);
    }

    [HttpGet("products/most-viewed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMostViewed(
        [FromQuery] int? days, [FromQuery] int take = 8, CancellationToken ct = default)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var result = await Sender.Send(
            new GetMostViewedProductsQuery(_tenantContext.CurrentStoreId.Value, days, take), ct);
        return HandleResult(result);
    }

    [HttpGet("products/trending")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTrending([FromQuery] int take = 8, CancellationToken ct = default)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        // Trending = most viewed within the last 7 days.
        var result = await Sender.Send(
            new GetMostViewedProductsQuery(_tenantContext.CurrentStoreId.Value, 7, take), ct);
        return HandleResult(result);
    }

    [HttpGet("products/new-arrivals")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNewArrivals([FromQuery] int take = 8, CancellationToken ct = default)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var result = await Sender.Send(new GetNewArrivalsQuery(_tenantContext.CurrentStoreId.Value, take), ct);
        return HandleResult(result);
    }

    [HttpGet("customers/me/recently-viewed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecentlyViewed(
        [FromQuery] string? sessionId, [FromQuery] int take = 8, CancellationToken ct = default)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var result = await Sender.Send(
            new GetRecentlyViewedProductsQuery(
                _tenantContext.CurrentStoreId.Value,
                CurrentUserService.CustomerId,
                sessionId,
                take), ct);
        return HandleResult(result);
    }
}

public record TrackViewRequest(string? SessionId);
