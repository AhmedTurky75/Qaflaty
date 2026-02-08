using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;

namespace Qaflaty.Api.Middleware;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(
        HttpContext context,
        IStoreRepository storeRepository,
        ITenantContext tenantContext)
    {
        // Only apply to storefront routes
        if (!context.Request.Path.StartsWithSegments("/api/storefront"))
        {
            await _next(context);
            return;
        }

        // Try to get store identifier from headers
        var storeSlugHeader = context.Request.Headers["X-Store-Slug"].FirstOrDefault();
        var customDomainHeader = context.Request.Headers["X-Custom-Domain"].FirstOrDefault();

        if (string.IsNullOrEmpty(storeSlugHeader) && string.IsNullOrEmpty(customDomainHeader))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Tenant.Required",
                message = "Either X-Store-Slug or X-Custom-Domain header is required"
            });
            return;
        }

        Domain.Catalog.Aggregates.Store.Store? store = null;

        // Try to resolve by slug first
        if (!string.IsNullOrEmpty(storeSlugHeader))
        {
            var slugResult = StoreSlug.Create(storeSlugHeader);
            if (slugResult.IsSuccess)
            {
                store = await storeRepository.GetBySlugAsync(slugResult.Value, context.RequestAborted);
            }
        }

        // Try to resolve by custom domain if slug didn't work
        if (store == null && !string.IsNullOrEmpty(customDomainHeader))
        {
            store = await storeRepository.GetByCustomDomainAsync(customDomainHeader, context.RequestAborted);
        }

        // Store not found
        if (store == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Store.NotFound",
                message = "Store not found"
            });
            return;
        }

        // Check if store is active
        if (store.Status != StoreStatus.Active)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Store.Inactive",
                message = "Store is not active"
            });
            return;
        }

        // Set the store in tenant context
        tenantContext.SetStore(store);

        // Continue to next middleware
        await _next(context);
    }
}
