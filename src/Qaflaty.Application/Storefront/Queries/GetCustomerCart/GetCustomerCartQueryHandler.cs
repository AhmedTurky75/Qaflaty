using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.Common;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Queries.GetCustomerCart;

public class GetCustomerCartQueryHandler : IQueryHandler<GetCustomerCartQuery, CartDto?>
{
    private readonly ICartRepository _cartRepository;
    private readonly IProductRepository _productRepository;

    public GetCustomerCartQueryHandler(ICartRepository cartRepository, IProductRepository productRepository)
    {
        _cartRepository = cartRepository;
        _productRepository = productRepository;
    }

    public async Task<Result<CartDto?>> Handle(GetCustomerCartQuery request, CancellationToken cancellationToken)
    {
        var cart = await CartOwnerResolver.ResolveExistingCartAsync(request.Owner, _cartRepository, cancellationToken);
        if (cart == null)
            return Result.Success<CartDto?>(null);

        var items = new List<CartItemDetailsDto>();

        foreach (var item in cart.Items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId, cancellationToken);
            if (product == null) continue; // skip stale/removed products

            var unitPrice = product.Pricing.Price;
            Dictionary<string, string>? variantAttributes = null;
            var maxQuantity = product.Inventory.Quantity;

            if (item.VariantId.HasValue)
            {
                var variant = product.Variants.FirstOrDefault(v => v.Id == item.VariantId.Value);
                if (variant != null)
                {
                    unitPrice = variant.PriceOverride ?? product.Pricing.Price;
                    variantAttributes = variant.Attributes;
                    maxQuantity = variant.Quantity;
                }
            }

            items.Add(new CartItemDetailsDto(
                item.Id,
                item.ProductId.Value,
                product.Name.Value,
                product.Slug.Value,
                item.VariantId,
                variantAttributes,
                unitPrice.Amount,
                unitPrice.Currency.ToString(),
                item.Quantity,
                product.Images.OrderBy(i => i.SortOrder).FirstOrDefault()?.Url,
                maxQuantity,
                item.AddedAt,
                item.UpdatedAt
            ));
        }

        var dto = new CartDto(
            cart.Id.Value,
            cart.CustomerId?.Value,
            cart.GuestId,
            items,
            cart.TotalItems,
            cart.CreatedAt,
            cart.UpdatedAt);

        return Result.Success<CartDto?>(dto);
    }
}
