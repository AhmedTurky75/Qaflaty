using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Api.Controllers.Requests;
using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Catalog.Queries.GetCategories;
using Qaflaty.Application.Catalog.Queries.GetProductBySlug;
using Qaflaty.Application.Catalog.Queries.GetStorefrontProducts;
using Qaflaty.Application.Common.Interfaces;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/storefront")]
public class StorefrontController : ApiController
{
    private readonly ITenantContext _tenantContext;

    public StorefrontController(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    [HttpGet("store")]
    public IActionResult GetStore()
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStore == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var store = _tenantContext.CurrentStore;
        var storeDto = new StorePublicDto(
            Id: store.Id.Value,
            Slug: store.Slug.Value,
            Name: store.Name.Value,
            Description: store.Description,
            Branding: new StoreBrandingDto(
                store.Branding.LogoUrl,
                store.Branding.PrimaryColor),
            Status: store.Status.ToString(),
            DeliverySettings: new DeliverySettingsDto(
                new MoneyDto(store.DeliverySettings.DeliveryFee.Amount, store.DeliverySettings.DeliveryFee.Currency.ToString()),
                store.DeliverySettings.FreeDeliveryThreshold != null
                    ? new MoneyDto(store.DeliverySettings.FreeDeliveryThreshold.Amount, store.DeliverySettings.FreeDeliveryThreshold.Currency.ToString())
                    : null));

        return Ok(storeDto);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(CancellationToken ct)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var result = await Sender.Send(new GetCategoriesQuery(_tenantContext.CurrentStoreId.Value.Value), ct);
        return Ok(result);
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts([FromQuery] GetProductsRequest request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStore == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var query = new GetStorefrontProductsQuery(
            _tenantContext.CurrentStore.Slug.Value,
            request.CategoryId,
            request.PageNumber,
            request.PageSize);

        var result = await Sender.Send(query, ct);
        return Ok(result);
    }

    [HttpGet("products/{slug}")]
    public async Task<IActionResult> GetProductBySlug(string slug, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var result = await Sender.Send(
            new GetProductBySlugQuery(_tenantContext.CurrentStoreId.Value.Value, slug), ct);
        return Ok(result);
    }
}
