using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Storefront.Common;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.AddCartItem;

public class AddCartItemCommandHandler : ICommandHandler<AddCartItemCommand>
{
    private readonly ICartRepository _cartRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AddCartItemCommandHandler(ICartRepository cartRepository, IUnitOfWork unitOfWork)
    {
        _cartRepository = cartRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(AddCartItemCommand request, CancellationToken cancellationToken)
    {
        if (request.Quantity > 100)
            return Result.Failure(new Error("Cart.QuantityTooHigh", "Quantity cannot exceed 100 per item"));

        var cart = await CartOwnerResolver.ResolveOrCreateCartAsync(request.Owner, _cartRepository, cancellationToken);

        if (cart.Items.Count >= 50)
            return Result.Failure(new Error("Cart.TooManyItems", "Cart cannot contain more than 50 distinct items"));

        var result = cart.AddItem(new ProductId(request.ProductId), request.Quantity, request.VariantId);
        if (result.IsFailure) return result;

        _cartRepository.Update(cart);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
