using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.UpdateCartItemQuantity;

public class UpdateCartItemQuantityCommandHandler : ICommandHandler<UpdateCartItemQuantityCommand>
{
    private readonly ICartRepository _cartRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateCartItemQuantityCommandHandler(ICartRepository cartRepository, IUnitOfWork unitOfWork)
    {
        _cartRepository = cartRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(UpdateCartItemQuantityCommand request, CancellationToken cancellationToken)
    {
        var cart = await _cartRepository.GetByCustomerIdAsync(request.CustomerId, cancellationToken);
        if (cart == null)
            return Result.Failure(new Error("Cart.NotFound", "Cart not found"));

        var result = cart.UpdateItemQuantity(new ProductId(request.ProductId), request.Quantity, request.VariantId);
        if (result.IsFailure) return result;

        _cartRepository.Update(cart);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
