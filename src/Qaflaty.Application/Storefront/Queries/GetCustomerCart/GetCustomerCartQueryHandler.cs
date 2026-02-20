using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.Common;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Queries.GetCustomerCart;

public class GetCustomerCartQueryHandler : IQueryHandler<GetCustomerCartQuery, CartDto?>
{
    private readonly ICartRepository _cartRepository;

    public GetCustomerCartQueryHandler(ICartRepository cartRepository)
    {
        _cartRepository = cartRepository;
    }

    public async Task<Result<CartDto?>> Handle(GetCustomerCartQuery request, CancellationToken cancellationToken)
    {
        var cart = await CartOwnerResolver.ResolveExistingCartAsync(request.Owner, _cartRepository, cancellationToken);

        if (cart == null)
            return Result.Success<CartDto?>(null);

        var dto = new CartDto(
            cart.Id.Value,
            cart.CustomerId?.Value,
            cart.GuestId,
            cart.Items.Select(i => new CartItemDto(
                i.Id,
                i.ProductId.Value,
                i.VariantId,
                i.Quantity,
                i.AddedAt,
                i.UpdatedAt)).ToList(),
            cart.TotalItems,
            cart.CreatedAt,
            cart.UpdatedAt);

        return Result.Success<CartDto?>(dto);
    }
}
