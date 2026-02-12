using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Cart;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.SyncCart;

public class SyncCartCommandHandler : ICommandHandler<SyncCartCommand, CartDto>
{
    private readonly ICartRepository _cartRepository;

    public SyncCartCommandHandler(ICartRepository cartRepository)
    {
        _cartRepository = cartRepository;
    }

    public async Task<Result<CartDto>> Handle(SyncCartCommand request, CancellationToken cancellationToken)
    {
        // Get or create server cart for customer
        var cart = await _cartRepository.GetByCustomerIdAsync(request.CustomerId, cancellationToken);

        if (cart == null)
        {
            var createResult = Cart.Create(request.CustomerId);
            if (createResult.IsFailure)
                return Result.Failure<CartDto>(createResult.Error);

            cart = createResult.Value;
            await _cartRepository.AddAsync(cart, cancellationToken);
        }

        // Merge guest cart items
        if (request.GuestItems.Any())
        {
            var guestItems = request.GuestItems
                .Select(gi => (new ProductId(gi.ProductId), gi.VariantId, gi.Quantity))
                .ToList();

            var mergeResult = cart.MergeGuestCart(guestItems);
            if (mergeResult.IsFailure)
                return Result.Failure<CartDto>(mergeResult.Error);

            _cartRepository.Update(cart);
        }

        // Map to DTO
        var dto = new CartDto(
            cart.Id.Value,
            cart.CustomerId.Value,
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

        return Result.Success(dto);
    }
}
